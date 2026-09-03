import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useDatePicker } from '../../context/DatePickerContext';
import { PageHeader, Card, Button, Skeleton, EmptyState } from '../../components/ui';

const CheckIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
);

const XIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const ClockIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const UsersIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
  </svg>
);

function RequirementsSkeleton() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-2">
          <Skeleton variant="text" width={240} height={24} />
          <Skeleton variant="text" width={300} height={14} />
        </div>
        <Skeleton variant="rectangular" width={160} height={40} className="rounded-xl" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} variant="rectangular" height={110} className="rounded-2xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} variant="rectangular" height={180} className="rounded-2xl" />
        ))}
      </div>
    </div>
  );
}

export default function RestaurantRequirements() {
  const { apiFetch } = useAuth();
  const { selectedDate, setSelectedDate } = useDatePicker();
  const [requirements, setRequirements] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    apiFetch(`/api/restaurant/meal-requirements?date=${selectedDate}`)
      .then(setRequirements)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [selectedDate]);

  if (loading) return <RequirementsSkeleton />;

  if (error) {
    return (
      <div className="animate-fade-in">
        <PageHeader title="Meal Requirements" subtitle="View meal requirements by organization" />
        <div className="flex flex-col items-center justify-center text-center py-16">
          <div className="w-16 h-16 rounded-2xl bg-danger-50 dark:bg-red-900/20 flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-danger-500 dark:text-red-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-surface-900 dark:text-surface-100">Failed to load requirements</h3>
          <p className="text-surface-500 dark:text-surface-400 mt-1">{error}</p>
          <button onClick={() => { setLoading(true); setError(null); apiFetch(`/api/restaurant/meal-requirements?date=${selectedDate}`).then(setRequirements).catch((err) => setError(err.message)).finally(() => setLoading(false)); }} className="mt-4 text-brand-600 dark:text-brand-400 font-medium hover:text-brand-700 dark:hover:text-brand-300">
            Try again
          </button>
        </div>
      </div>
    );
  }

  const reqs = requirements?.requirements || [];
  const totalConfirmed = reqs.reduce((sum, r) => sum + r.confirmed, 0);
  const totalDeclined = reqs.reduce((sum, r) => sum + r.declined, 0);
  const totalPending = reqs.reduce((sum, r) => sum + r.pending, 0);
  const totalEmployees = reqs.reduce((sum, r) => sum + r.total_employees, 0);

  const summaryCards = [
    { label: 'Confirmed', value: totalConfirmed, icon: <CheckIcon />, color: 'success', bg: 'bg-success-50 dark:bg-emerald-900/20', text: 'text-success-600 dark:text-emerald-400', iconBg: 'bg-success-100 dark:bg-emerald-900/30' },
    { label: 'Declined', value: totalDeclined, icon: <XIcon />, color: 'danger', bg: 'bg-danger-50 dark:bg-red-900/20', text: 'text-danger-600 dark:text-red-400', iconBg: 'bg-danger-100 dark:bg-red-900/30' },
    { label: 'No Response', value: totalPending, icon: <ClockIcon />, color: 'warning', bg: 'bg-warning-50 dark:bg-amber-900/20', text: 'text-warning-600 dark:text-amber-400', iconBg: 'bg-warning-100 dark:bg-amber-900/30' },
    { label: 'Total', value: totalEmployees, icon: <UsersIcon />, color: 'brand', bg: 'bg-brand-50 dark:bg-blue-900/20', text: 'text-brand-600 dark:text-blue-400', iconBg: 'bg-brand-100 dark:bg-blue-900/30' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Meal Requirements"
        subtitle="View lunch requirements by organization"
      />

      {/* Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {summaryCards.map((card, idx) => (
          <Card key={card.label} className={`animate-fade-in-up`} style={{ animationDelay: `${idx * 60}ms` }}>
            <div className="flex items-center gap-3">
              <div className={`${card.iconBg} ${card.text} rounded-xl p-2.5 shrink-0`}>
                {card.icon}
              </div>
              <div className="min-w-0">
                <p className="text-xs text-surface-500 dark:text-surface-400 truncate">{card.label}</p>
                <p className={`text-2xl font-bold ${card.text} tabular-nums`}>{card.value}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Organization Cards */}
      {reqs.length === 0 ? (
        <EmptyState
          icon={
            <svg className="w-8 h-8 text-surface-400 dark:text-surface-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          }
          title="No requirements found"
          description={`No meal requirements available for ${new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}`}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {reqs.map((req, idx) => {
            const orgTotal = req.total_employees || 1;
            const confirmedWidth = (req.confirmed / orgTotal) * 100;
            const declinedWidth = (req.declined / orgTotal) * 100;
            const pendingWidth = (req.pending / orgTotal) * 100;

            return (
              <Card
                key={idx}
                hover
                className="animate-fade-in-up"
                style={{ animationDelay: `${(idx + 4) * 60}ms` }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-semibold text-surface-900 dark:text-surface-100 truncate">{req.organization_name}</h3>
                    <p className="text-xs text-surface-400 dark:text-surface-500 mt-0.5">
                      {req.confirmed} of {req.total_employees} confirmed
                    </p>
                  </div>
                  <span className="text-lg font-bold text-success-600 dark:text-emerald-400 tabular-nums shrink-0 ml-3">{req.confirmed}</span>
                </div>

                {/* Mini Bar */}
                <div className="w-full h-2.5 rounded-full bg-surface-100 dark:bg-surface-700 overflow-hidden flex">
                  {req.confirmed > 0 && (
                    <div
                      className="h-full bg-success-500 transition-all duration-500"
                      style={{ width: `${confirmedWidth}%` }}
                    />
                  )}
                  {req.declined > 0 && (
                    <div
                      className="h-full bg-danger-400 transition-all duration-500"
                      style={{ width: `${declinedWidth}%` }}
                    />
                  )}
                  {req.pending > 0 && (
                    <div
                      className="h-full bg-warning-400 transition-all duration-500"
                      style={{ width: `${pendingWidth}%` }}
                    />
                  )}
                </div>

                {/* Legend */}
                <div className="flex items-center gap-3 mt-3">
                  {req.confirmed > 0 && (
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-success-500" />
                      <span className="text-[11px] text-surface-500 dark:text-surface-400">{req.confirmed}</span>
                    </div>
                  )}
                  {req.declined > 0 && (
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-danger-400" />
                      <span className="text-[11px] text-surface-500 dark:text-surface-400">{req.declined}</span>
                    </div>
                  )}
                  {req.pending > 0 && (
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-warning-400" />
                      <span className="text-[11px] text-surface-500 dark:text-surface-400">{req.pending}</span>
                    </div>
                  )}
                </div>

                {/* Bottom stats */}
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-surface-100 dark:border-surface-700/50">
                  <div className="flex items-center gap-1.5 text-xs text-surface-500 dark:text-surface-400">
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8z" />
                    </svg>
                    {req.total_employees} employees
                  </div>
                  {req.total_employees > 0 && (
                    <span className="text-xs font-medium text-success-600 dark:text-emerald-400 bg-success-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded-full">
                      {Math.round((req.confirmed / req.total_employees) * 100)}% confirmed
                    </span>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
