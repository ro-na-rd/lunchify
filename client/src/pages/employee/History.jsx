import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/ui/Toast';
import { Card, Badge, Button, Skeleton, PageHeader, EmptyState } from '../../components/ui';

const STATUS_CONFIG = {
  confirmed: { label: 'Confirmed', variant: 'success', color: 'bg-success-500' },
  declined: { label: 'Declined', variant: 'neutral', color: 'bg-surface-400 dark:bg-surface-500' },
  pending: { label: 'No Response', variant: 'warning', color: 'bg-warning-500' },
};

function formatDateLabel(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

function formatMonthYear(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

function formatConfirmedAt(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
}

const CheckIcon = () => (
  <svg className="w-5 h-5 text-success-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
);

const DashIcon = () => (
  <svg className="w-5 h-5 text-surface-400 dark:text-surface-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
  </svg>
);

const ClockIcon = () => (
  <svg className="w-5 h-5 text-warning-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const ChevronLeft = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
  </svg>
);

const ChevronRight = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
  </svg>
);

function HistorySkeleton() {
  return (
    <div className="space-y-6 animate-fade-in-up">
      <div>
        <Skeleton variant="text" width="35%" height={28} />
        <Skeleton variant="text" width="50%" height={16} className="mt-2" />
      </div>

      <Card className="!p-0 overflow-hidden">
        {[...Array(6)].map((_, i) => (
          <div key={i} className={`flex items-center gap-4 p-4 ${i < 5 ? 'border-b border-surface-100 dark:border-surface-700/50' : ''}`}>
            <Skeleton variant="rectangular" width={72} height={14} className="shrink-0" />
            <div className="flex-1 flex items-center gap-2">
              <Skeleton variant="circular" width={10} height={10} className="shrink-0" />
              <Skeleton variant="text" width="60%" height={14} />
            </div>
            <Skeleton variant="rectangular" width={24} height={24} className="shrink-0 rounded-lg" />
          </div>
        ))}
      </Card>
    </div>
  );
}

export default function EmployeeHistory() {
  const { apiFetch } = useAuth();
  const { showToast } = useToast();
  const [records, setRecords] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0, limit: 15 });
  const [loading, setLoading] = useState(true);

  const fetchHistory = (page = 1) => {
    setLoading(true);
    apiFetch(`/api/employee/history?page=${page}&limit=15`)
      .then((data) => {
        setRecords(data.records);
        setPagination(data.pagination);
      })
      .catch((err) => {
        showToast({ type: 'error', title: 'Failed to load history', message: err.message });
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const groupedRecords = useMemo(() => {
    const groups = {};
    records.forEach((record) => {
      const key = formatMonthYear(record.date);
      if (!groups[key]) groups[key] = [];
      groups[key].push(record);
    });
    return groups;
  }, [records]);

  const showingFrom = ((pagination.page - 1) * pagination.limit) + 1;
  const showingTo = Math.min(pagination.page * pagination.limit, pagination.total);

  if (loading && records.length === 0) return <HistorySkeleton />;

  return (
    <div className="space-y-6 animate-fade-in-up">
      <PageHeader
        title="My Attendance"
        subtitle={`Track your lunch confirmations · ${pagination.total} total records`}
      />

      {records.length === 0 ? (
        <EmptyState
          icon={
            <svg className="w-8 h-8 text-surface-400 dark:text-surface-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
            </svg>
          }
          title="No attendance records yet"
          description="Your lunch confirmation history will appear here once you start responding to daily prompts."
        />
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedRecords).map(([monthYear, monthRecords]) => (
            <div key={monthYear} className="animate-fade-in-up">
              <h3 className="text-sm font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-3 px-1">
                {monthYear}
              </h3>
              <Card className="!p-0 overflow-hidden">
                {monthRecords.map((record, idx) => {
                  const status = STATUS_CONFIG[record.status] || STATUS_CONFIG.pending;
                  return (
                    <div
                      key={record.date}
                      className={`
                        flex items-center gap-4 px-5 py-3.5
                        transition-colors hover:bg-surface-50 dark:hover:bg-surface-700/50
                        ${idx < monthRecords.length - 1 ? 'border-b border-surface-100 dark:border-surface-700/50' : ''}
                      `}
                    >
                      {/* Date */}
                      <span className="text-sm font-medium text-surface-900 dark:text-surface-100 w-24 shrink-0">
                        {formatDateLabel(record.date)}
                      </span>

                      {/* Status dot + label */}
                      <div className="flex-1 flex items-center gap-2 min-w-0">
                        <span className={`w-2 h-2 rounded-full shrink-0 ${status.color}`} />
                        <Badge variant={status.variant} size="sm">
                          {status.label}
                        </Badge>
                      </div>

                      {/* Action icon */}
                      <div className="shrink-0">
                        {record.status === 'confirmed' && <CheckIcon />}
                        {record.status === 'declined' && <DashIcon />}
                        {record.status === 'pending' && <ClockIcon />}
                      </div>
                    </div>
                  );
                })}
              </Card>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-sm text-surface-500 dark:text-surface-400">
            Showing <span className="font-medium text-surface-700 dark:text-surface-200">{showingFrom}</span> to{' '}
            <span className="font-medium text-surface-700 dark:text-surface-200">{showingTo}</span> of{' '}
            <span className="font-medium text-surface-700 dark:text-surface-200">{pagination.total}</span>
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page <= 1}
              onClick={() => fetchHistory(pagination.page - 1)}
              icon={<ChevronLeft />}
            >
              Prev
            </Button>
            <span className="text-sm text-surface-500 dark:text-surface-400 tabular-nums">
              {pagination.page} / {pagination.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => fetchHistory(pagination.page + 1)}
            >
              Next
              <ChevronRight />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
