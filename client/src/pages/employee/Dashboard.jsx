import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/ui/Toast';
import { Card, Badge, Button, Skeleton, StatCard } from '../../components/ui';

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return { text: 'Good morning', emoji: '\u{1F44B}' };
  if (h < 17) return { text: 'Good afternoon', emoji: '\u{2600}\u{FE0F}' };
  return { text: 'Good evening', emoji: '\u{1F319}' };
}

function formatFriendlyDate(dateStr) {
  if (!dateStr) return new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}

function formatTime(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

function getTimeUntil(targetIso) {
  const now = new Date();
  const target = new Date(targetIso);
  const diff = target - now;
  if (diff <= 0) return null;
  const hours = Math.floor(diff / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

const UtensilsIcon = () => (
  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 002-2V2M7 2v20M21 15V2a5 5 0 00-5 5v6c0 1.1.9 2 2 2h3zm0 0v7" />
  </svg>
);

const XIcon = () => (
  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M18 6L6 18M6 6l12 12" />
  </svg>
);

const CheckCircleIcon = ({ className = '' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const MinusCircleIcon = ({ className = '' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
  </svg>
);

const AlertTriangleIcon = ({ className = '' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
  </svg>
);

const ClockIcon = () => (
  <svg className="w-4 h-4 text-surface-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const InfoIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="space-y-2">
        <Skeleton variant="text" width="55%" height={32} />
        <Skeleton variant="text" width="40%" height={20} />
      </div>
      <Card className="overflow-hidden">
        <div className="text-center space-y-6 py-4">
          <Skeleton variant="circular" width={80} height={80} className="mx-auto" />
          <Skeleton variant="text" width="60%" height={24} className="mx-auto" />
          <div className="flex gap-4">
            <Skeleton variant="rectangular" className="flex-1 h-16 rounded-xl" />
            <Skeleton variant="rectangular" className="flex-1 h-16 rounded-xl" />
          </div>
        </div>
      </Card>
      <div className="grid grid-cols-3 gap-3">
        <StatCard loading />
        <StatCard loading />
        <StatCard loading />
      </div>
    </div>
  );
}

export default function EmployeeDashboard() {
  const { apiFetch } = useAuth();
  const { showToast } = useToast();
  const [today, setToday] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [responding, setResponding] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    Promise.all([
      apiFetch('/api/employee/today'),
      apiFetch('/api/employee/me'),
    ])
      .then(([todayData, profileData]) => {
        setToday(todayData);
        setProfile(profileData);
      })
      .finally(() => setLoading(false));
  }, []);

  const greeting = useMemo(() => getGreeting(), []);
  const firstName = profile?.name?.split(' ')[0] || '';

  const currentStatus = today?.attendance?.status || 'pending';
  const isWindowOpen = today?.window?.isOpen;
  const confirmForDate = today?.date;
  const friendlyDate = formatFriendlyDate(confirmForDate);
  const confirmedAt = formatTime(today?.attendance?.confirmed_at);
  const canEdit = isWindowOpen && currentStatus !== 'pending';
  const timeUntilClose = isWindowOpen ? getTimeUntil(today?.window?.nextClose) : null;
  const timeUntilOpen = !isWindowOpen ? getTimeUntil(today?.window?.nextOpen) : null;

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

  const showPending = currentStatus === 'pending' && isWindowOpen && !isEditing;
  const showConfirmed = currentStatus === 'confirmed' && !isEditing;
  const showDeclined = currentStatus === 'declined' && !isEditing;
  const showWindowClosed = !isWindowOpen && currentStatus === 'pending';
  const showEditButtons = isEditing || showPending;

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-bold text-surface-900">
          {greeting.text}, {firstName} {greeting.emoji}
        </h1>
        <p className="text-surface-500 mt-1">{friendlyDate}</p>
        {profile?.department && (
          <p className="text-sm text-surface-400 mt-0.5">{profile.department}</p>
        )}
      </div>

      {/* Window status banner */}
      {isWindowOpen && timeUntilClose && (
        <div className="flex items-center gap-3 p-3 bg-success-50 border border-success-200 rounded-xl text-sm">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-success-100 text-success-600">
            <ClockIcon />
          </div>
          <div className="flex-1">
            <span className="font-medium text-success-800">Confirmation window is open</span>
            <span className="text-success-600 ml-1">— closes in {timeUntilClose}</span>
          </div>
        </div>
      )}

      {/* Main Card */}
      <Card className="overflow-hidden !p-0">
        {/* Pending / Edit state */}
        {showEditButtons && (
          <div className="p-6 sm:p-8 animate-fade-in-up">
            <div className="text-center mb-8">
              <div className="w-16 h-16 rounded-2xl bg-brand-50 flex items-center justify-center mx-auto mb-4">
                <UtensilsIcon />
              </div>
              <h2 className="text-xl font-bold text-surface-900">
                Are you taking lunch on {friendlyDate}?
              </h2>
              <p className="text-surface-500 mt-2 text-sm">
                Confirm before 10:30 AM on that day
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
              <Button
                variant="success"
                size="lg"
                fullWidth
                loading={responding}
                onClick={() => handleRespond('confirmed')}
                className="!py-5 !text-base !font-semibold !rounded-2xl"
                icon={<UtensilsIcon />}
              >
                YES, I'M TAKING LUNCH
              </Button>
              <Button
                variant="secondary"
                size="lg"
                fullWidth
                loading={responding}
                onClick={() => handleRespond('declined')}
                className="!py-5 !text-base !font-semibold !rounded-2xl"
                icon={<XIcon />}
              >
                NOT TODAY
              </Button>
            </div>
          </div>
        )}

        {/* Confirmed state */}
        {showConfirmed && (
          <div className="p-6 sm:p-8 text-center animate-fade-in-up">
            <div className="w-20 h-20 rounded-full bg-success-50 flex items-center justify-center mx-auto mb-5 animate-bounce-gentle">
              <CheckCircleIcon className="w-12 h-12 text-success-500" />
            </div>
            <h2 className="text-xl font-bold text-surface-900 mb-2">Lunch confirmed!</h2>
            <p className="text-surface-500">
              You're included in the lunch count for {friendlyDate}.
            </p>
            {confirmedAt && (
              <p className="text-sm text-surface-400 mt-2">Confirmed at {confirmedAt}</p>
            )}
            {canEdit && (
              <button
                onClick={() => setIsEditing(true)}
                className="mt-6 text-sm font-medium text-brand-600 hover:text-brand-700 transition-colors underline underline-offset-2"
              >
                Change response
              </button>
            )}
          </div>
        )}

        {/* Declined state */}
        {showDeclined && (
          <div className="p-6 sm:p-8 text-center animate-fade-in-up">
            <div className="w-20 h-20 rounded-full bg-surface-100 flex items-center justify-center mx-auto mb-5">
              <MinusCircleIcon className="w-12 h-12 text-surface-400" />
            </div>
            <h2 className="text-xl font-bold text-surface-900 mb-2">No lunch</h2>
            <p className="text-surface-500">
              You're marked as not taking lunch on {friendlyDate}.
            </p>
            {canEdit && (
              <button
                onClick={() => setIsEditing(true)}
                className="mt-6 text-sm font-medium text-brand-600 hover:text-brand-700 transition-colors underline underline-offset-2"
              >
                Change response
              </button>
            )}
          </div>
        )}

        {/* Window closed + pending */}
        {showWindowClosed && (
          <div className="p-6 sm:p-8 text-center animate-fade-in-up">
            <div className="w-20 h-20 rounded-full bg-warning-50 flex items-center justify-center mx-auto mb-5">
              <AlertTriangleIcon className="w-12 h-12 text-warning-500" />
            </div>
            <h2 className="text-xl font-bold text-surface-900 mb-2">Confirmation closed</h2>
            <p className="text-surface-500">
              Lunch confirmation is currently closed.
            </p>
            {timeUntilOpen ? (
              <p className="text-sm text-surface-400 mt-2">
                Opens again at 2:00 PM ({timeUntilOpen} from now)
              </p>
            ) : (
              <p className="text-sm text-surface-400 mt-2">
                Opens at 2:00 PM for the next day
              </p>
            )}
          </div>
        )}
      </Card>

      {/* Time window info */}
      <div className="flex items-center justify-center gap-2 text-sm text-surface-400">
        <ClockIcon />
        <span>
          Confirm: 2:00 PM – 10:30 AM
        </span>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard
          title="Confirmed"
          value={today?.stats?.confirmed ?? '\u2014'}
          icon={
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          }
          color="success"
        />
        <StatCard
          title="Declined"
          value={today?.stats?.declined ?? '\u2014'}
          icon={
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M18 6L6 18M6 6l12 12" />
            </svg>
          }
          color="danger"
        />
        <StatCard
          title="This Month"
          value={today?.stats?.total ?? '\u2014'}
          icon={
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          }
          color="brand"
        />
      </div>
    </div>
  );
}
