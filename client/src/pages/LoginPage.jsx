import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function GoogleIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

function ForkKnifeIcon() {
  return (
    <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 002-2V2" />
      <path d="M7 2v20" />
      <path d="M21 15V2v0a5 5 0 00-5 5v6c0 1.1.9 2 2 2h3zm0 0v7" />
    </svg>
  );
}

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [demoUsers, setDemoUsers] = useState([]);
  const [showDemos, setShowDemos] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { login, loginWithGoogle, ssoStatus } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    setMounted(true);
    fetch('/api/auth/users')
      .then((res) => res.json())
      .then(setDemoUsers)
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (ssoStatus && !ssoStatus.googleConfigured) {
      setShowDemos(true);
    }
  }, [ssoStatus]);

  const handleLogin = async (loginEmail) => {
    setError('');
    setLoading(true);
    try {
      const user = await login(loginEmail);
      if (user.role === 'employee') navigate('/employee');
      else if (user.role === 'admin') navigate('/admin');
      else navigate('/restaurant');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    await handleLogin(email);
  };

  const handleGoogleLogin = () => {
    loginWithGoogle();
  };

  const handleDemoClick = async (demoEmail) => {
    setEmail(demoEmail);
    await handleLogin(demoEmail);
  };

  const roleLabels = {
    employee: 'Employee',
    admin: 'Company Admin',
    restaurant_owner: 'Restaurant Owner',
  };
  const roleColors = {
    employee: 'bg-blue-50 text-blue-700 ring-blue-600/20',
    admin: 'bg-purple-50 text-purple-700 ring-purple-600/20',
    restaurant_owner: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  };

  return (
    <div className="min-h-screen flex bg-surface-0">
      {/* Left panel — desktop only */}
      <div className="hidden lg:flex lg:w-[48%] xl:w-[50%] relative overflow-hidden bg-gradient-to-br from-brand-600 via-brand-700 to-brand-800">
        <div className="absolute inset-0 overflow-hidden">
          <div
            className={`absolute -top-24 -left-24 w-96 h-96 rounded-full bg-white/5 transition-all duration-1000 ease-out-expo ${
              mounted ? 'opacity-100 scale-100' : 'opacity-0 scale-75'
            }`}
          />
          <div
            className={`absolute top-1/3 -right-16 w-72 h-72 rounded-full bg-white/[0.03] transition-all duration-[1200ms] ease-out-expo delay-200 ${
              mounted ? 'opacity-100 scale-100' : 'opacity-0 scale-75'
            }`}
          />
          <div
            className={`absolute -bottom-20 left-1/4 w-80 h-80 rounded-full bg-white/[0.04] transition-all duration-[1400ms] ease-out-expo delay-300 ${
              mounted ? 'opacity-100 scale-100' : 'opacity-0 scale-75'
            }`}
          />
          <div
            className={`absolute top-1/2 left-1/3 w-48 h-48 rounded-full border border-white/10 transition-all duration-[1600ms] ease-out-expo delay-500 ${
              mounted ? 'opacity-100 scale-100 rotate-12' : 'opacity-0 scale-75 rotate-0'
            }`}
          />
          <div
            className={`absolute top-20 right-1/4 w-32 h-32 rounded-full border border-white/[0.07] transition-all duration-[1800ms] ease-out-expo delay-700 ${
              mounted ? 'opacity-100 scale-100 -rotate-6' : 'opacity-0 scale-75 rotate-0'
            }`}
          />
        </div>

        <div className="relative z-10 flex flex-col items-center justify-center w-full px-12 xl:px-16">
          <div
            className={`flex items-center gap-3 mb-10 transition-all duration-700 ease-out-expo delay-300 ${
              mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
          >
            <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-white/15 backdrop-blur-sm text-white">
              <ForkKnifeIcon />
            </div>
            <span className="text-3xl font-bold text-white tracking-tight">Lunchify</span>
          </div>

          <h2
            className={`text-2xl xl:text-3xl font-bold text-white text-center leading-snug mb-4 transition-all duration-700 ease-out-expo delay-500 ${
              mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
          >
            Smarter Lunch.
            <br />
            Better Planning.
          </h2>

          <p
            className={`text-base text-brand-100/80 text-center max-w-sm leading-relaxed transition-all duration-700 ease-out-expo delay-700 ${
              mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
          >
            Streamline your daily lunch attendance with a platform built for teams that value efficiency and simplicity.
          </p>

          <div
            className={`mt-16 flex items-center gap-6 text-brand-200/60 text-sm transition-all duration-700 ease-out-expo delay-[900ms] ${
              mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
          >
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              Easy to use
            </span>
            <span className="w-px h-4 bg-brand-300/30" />
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Secure
            </span>
          </div>
        </div>
      </div>

      {/* Right panel — login form */}
      <div className="flex-1 flex flex-col">
        <div className="flex-1 flex items-center justify-center px-6 sm:px-12 py-12">
          <div
            className={`w-full max-w-md transition-all duration-700 ease-out-expo ${
              mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
          >
            {/* Mobile logo */}
            <div className="flex items-center gap-2.5 mb-10 lg:hidden">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-brand-600 text-white">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 002-2V2" />
                  <path d="M7 2v20" />
                  <path d="M21 15V2v0a5 5 0 00-5 5v6c0 1.1.9 2 2 2h3zm0 0v7" />
                </svg>
              </div>
              <span className="text-xl font-bold text-brand-600 tracking-tight">Lunchify</span>
            </div>

            {/* Desktop logo */}
            <div className="hidden lg:flex items-center gap-2.5 mb-10">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-brand-600 text-white">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 002-2V2" />
                  <path d="M7 2v20" />
                  <path d="M21 15V2v0a5 5 0 00-5 5v6c0 1.1.9 2 2 2h3zm0 0v7" />
                </svg>
              </div>
              <span className="text-xl font-bold text-brand-600 tracking-tight">Lunchify</span>
            </div>

            <div className="mb-8">
              <h1 className="text-2xl sm:text-3xl font-bold text-surface-900 tracking-tight">
                Welcome to Lunchify
              </h1>
              <p className="mt-2.5 text-surface-500 text-[15px] leading-relaxed">
                Sign in to manage your lunch attendance
              </p>
            </div>

            {error && (
              <div className="mb-6 flex items-center gap-3 p-3.5 bg-danger-50 border border-danger-200 rounded-xl text-sm text-danger-700 animate-fade-in-down">
                <svg className="w-5 h-5 shrink-0 text-danger-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                {error}
              </div>
            )}

            {/* Google SSO Button */}
            {ssoStatus.googleConfigured ? (
              <button
                onClick={handleGoogleLogin}
                disabled={loading}
                className="group w-full flex items-center justify-center gap-3 px-4 py-3.5 bg-surface-0 border border-surface-200 rounded-xl text-surface-700 font-medium text-[15px] shadow-soft hover:shadow-card hover:border-surface-300 hover:bg-surface-50 active:scale-[0.99] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <GoogleIcon />
                Continue with Google
              </button>
            ) : (
              <div className="w-full p-4 bg-amber-50 border border-amber-200 rounded-xl">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-amber-800">Google SSO not configured</p>
                    <p className="text-xs text-amber-600 mt-1">Use a demo account below to sign in. Google login will be available once credentials are added to the server.</p>
                  </div>
                </div>
              </div>
            )}

            {/* Divider */}
            <div className="relative my-7">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-surface-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-surface-0 text-surface-400 font-medium">{ssoStatus.googleConfigured ? 'or' : 'Sign in with a demo account'}</span>
              </div>
            </div>

            {/* Demo accounts */}
            <div>
              <button
                onClick={() => setShowDemos(!showDemos)}
                className="flex items-center justify-between w-full px-4 py-3 bg-surface-50 border border-surface-200 rounded-xl text-sm font-medium text-surface-600 hover:bg-surface-100 hover:border-surface-300 transition-all duration-200"
              >
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-surface-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                  Demo Accounts
                </span>
                <svg
                  className={`w-4 h-4 text-surface-400 transition-transform duration-200 ${showDemos ? 'rotate-180' : ''}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              <div
                className={`overflow-hidden transition-all duration-300 ease-out-expo ${
                  showDemos ? 'max-h-[500px] opacity-100 mt-3' : 'max-h-0 opacity-0'
                }`}
              >
                <div className="space-y-2">
                  {demoUsers.map((u) => (
                    <button
                      key={u.id}
                      onClick={() => handleDemoClick(u.email)}
                      disabled={loading}
                      className="w-full flex items-center justify-between px-4 py-3 border border-surface-200 rounded-xl text-left hover:bg-surface-50 hover:border-surface-300 hover:shadow-soft active:scale-[0.99] transition-all duration-200 disabled:opacity-50"
                    >
                      <div className="min-w-0">
                        <div className="font-medium text-surface-800 text-sm truncate">{u.name}</div>
                        <div className="text-surface-400 text-xs truncate mt-0.5">{u.email}</div>
                      </div>
                      <span
                        className={`ml-3 shrink-0 px-2.5 py-1 rounded-lg text-xs font-semibold ring-1 ring-inset ${roleColors[u.role] || 'bg-surface-50 text-surface-600 ring-surface-500/10'}`}
                      >
                        {roleLabels[u.role] || u.role}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-10 pt-6 border-t border-surface-100">
              <p className="text-center text-xs text-surface-400 flex items-center justify-center gap-1.5">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                {ssoStatus.googleConfigured ? 'Secure sign-in powered by Google' : 'Lunchify Demo Mode — No credentials required'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
