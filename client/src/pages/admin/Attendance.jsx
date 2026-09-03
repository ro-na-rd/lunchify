import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  Card, Button, Badge, Select, Skeleton, EmptyState, PageHeader, Avatar,
} from '../../components/ui';

const CheckIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const XIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const ClockIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const statusBadge = {
  confirmed: { variant: 'success', label: 'Taking Lunch' },
  declined: { variant: 'danger', label: 'Not Taking Lunch' },
  pending: { variant: 'warning', label: 'No Response' },
};

const tabs = [
  { key: '', label: 'All' },
  { key: 'confirmed', label: 'Confirmed' },
  { key: 'declined', label: 'Declined' },
  { key: 'pending', label: 'No Response' },
];

function LoadingSkeleton() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <Skeleton variant="text" width={240} height={32} />
        <Skeleton variant="text" width={300} height={18} className="mt-2" />
      </div>
      <Card>
        <div className="flex gap-4 mb-6">
          <Skeleton variant="rectangular" width={180} height={40} className="rounded-xl" />
          <div className="flex gap-2">
            {[...Array(4)].map((_, i) => <Skeleton key={i} variant="rectangular" width={90} height={36} className="rounded-lg" />)}
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} variant="rectangular" height={80} className="rounded-xl" />
          ))}
        </div>
      </Card>
      <Card padding="none">
        <div className="space-y-4 p-6">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-4">
              <Skeleton variant="circular" width={40} height={40} />
              <Skeleton variant="text" width="20%" />
              <Skeleton variant="text" width="15%" />
              <Skeleton variant="text" width="15%" />
              <div className="flex-1" />
              <Skeleton variant="rectangular" width={120} height={24} className="rounded-lg" />
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

export default function AdminAttendance() {
  const { apiFetch } = useAuth();
  const [records, setRecords] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [statusFilter, setStatusFilter] = useState('');

  const fetchAttendance = useCallback((page = 1) => {
    setLoading(true);
    const params = new URLSearchParams({ date, page, limit: 15 });
    if (statusFilter) params.set('status', statusFilter);
    apiFetch(`/api/admin/attendance?${params}`)
      .then(data => {
        setRecords(data.records);
        setPagination(data.pagination);
      })
      .finally(() => setLoading(false));
  }, [date, statusFilter, apiFetch]);

  useEffect(() => {
    fetchAttendance();
  }, [date, statusFilter]);

  const summary = {
    confirmed: records.filter(r => r.status === 'confirmed').length,
    declined: records.filter(r => r.status === 'declined').length,
    pending: records.filter(r => !r.status || r.status === 'pending').length,
  };

  const pageNumbers = [];
  for (let i = Math.max(1, pagination.page - 2); i <= Math.min(pagination.totalPages, pagination.page + 2); i++) {
    pageNumbers.push(i);
  }

  if (loading && records.length === 0) return <LoadingSkeleton />;

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Attendance"
        subtitle="Track employee lunch attendance for any date"
      />

      {/* Filters Card */}
      <Card>
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="w-full md:w-56">
            <label className="block text-sm font-medium text-surface-700 dark:text-surface-200 mb-1.5">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-xl border border-surface-300 dark:border-surface-700 px-4 py-2.5 text-sm bg-white dark:bg-surface-800 dark:text-surface-100 transition-colors focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10"
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-surface-700 dark:text-surface-200 mb-1.5">Status Filter</label>
            <div className="flex flex-wrap gap-2">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setStatusFilter(tab.key)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-150 ${
                    statusFilter === tab.key
                      ? 'bg-brand-600 text-white shadow-md shadow-brand-600/20'
                      : 'bg-surface-100 dark:bg-surface-700 text-surface-600 dark:text-surface-300 hover:bg-surface-200 dark:hover:bg-surface-600'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="flex items-center gap-4 p-4 bg-success-50 dark:bg-emerald-900/20 rounded-xl border border-success-100 dark:border-emerald-800/30">
            <div className="w-12 h-12 rounded-xl bg-success-100 dark:bg-emerald-900/30 flex items-center justify-center text-success-600 dark:text-emerald-400">
              <CheckIcon />
            </div>
            <div>
              <p className="text-2xl font-bold text-success-700 dark:text-emerald-300">{summary.confirmed}</p>
              <p className="text-sm text-success-600 dark:text-emerald-400">Taking Lunch</p>
            </div>
          </div>
          <div className="flex items-center gap-4 p-4 bg-danger-50 dark:bg-red-900/20 rounded-xl border border-danger-100 dark:border-red-800/30">
            <div className="w-12 h-12 rounded-xl bg-danger-100 dark:bg-red-900/30 flex items-center justify-center text-danger-600 dark:text-red-400">
              <XIcon />
            </div>
            <div>
              <p className="text-2xl font-bold text-danger-700 dark:text-red-300">{summary.declined}</p>
              <p className="text-sm text-danger-600 dark:text-red-400">Not Taking Lunch</p>
            </div>
          </div>
          <div className="flex items-center gap-4 p-4 bg-warning-50 dark:bg-amber-900/20 rounded-xl border border-warning-100 dark:border-amber-800/30">
            <div className="w-12 h-12 rounded-xl bg-warning-100 dark:bg-amber-900/30 flex items-center justify-center text-warning-600 dark:text-amber-400">
              <ClockIcon />
            </div>
            <div>
              <p className="text-2xl font-bold text-warning-700 dark:text-amber-300">{summary.pending}</p>
              <p className="text-sm text-warning-600 dark:text-amber-400">No Response</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Records Table */}
      <Card padding="none">
        <div className="px-6 py-4 border-b border-surface-100 dark:border-surface-700/50">
          <h3 className="text-base font-semibold text-surface-900 dark:text-surface-100">
            Attendance Records
          </h3>
          <p className="text-sm text-surface-500 dark:text-surface-400 mt-0.5">
            {new Date(date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            {' '}&middot;{' '}{records.length} records
          </p>
        </div>

        {/* Mobile Cards */}
        <div className="sm:hidden divide-y divide-surface-50 dark:divide-surface-700/50">
          {loading ? (
            <div className="p-6 space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton variant="circular" width={40} height={40} />
                  <div className="flex-1 space-y-2"><Skeleton variant="text" width="60%" /><Skeleton variant="text" width="40%" /></div>
                </div>
              ))}
            </div>
          ) : records.length === 0 ? (
            <EmptyState
              icon={<ClockIcon />}
              title="No records found"
              description="No attendance data for this date and filter"
            />
          ) : (
            records.map((record, idx) => (
              <div key={idx} className="p-4">
                <div className="flex items-start gap-3">
                  <Avatar name={record.name} size="md" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-surface-900 dark:text-surface-100 truncate">{record.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {record.employee_number && (
                        <p className="text-xs text-surface-400 dark:text-surface-500">#{record.employee_number}</p>
                      )}
                      {record.department && (
                        <Badge variant="neutral" size="sm">{record.department}</Badge>
                      )}
                    </div>
                  </div>
                  <Badge variant={statusBadge[record.status || 'pending'].variant} dot>
                    {statusBadge[record.status || 'pending'].label}
                  </Badge>
                </div>
                {record.confirmed_at && (
                  <p className="text-xs text-surface-400 dark:text-surface-500 mt-2 ml-13">
                    Confirmed at {new Date(record.confirmed_at).toLocaleTimeString()}
                  </p>
                )}
              </div>
            ))
          )}
        </div>

        {/* Desktop Table */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-surface-100 dark:border-surface-700/50">
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider">Employee</th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider">Employee #</th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider">Department</th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider">Confirmed At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-50 dark:divide-surface-700/50">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    <td colSpan={5} className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <Skeleton variant="circular" width={40} height={40} />
                        <Skeleton variant="text" width="20%" />
                        <Skeleton variant="text" width="15%" />
                        <Skeleton variant="text" width="15%" />
                        <div className="flex-1" />
                        <Skeleton variant="rectangular" width={120} height={24} className="rounded-lg" />
                      </div>
                    </td>
                  </tr>
                ))
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={5}>
                    <EmptyState
                      icon={<ClockIcon />}
                      title="No records found"
                      description="No attendance data for this date and filter"
                    />
                  </td>
                </tr>
              ) : (
                records.map((record, idx) => (
                  <tr key={idx} className="hover:bg-surface-50/50 dark:hover:bg-surface-700/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <Avatar name={record.name} size="sm" />
                        <span className="text-sm font-medium text-surface-900 dark:text-surface-100">{record.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-surface-600 dark:text-surface-300">
                      {record.employee_number || <span className="text-surface-300 dark:text-surface-600">-</span>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-surface-500 dark:text-surface-400">
                      {record.department || <span className="text-surface-300 dark:text-surface-600">-</span>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant={statusBadge[record.status || 'pending'].variant} dot>
                        {statusBadge[record.status || 'pending'].label}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-surface-500 dark:text-surface-400">
                      {record.confirmed_at
                        ? new Date(record.confirmed_at).toLocaleString()
                        : <span className="text-surface-300 dark:text-surface-600">-</span>}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="px-6 py-4 border-t border-surface-100 dark:border-surface-700/50 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-sm text-surface-500 dark:text-surface-400">
              Page {pagination.page} of {pagination.totalPages}
            </p>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="sm" onClick={() => fetchAttendance(pagination.page - 1)} disabled={pagination.page <= 1}>
                Previous
              </Button>
              {pageNumbers.map((num) => (
                <Button
                  key={num}
                  variant={num === pagination.page ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={() => fetchAttendance(num)}
                  className="min-w-[36px]"
                >
                  {num}
                </Button>
              ))}
              <Button variant="ghost" size="sm" onClick={() => fetchAttendance(pagination.page + 1)} disabled={pagination.page >= pagination.totalPages}>
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
