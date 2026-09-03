import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LunchifyLogo from '../components/LunchifyLogo';

const CheckBadge = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const ShieldIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
);

const ClockIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <circle cx="12" cy="12" r="9" strokeLinecap="round" strokeLinejoin="round" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 7v5l3 2" />
  </svg>
);

export default function LoginPage() {
  const [pin, setPin] = useState('');
  const [activeTab, setActiveTab] = useState('staff');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Azul Tech SSO — redirects to Keycloak, which authenticates against Zoho.
  const handleSSOLogin = async () => {
    try {
      setError('');
      setLoading(true);
      await login();
    } catch (err) {
      console.error('SSO Login Error:', err);
      setError('Unable to connect to Azul Tech SSO. Please try again later.');
      setLoading(false);
    }
  };

  const handlePinLogin = async (e) => {
    e.preventDefault();
    if (!pin.trim()) return;

    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/restaurant-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: pin.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Invalid PIN');
        setLoading(false);
        return;
      }

      navigate(`/kitchen/${data.restaurant.id}`);
    } catch (err) {
      setError('Failed to verify PIN');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-white dark:bg-surface-900">

      {/* Left Panel — Branding */}
      <div className="hidden lg:flex lg:w-[45%] xl:w-[50%] relative overflow-hidden bg-gradient-to-br from-brand-950 via-[#0b1b3f] to-brand-900">

        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              `linear-gradient(rgba(255,255,255,0.12) 1px, transparent 1px), ` +
              `linear-gradient(90deg, rgba(255,255,255,0.12) 1px, transparent 1px)`,
            backgroundSize: '56px 56px',
          }}
        />

        <div className="absolute top-0 left-0 w-[520px] h-[520px] bg-brand-500/20 rounded-full blur-[130px] -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-[420px] h-[420px] bg-brand-400/15 rounded-full blur-[110px] translate-x-1/3 translate-y-1/3" />

        <div className="relative z-10 flex flex-col justify-between w-full px-12 xl:px-16 py-12">

          <div
            className={`flex items-center gap-3 transition-all duration-700 ease-out-expo delay-200 ${
              mounted ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'
            }`}
          >
            <LunchifyLogo size={40} />
            <div>
              <span className="text-xl font-bold text-white tracking-tight">Lunchify</span>
              <span className="block text-[11px] text-white/40 font-medium tracking-widest uppercase">by Azul Tech</span>
            </div>
          </div>

          <div className="flex-1 flex flex-col justify-center max-w-md">
            <div
              className={`transition-all duration-700 ease-out-expo delay-[400ms] ${
                mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
              }`}
            >
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-full text-xs font-medium text-white/60 mb-8">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-pulse" />
                Single sign-on with your Azul Tech account
              </div>

              <h1 className="text-4xl xl:text-[42px] font-bold text-white leading-[1.15] tracking-tight mb-5">
                Smarter Lunch.
                <br />
                <span className="text-brand-400">Better Planning.</span>
              </h1>

              <p className="text-base text-white/50 leading-relaxed max-w-sm">
                Confirm your daily lunch in one tap. The kitchen sees exactly how many
                meals to prepare — no guesswork, no waste.
              </p>
            </div>

            <div
              className={`mt-12 space-y-4 transition-all duration-700 ease-out-expo delay-700 ${
                mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
              }`}
            >
              {[
                { icon: <CheckBadge />, text: 'Confirm lunch in one tap' },
                { icon: <ShieldIcon />, text: 'Sign in with your Zoho work account' },
                { icon: <ClockIcon />, text: 'Real-time kitchen headcount' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 text-white/50">
                  <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-white/5 text-brand-400">
                    {item.icon}
                  </div>
                  <span className="text-sm">{item.text}</span>
                </div>
              ))}
            </div>
          </div>

          <div
            className={`transition-all duration-700 ease-out-expo delay-[900ms] ${
              mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
          >
            <p className="text-xs text-white/30">
              &copy; {new Date().getFullYear()} Azul Tech. All rights reserved.
            </p>
          </div>
        </div>
      </div>

      {/* Right Panel — Login */}
      <div className="flex-1 flex flex-col">
        <div className="flex-1 flex items-center justify-center px-6 sm:px-8 lg:px-12 xl:px-16 py-10">
          <div
            className={`w-full max-w-[400px] transition-all duration-500 ease-out-expo ${
              mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
          >

            {/* Mobile logo */}
            <div className="flex items-center gap-2.5 mb-10 lg:hidden">
              <LunchifyLogo size={40} />
              <div>
                <span className="text-lg font-bold text-surface-900 dark:text-surface-100 tracking-tight">Lunchify</span>
                <span className="block text-[10px] text-surface-400 dark:text-surface-500 font-medium tracking-wider uppercase -mt-0.5">by Azul Tech</span>
              </div>
            </div>

            {/* Heading */}
            <div className="mb-6">
              <h1 className="text-2xl sm:text-[28px] font-bold text-surface-900 dark:text-surface-100 tracking-tight leading-tight">
                Welcome back
              </h1>
              <p className="mt-2 text-surface-500 dark:text-surface-400 text-[15px]">
                Sign in to confirm your lunch
              </p>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 p-1 bg-surface-100 dark:bg-surface-800 rounded-xl mb-6">
              <button
                onClick={() => { setActiveTab('staff'); setError(''); }}
                className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
                  activeTab === 'staff'
                    ? 'bg-white dark:bg-surface-700 text-surface-900 dark:text-surface-100 shadow-sm'
                    : 'text-surface-500 dark:text-surface-400 hover:text-surface-700 dark:hover:text-surface-300'
                }`}
              >
                Staff
              </button>
              <button
                onClick={() => { setActiveTab('restaurant'); setError(''); setPin(''); }}
                className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
                  activeTab === 'restaurant'
                    ? 'bg-white dark:bg-surface-700 text-surface-900 dark:text-surface-100 shadow-sm'
                    : 'text-surface-500 dark:text-surface-400 hover:text-surface-700 dark:hover:text-surface-300'
                }`}
              >
                Restaurant
              </button>
            </div>

            {/* Error */}
            {error && (
              <div className="mb-5 flex items-center gap-3 p-3.5 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/30 rounded-xl text-sm text-red-600 dark:text-red-400 animate-fade-in-down">
                <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                {error}
              </div>
            )}

            {/* Staff — SSO only */}
            {activeTab === 'staff' && (
              <div className="animate-fade-in">
                <button
                  type="button"
                  onClick={handleSSOLogin}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2.5 px-4 py-3.5 bg-brand-600 hover:bg-brand-700 active:bg-brand-800 text-white rounded-xl text-sm font-semibold shadow-sm shadow-brand-600/25 transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <ShieldIcon />
                  {loading ? 'Connecting to Azul Tech…' : 'Continue with Azul Tech SSO'}
                </button>

                <p className="mt-3 text-center text-xs text-surface-400 dark:text-surface-500">
                  Use your <span className="font-medium text-surface-500 dark:text-surface-400">@azultech.rw</span> Zoho account.
                  No separate password to remember.
                </p>

                <div className="mt-8 rounded-xl border border-surface-100 dark:border-surface-700/60 bg-surface-50 dark:bg-surface-800/50 p-4">
                  <p className="text-xs font-semibold text-surface-600 dark:text-surface-300 mb-2.5">How it works</p>
                  <ol className="space-y-2">
                    {[
                      'Click the button above',
                      'Sign in with your Azul Tech work account',
                      'Confirm your lunch for the day',
                    ].map((step, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-xs text-surface-500 dark:text-surface-400">
                        <span className="flex items-center justify-center w-4 h-4 rounded-full bg-brand-100 dark:bg-brand-900/40 text-brand-700 dark:text-brand-300 text-[10px] font-bold shrink-0 mt-0.5">
                          {i + 1}
                        </span>
                        {step}
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
            )}

            {/* Restaurant — PIN */}
            {activeTab === 'restaurant' && (
              <form onSubmit={handlePinLogin} className="animate-fade-in">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-surface-700 dark:text-surface-200 mb-1.5">
                    Kitchen PIN
                  </label>
                  <input
                    type="password"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                    placeholder="Enter PIN"
                    className="w-full rounded-xl border border-surface-300 dark:border-surface-700 px-4 py-3 text-2xl text-center tracking-[0.5em] bg-white dark:bg-surface-800 dark:text-surface-100 transition-colors focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 placeholder:text-surface-400 placeholder:text-base placeholder:tracking-normal"
                    disabled={loading}
                    autoFocus
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || !pin.trim()}
                  className="w-full px-4 py-3 bg-brand-600 hover:bg-brand-700 active:bg-brand-800 text-white rounded-xl text-sm font-semibold shadow-sm shadow-brand-600/20 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Verifying…' : 'Open kitchen display'}
                </button>

                <p className="mt-4 text-center text-xs text-surface-400 dark:text-surface-500">
                  Ask your admin for the kitchen PIN
                </p>
              </form>
            )}

            {/* Footer */}
            <div className="mt-10 pt-6 border-t border-surface-100 dark:border-surface-700">
              <p className="text-center text-xs text-surface-400 dark:text-surface-500 flex items-center justify-center gap-1.5">
                <ShieldIcon />
                Secured with Azul Tech single sign-on
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
