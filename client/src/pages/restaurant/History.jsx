import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { PageHeader, Card, Button, Skeleton, EmptyState } from '../../components/ui';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts';

const CalendarIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const ChevronLeft = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
  </svg>
);

const ChevronRight = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
  </svg>
);

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-surface-800 rounded-xl shadow-elevated border border-surface-100 dark:border-surface-700 px-4 py-3">
        <p className="text-xs font-medium text-surface-500 dark:text-surface-400 mb-1">{label}</p>
        {payload.map((entry, i) => (
          <p key={i} className="text-sm font-semibold" style={{ color: entry.color }}>
            {entry.name}: {entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

function HistorySkeleton() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-2">
          <Skeleton variant="text" width={160} height={24} />
          <Skeleton variant="text" width={280} height={14} />
        </div>
        <div className="flex gap-2">
          <Skeleton variant="rectangular" width={150} height={40} className="rounded-xl" />
          <Skeleton variant="rectangular" width={150} height={40} className="rounded-xl" />
        </div>
      </div>
      <Skeleton variant="rectangular" height={280} className="rounded-2xl" />
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} variant="rectangular" height={80} className="rounded-2xl" />
        ))}
      </div>
    </div>
  );
}

export default function RestaurantHistory() {
  const { apiFetch } = useAuth();
  const [records, setRecords] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [startDate, setStartDate] = useState(
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  const fetchHistory = (page = 1) => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams({ startDate, endDate, page, limit: 15 });
    apiFetch(`/api/restaurant/history?${params}`)
      .then((data) => {
        setRecords(data.records);
        setPagination(data.pagination);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchHistory();
  }, [startDate, endDate]);

  if (loading && records.length === 0) return <HistorySkeleton />;

  const chartData = records.map((r) => ({
    date: new Date(r.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    confirmed: r.confirmed,
  }));

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="History"
        subtitle="Historical meal preparation data"
        action={
          <div className="flex items-center gap-2 bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 px-3 py-2 shadow-soft">
            <CalendarIcon />
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="text-sm font-medium text-surface-700 dark:text-surface-200 bg-transparent border-none outline-none cursor-pointer"
            />
            <span className="text-surface-300 dark:text-surface-600">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="text-sm font-medium text-surface-700 dark:text-surface-200 bg-transparent border-none outline-none cursor-pointer"
            />
          </div>
        }
      />

      {error && (
        <div className="flex items-center gap-3 bg-danger-50 dark:bg-red-900/20 border border-danger-200 dark:border-red-800/30 rounded-xl px-4 py-3 text-sm text-danger-700 dark:text-red-300 animate-fade-in">
          <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          {error}
        </div>
      )}

      {/* Chart */}
      {chartData.length > 0 && (
        <Card className="animate-fade-in-up">
          <h3 className="text-base font-semibold text-surface-900 dark:text-surface-100 mb-1">Confirmed Meals Over Time</h3>
          <p className="text-xs text-surface-400 dark:text-surface-500 mb-4">Daily confirmed meal count</p>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={chartData} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}>
              <defs>
                <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#5c7cfa" stopOpacity={0.15} />
                  <stop offset="100%" stopColor="#5c7cfa" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:stroke-surface-700" vertical={false} />
              <XAxis
                dataKey="date"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: '#94a3b8' }}
                dy={8}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: '#94a3b8' }}
                dx={-4}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="confirmed"
                name="Confirmed"
                stroke="#5c7cfa"
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 5, fill: '#5c7cfa', stroke: '#fff', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* Daily Records */}
      {records.length === 0 && !loading ? (
        <EmptyState
          icon={
            <svg className="w-8 h-8 text-surface-400 dark:text-surface-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          title="No records found"
          description="No meal data available for the selected date range"
        />
      ) : (
        <div className="space-y-3">
          {records.map((record, idx) => {
            const dayTotal = record.confirmed + record.declined + record.pending;
            const confirmedPct = dayTotal > 0 ? Math.round((record.confirmed / dayTotal) * 100) : 0;

            return (
              <Card
                key={idx}
                hover
                className="animate-fade-in-up"
                style={{ animationDelay: `${idx * 40}ms` }}
              >
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  {/* Date */}
                  <div className="sm:w-40 shrink-0">
                    <p className="text-sm font-semibold text-surface-900 dark:text-surface-100">
                      {new Date(record.date + 'T00:00:00').toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </p>
                    <p className="text-xs text-surface-400 dark:text-surface-500">
                      {new Date(record.date + 'T00:00:00').toLocaleDateString('en-US', {
                        year: 'numeric',
                      })}
                    </p>
                  </div>

                  {/* Large confirmed count */}
                  <div className="flex items-center gap-3 sm:ml-auto">
                    <div className="text-right">
                      <p className="text-xs text-surface-500 dark:text-surface-400 mb-0.5">Meals to prepare</p>
                      <p className="text-2xl font-bold text-success-600 dark:text-emerald-400 tabular-nums">{record.confirmed}</p>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-4 sm:gap-6 sm:w-72">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-success-500" />
                      <span className="text-xs text-surface-600 dark:text-surface-300">
                        <span className="font-semibold">{record.confirmed}</span> confirmed
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-danger-400" />
                      <span className="text-xs text-surface-600 dark:text-surface-300">
                        <span className="font-semibold">{record.declined}</span> not taking
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-warning-400" />
                      <span className="text-xs text-surface-600 dark:text-surface-300">
                        <span className="font-semibold">{record.pending}</span> no response
                      </span>
                    </div>
                  </div>

                  {/* Confirmation rate */}
                  <div className="hidden lg:block w-24 shrink-0">
                    <div className="flex items-center justify-between text-[11px] text-surface-500 dark:text-surface-400 mb-1">
                      <span>Confirmed</span>
                      <span className="font-medium">{confirmedPct}%</span>
                    </div>
                    <div className="w-full bg-surface-100 dark:bg-surface-700 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="h-full bg-success-500 rounded-full transition-all duration-500"
                        style={{ width: `${confirmedPct}%` }}
                      />
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-surface-500 dark:text-surface-400">
            Page <span className="font-medium text-surface-700 dark:text-surface-200">{pagination.page}</span> of{' '}
            <span className="font-medium text-surface-700 dark:text-surface-200">{pagination.totalPages}</span>
            {pagination.total > 0 && (
              <span className="text-surface-400 dark:text-surface-500"> &middot; {pagination.total} records</span>
            )}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              icon={<ChevronLeft />}
              disabled={pagination.page <= 1}
              onClick={() => fetchHistory(pagination.page - 1)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => fetchHistory(pagination.page + 1)}
            >
              Next
              <span className="ml-1"><ChevronRight /></span>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
