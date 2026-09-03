import { useState, useEffect, useMemo, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/ui/Toast';
import { Skeleton } from '../../components/ui';

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function formatFriendlyDate(dateStr) {
  if (!dateStr) {
    return new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  }
  const d = new Date(dateStr + 'T00:00:00');
  if (isNaN(d.getTime())) {
    return new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  }
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}

function formatShortDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatTime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

function formatCountdown(targetIso) {
  if (!targetIso) return null;
  const target = new Date(targetIso);
  if (isNaN(target.getTime())) return null;
  const now = new Date();
  const diff = target - now;
  if (diff <= 0) return null;
  const hours = Math.floor(diff / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

const UtensilsIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 002-2V2M7 2v20M21 15V2a5 5 0 00-5 5v6c0 1.1.9 2 2 2h3zm0 0v7" />
  </svg>
);

const XIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 6L6 18M6 6l12 12" />
  </svg>
);

function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="space-y-2">
        <Skeleton variant="text" width="50%" height={28} />
        <Skeleton variant="text" width="35%" height={18} />
      </div>
      <div className="bg-white dark:bg-surface-800 rounded-2xl border border-surface-200 dark:border-surface-700 p-6">
        <div className="space-y-4">
          <Skeleton variant="text" width="40%" height={20} />
          <Skeleton variant="text" width="70%" height={16} />
          <div className="flex gap-3">
            <Skeleton variant="rectangular" className="flex-1 h-12 rounded-xl" />
            <Skeleton variant="rectangular" className="flex-1 h-12 rounded-xl" />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 p-4">
            <Skeleton variant="text" width="60%" height={14} />
            <Skeleton variant="text" width="40%" height={24} className="mt-2" />
          </div>
        ))}
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const styles = {
    confirmed: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/30',
    declined: 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800/30',
    pending: 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/30',
  };
  const icons = {
    confirmed: '✓',
    declined: '✕',
    pending: '⏳',
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border ${styles[status] || styles.pending}`}>
      <span className="text-[10px]">{icons[status] || '⏳'}</span>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

export default function EmployeeDashboard() {
  const { apiFetch, user } = useAuth();
  const { showToast } = useToast();
  const [today, setToday] = useState(null);
  const [profile, setProfile] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [responding, setResponding] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState(null);

  const tickRef = useRef(null);
  const [, setTick] = useState(0);

  useEffect(() => {
    tickRef.current = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(tickRef.current);
  }, []);

  const fetchData = () => {
    setLoading(true);
    setError(null);
    Promise.all([
      apiFetch('/api/employee/today'),
      apiFetch('/api/employee/me'),
      apiFetch('/api/employee/history?limit=7'),
    ])
      .then(([todayData, profileData, historyData]) => {
        setToday(todayData);
        setProfile(profileData);
        setHistory(historyData?.records || []);
      })
      .catch(() => setError('Unable to load lunch status. Please try again.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const greeting = useMemo(() => getGreeting(), []);
  const firstName = profile?.name?.split(' ')[0] || user?.name?.split(' ')[0] || '';
  const todayDate = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  const currentStatus = today?.attendance?.status || 'pending';
  const isWindowOpen = today?.window?.isOpen;
  const confirmForDate = today?.date;
  const friendlyDate = formatFriendlyDate(confirmForDate);
  const confirmedAt = formatTime(today?.attendance?.confirmed_at);
  const canEdit = isWindowOpen && currentStatus !== 'pending';

  const timeUntilClose = isWindowOpen ? formatCountdown(today?.window?.nextClose) : null;
  const timeUntilOpen = !isWindowOpen ? formatCountdown(today?.window?.nextOpen) : null;
  const opensAtDisplay = formatTime(today?.window?.opensAt);
  const closesAtDisplay = formatTime(today?.window?.closesAt);

  const handleRespond = async (status) => {
    setResponding(true);
    try {
      await apiFetch('/api/employee/respond', {
        method: 'POST',
        body: JSON.stringify({ status }),
      });
      setToday((prev) => ({
        ...prev,
        attendance: { status, confirmed_at: new Date().toISOString() },
      }));
      setIsEditing(false);
      showToast({
        type: 'success',
        title: status === 'confirmed' ? 'Lunch confirmed!' : 'Lunch declined',
        message: status === 'confirmed'
          ? `You're included in the lunch count for ${friendlyDate}.`
          : `You've been marked as not taking lunch on ${friendlyDate}.`,
      });
    } catch (err) {
      showToast({
        type: 'error',
        title: 'Something went wrong',
        message: err.message,
      });
    } finally {
      setResponding(false);
    }
  };

  if (loading) return <DashboardSkeleton />;

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
        <div className="w-16 h-16 rounded-2xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center mb-4">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-red-500 dark:text-red-400">
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
        </div>
        <p className="text-sm font-medium text-surface-900 dark:text-surface-100 mb-1">{error}</p>
        <button onClick={fetchData} className="mt-3 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors">
          Try Again
        </button>
      </div>
    );
  }

  const showPending = currentStatus === 'pending' && isWindowOpen && !isEditing;
  const showConfirmed = currentStatus === 'confirmed' && !isEditing;
  const showDeclined = currentStatus === 'declined' && !isEditing;
  const showWindowClosed = !isWindowOpen && currentStatus === 'pending';
  const showEditButtons = isEditing || showPending;

  return (
    <div className="space-y-5 animate-fade-in-up">
      {/* Hero */}
      <div className="pb-1">
        <h1 className="text-2xl sm:text-[28px] font-bold text-surface-900 dark:text-surface-100 tracking-tight">
          {greeting}, {firstName} <span className="inline-block animate-[wave_0.6s_ease-in-out_0.3s_1]">&#x1F44B;</span>
        </h1>
        <p className="text-surface-500 dark:text-surface-400 mt-1 text-[15px]">{todayDate}</p>
        {profile?.department && (
          <p className="text-sm text-surface-400 dark:text-surface-500 mt-0.5">{profile.department}</p>
        )}
      </div>

      {/* Today's Lunch Card */}
      <div className="bg-white dark:bg-surface-800 rounded-2xl border border-surface-200 dark:border-surface-700 overflow-hidden">
        {/* Card Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-surface-100 dark:border-surface-700/50">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-900/20">
            <span className="text-blue-600 dark:text-blue-400"><UtensilsIcon /></span>
          </div>
          <div>
            <h2 className="text-sm font-semibold text-surface-900 dark:text-surface-100">Today's Lunch</h2>
            {confirmForDate && (
              <p className="text-xs text-surface-400 dark:text-surface-500">{friendlyDate}</p>
            )}
          </div>
        </div>

        <div className="p-5 sm:p-6">
          {/* Pending / Edit — Show confirmation buttons */}
          {showEditButtons && (
            <div className="animate-fade-in">
              <p className="text-base font-semibold text-surface-900 dark:text-surface-100 mb-1">Would you like lunch today?</p>
              <p className="text-sm text-surface-500 dark:text-surface-400 mb-5">
                {closesAtDisplay ? `Closes at ${closesAtDisplay}` : 'Confirm your lunch preference'}
              </p>
              <div className="grid grid-cols-1 xs:grid-cols-2 gap-3">
                <button
                  onClick={() => handleRespond('confirmed')}
                  disabled={responding}
                  className="flex items-center justify-center gap-2.5 px-5 py-3.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl text-sm font-semibold transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm shadow-blue-600/20"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  {responding ? 'Confirming...' : "Yes, I'm taking lunch"}
                </button>
                <button
                  onClick={() => handleRespond('declined')}
                  disabled={responding}
                  className="flex items-center justify-center gap-2.5 px-5 py-3.5 bg-surface-100 dark:bg-surface-700 hover:bg-surface-200 dark:hover:bg-surface-600 text-surface-700 dark:text-surface-200 rounded-xl text-sm font-semibold transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                  {responding ? 'Saving...' : 'Not today'}
                </button>
              </div>
            </div>
          )}

          {/* Confirmed */}
          {showConfirmed && (
            <div className="text-center py-2 animate-fade-in">
              <div className="w-14 h-14 rounded-full bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center mx-auto mb-3">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-emerald-500 dark:text-emerald-400">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" strokeLinecap="round" strokeLinejoin="round" />
                  <polyline points="22 4 12 14.01 9 11.01" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <p className="text-base font-semibold text-surface-900 dark:text-surface-100">Lunch confirmed</p>
              <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">
                You're included in today's lunch count.
              </p>
              {confirmedAt && (
                <p className="text-xs text-surface-400 dark:text-surface-500 mt-2">Confirmed at {confirmedAt}</p>
              )}
              {canEdit && (
                <button onClick={() => setIsEditing(true)} className="mt-4 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors">
                  Change response
                </button>
              )}
            </div>
          )}

          {/* Declined */}
          {showDeclined && (
            <div className="text-center py-2 animate-fade-in">
              <div className="w-14 h-14 rounded-full bg-surface-100 dark:bg-surface-700 flex items-center justify-center mx-auto mb-3">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-surface-400 dark:text-surface-500">
                  <circle cx="12" cy="12" r="10" strokeLinecap="round" strokeLinejoin="round" />
                  <line x1="15" y1="9" x2="9" y2="15" strokeLinecap="round" strokeLinejoin="round" />
                  <line x1="9" y1="9" x2="15" y2="15" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <p className="text-base font-semibold text-surface-900 dark:text-surface-100">Not taking lunch</p>
              <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">
                You're marked as not taking lunch today.
              </p>
              {canEdit && (
                <button onClick={() => setIsEditing(true)} className="mt-4 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors">
                  Change response
                </button>
              )}
            </div>
          )}

          {/* Window Closed */}
          {showWindowClosed && (
            <div className="text-center py-2 animate-fade-in">
              <div className="w-14 h-14 rounded-full bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center mx-auto mb-3">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-amber-500 dark:text-amber-400">
                  <circle cx="12" cy="12" r="10" strokeLinecap="round" strokeLinejoin="round" />
                  <line x1="12" y1="8" x2="12" y2="12" strokeLinecap="round" strokeLinejoin="round" />
                  <line x1="12" y1="16" x2="12.01" y2="16" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <p className="text-base font-semibold text-surface-900 dark:text-surface-100">Confirmation closed</p>
              <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">
                Lunch confirmation is currently closed.
              </p>
              {timeUntilOpen ? (
                <p className="text-sm text-surface-500 dark:text-surface-400 mt-2">
                  Opens again {opensAtDisplay ? `at ${opensAtDisplay}` : ''} ({timeUntilOpen} from now)
                </p>
              ) : opensAtDisplay ? (
                <p className="text-sm text-surface-500 dark:text-surface-400 mt-2">
                  Opens again at {opensAtDisplay}
                </p>
              ) : null}
            </div>
          )}
        </div>

        {/* Window Info Footer */}
        {opensAtDisplay && closesAtDisplay && (
          <div className="flex items-center justify-center gap-2 px-5 py-3 bg-surface-50 dark:bg-surface-700/30 border-t border-surface-100 dark:border-surface-700/50">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-surface-400 dark:text-surface-500">
              <circle cx="12" cy="12" r="10" strokeLinecap="round" strokeLinejoin="round" />
              <polyline points="12 6 12 12 16 14" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="text-xs text-surface-400 dark:text-surface-500">
              Confirmation window: {opensAtDisplay} – {closesAtDisplay}
            </span>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Confirmed', value: today?.stats?.confirmed ?? 0, color: 'emerald', icon: '✓' },
          { label: 'Declined', value: today?.stats?.declined ?? 0, color: 'red', icon: '✕' },
          { label: 'Responses', value: today?.stats?.total ?? 0, color: 'blue', icon: '∑' },
        ].map((stat) => (
          <div key={stat.label} className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 p-4">
            <p className="text-xs text-surface-400 dark:text-surface-500 font-medium">{stat.label}</p>
            <p className="text-2xl font-bold text-surface-900 dark:text-surface-100 mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Recent Attendance */}
      {history.length > 0 && (
        <div className="bg-white dark:bg-surface-800 rounded-2xl border border-surface-200 dark:border-surface-700 overflow-hidden">
          <div className="px-5 py-4 border-b border-surface-100 dark:border-surface-700/50">
            <h3 className="text-sm font-semibold text-surface-900 dark:text-surface-100">Recent Attendance</h3>
          </div>
          <div className="divide-y divide-surface-100 dark:divide-surface-700/50">
            {history.slice(0, 5).map((record, i) => (
              <div key={i} className="flex items-center justify-between px-5 py-3">
                <div className="flex items-center gap-3">
                  <span className="text-sm text-surface-500 dark:text-surface-400 w-16 shrink-0">
                    {formatShortDate(record.date)}
                  </span>
                  <span className="text-sm text-surface-700 dark:text-surface-200">Lunch</span>
                </div>
                <StatusBadge status={record.status} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {history.length === 0 && !loading && (
        <div className="bg-white dark:bg-surface-800 rounded-2xl border border-surface-200 dark:border-surface-700 p-8 text-center">
          <div className="w-12 h-12 rounded-xl bg-surface-100 dark:bg-surface-700 flex items-center justify-center mx-auto mb-3">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-surface-400 dark:text-surface-500">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" strokeLinecap="round" strokeLinejoin="round" />
              <line x1="16" y1="2" x2="16" y2="6" strokeLinecap="round" strokeLinejoin="round" />
              <line x1="8" y1="2" x2="8" y2="6" strokeLinecap="round" strokeLinejoin="round" />
              <line x1="3" y1="10" x2="21" y2="10" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <p className="text-sm font-medium text-surface-900 dark:text-surface-100">No attendance yet</p>
          <p className="text-xs text-surface-400 dark:text-surface-500 mt-1">Your lunch responses will appear here.</p>
        </div>
      )}
    </div>
  );
}
