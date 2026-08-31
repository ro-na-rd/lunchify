import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [ssoStatus, setSsoStatus] = useState({ googleConfigured: false, demoMode: true });

  useEffect(() => {
    fetch('/auth/status')
      .then(res => res.json())
      .then(setSsoStatus)
      .catch(() => {});
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ssoToken = params.get('token');

    if (ssoToken) {
      localStorage.setItem('token', ssoToken);
      window.history.replaceState({}, '', window.location.pathname);

      fetch('/auth/me', { headers: { Authorization: `Bearer ${ssoToken}` } })
        .then(res => res.json())
        .then(data => {
          if (data.id) {
            localStorage.setItem('user', JSON.stringify(data));
            setToken(ssoToken);
            setUser(data);
          }
        })
        .catch(() => {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        })
        .finally(() => setLoading(false));
      return;
    }

    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const loginWithGoogle = useCallback(() => {
    window.location.href = '/auth/google';
  }, []);

  const login = async (email) => {
    const res = await fetch(`/auth/demo-token?email=${encodeURIComponent(email)}`);

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error);
    }

    const data = await res.json();
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
    return data.user;
  };

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    window.location.href = '/login';
  }, []);

  const getHeaders = () => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  });

  const apiFetch = async (url, options = {}) => {
    const res = await fetch(url, {
      ...options,
      headers: { ...getHeaders(), ...options.headers },
    });

    if (res.status === 401) {
      logout();
      throw new Error('Session expired');
    }

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error);
    }

    if (res.headers.get('content-type')?.includes('text/csv')) {
      return res.blob();
    }

    return res.json();
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, loginWithGoogle, logout, apiFetch, getHeaders, ssoStatus }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
