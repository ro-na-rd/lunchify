import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { IDP_HINT } from '../keycloak.js';

const AuthContext = createContext(null);

// Demo (email-only) login is a local development convenience. It is disabled
// in production builds — real users always come through Keycloak/Zoho SSO.
const DEMO_LOGIN_ENABLED = import.meta.env.DEV;

export function AuthProvider({ keycloak, authenticated, children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const kcRef = useRef(keycloak);

  // Always hand back a currently-valid token (Keycloak first, demo token otherwise).
  const getToken = useCallback(async () => {
    const kc = kcRef.current;
    if (kc?.authenticated) {
      try {
        await kc.updateToken(30);
      } catch {
        await kc.login({ idpHint: IDP_HINT });
        return null;
      }
      return kc.token;
    }
    return localStorage.getItem('demo_token');
  }, []);

  // Resolve the Lunchify profile (role / organization / restaurant) for the
  // authenticated identity. The server maps the SSO token -> Lunchify user.
  const loadProfile = useCallback(async (token) => {
    const res = await fetch('/auth/me', { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || 'Not authorized');
    return res.json();
  }, []);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        if (authenticated && kcRef.current?.token) {
          const profile = await loadProfile(kcRef.current.token);
          if (!cancelled) setUser(profile);
        } else if (DEMO_LOGIN_ENABLED) {
          const demoToken = localStorage.getItem('demo_token');
          const demoUser = localStorage.getItem('demo_user');
          if (demoToken && demoUser) {
            setUser(JSON.parse(demoUser));
          }
        }
      } catch (err) {
        console.error('Session load failed:', err);
        localStorage.removeItem('demo_token');
        localStorage.removeItem('demo_user');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [authenticated, loadProfile]);

  // Primary login: Keycloak -> straight to Zoho via idpHint.
  const login = useCallback(() => {
    return kcRef.current.login({
      idpHint: IDP_HINT,
      redirectUri: window.location.origin + '/',
    });
  }, []);

  // Dev-only: email-only demo login against the seeded users.
  const demoLogin = useCallback(async (email) => {
    if (!DEMO_LOGIN_ENABLED) throw new Error('Demo login is disabled');
    const res = await fetch(`/auth/demo-token?email=${encodeURIComponent(email)}`);
    if (!res.ok) throw new Error((await res.json()).error);
    const data = await res.json();
    localStorage.setItem('demo_token', data.token);
    localStorage.setItem('demo_user', JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('demo_token');
    localStorage.removeItem('demo_user');
    setUser(null);
    const kc = kcRef.current;
    if (kc?.authenticated) {
      kc.logout({ redirectUri: window.location.origin + '/login' });
    } else {
      window.location.href = '/login';
    }
  }, []);

  const apiFetch = useCallback(async (url, options = {}) => {
    const token = await getToken();
    const res = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    });

    if (res.status === 401) {
      logout();
      throw new Error('Session expired');
    }
    if (!res.ok) {
      throw new Error((await res.json().catch(() => ({}))).error || `Request failed (${res.status})`);
    }
    if (res.headers.get('content-type')?.includes('text/csv')) return res.blob();
    return res.json();
  }, [getToken, logout]);

  const getHeaders = useCallback(() => {
    const kc = kcRef.current;
    const token = kc?.authenticated ? kc.token : localStorage.getItem('demo_token');
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        demoLogin,
        demoLoginEnabled: DEMO_LOGIN_ENABLED,
        logout,
        apiFetch,
        getHeaders,
        getToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
