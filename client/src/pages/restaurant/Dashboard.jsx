import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useDatePicker } from '../../context/DatePickerContext';
import { Card, Skeleton, StatCard } from '../../components/ui';
import {
  PieChart, Pie, Cell, AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-surface-800 rounded-xl shadow-elevated border border-surface-100 dark:border-surface-700 px-4 py-3">
        <p className="text-xs font-medium text-surface-500 dark:text-surface-400 mb-1">{label}</p>
        {payload.map((entry, i) => (
          <p key={i} className="text-sm font-semibold" style={{ color: entry.color }}>
            {entry.name}: {entry.value} meals
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const PieTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-surface-800 rounded-xl shadow-elevated border border-surface-100 dark:border-surface-700 px-4 py-3">
        <p className="text-sm font-semibold" style={{ color: payload[0].payload.fill }}>
          {payload[0].name}: {payload[0].value} meals
        </p>
      </div>
    );
  }
  return null;
};

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="space-y-2">
        <Skeleton variant="text" width={200} height={20} />
        <Skeleton variant="text" width={320} height={14} />
      </div>
      <Skeleton variant="rectangular" height={220} className="rounded-2xl" />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} variant="rectangular" height={120} className="rounded-2xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Skeleton variant="rectangular" height={320} className="rounded-2xl" />
        <Skeleton variant="rectangular" height={320} className="rounded-2xl" />
      </div>
    </div>
  );
}

export default function RestaurantDashboard() {
  const { apiFetch } = useAuth();
  const { selectedDate, heroLabel, displayDate } = useDatePicker();
  const [stats, setStats] = useState(null);
  const [trends, setTrends] = useState([]);
  const [roster, setRoster] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    Promise.all([
      apiFetch(`/api/restaurant/dashboard?date=${selectedDate}`),
      apiFetch('/api/restaurant/trends?days=7'),
      apiFetch(`/api/restaurant/roster?date=${selectedDate}`),
    ])
      .then(([dashboardData, trendsData, rosterData]) => {
        setStats(dashboardData);
        setTrends(trendsData.trends || []);
        setRoster(rosterData);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [selectedDate]);

  if (loading) return <DashboardSkeleton />;

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-20">
        <div className="w-16 h-16 rounded-2xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-red-500 dark:text-red-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-surface-900 dark:text-surface-100">Failed to load dashboard</h3>
        <p className="text-surface-500 dark:text-surface-400 mt-1">{error}</p>
        <button onClick={() => window.location.reload()} className="mt-4 text-brand-600 dark:text-brand-400 font-medium hover:text-brand-700 dark:hover:text-brand-300">
          Try again
        </button>
      </div>
    );
  }

  const total = (stats?.confirmedLunches || 0) + (stats?.notTakingLunch || 0) + (stats?.noResponse || 0);
  const confirmedPct = total > 0 ? Math.round((stats.confirmedLunches / total) * 100) : 0;

  const pieData = [
    { name: 'Confirmed', value: stats?.confirmedLunches || 0, fill: '#22c55e' },
    { name: 'Not Taking', value: stats?.notTakingLunch || 0, fill: '#f87171' },
    { name: 'No Response', value: stats?.noResponse || 0, fill: '#fbbf24' },
  ];

  const trendData = trends.map((t) => ({
    date: new Date(t.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short' }),
    confirmed: t.confirmed,
  }));

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-[28px] font-bold text-surface-900 dark:text-surface-100 tracking-tight">
          {getGreeting()}
        </h1>
        <p className="text-surface-500 dark:text-surface-400 mt-1.5 text-[15px]">Your daily meal preparation overview</p>
      </div>

      {/* Hero: Meals to Prepare */}
      <Card className="relative overflow-hidden bg-gradient-to-br from-brand-50 via-white to-brand-50/30 dark:from-brand-900/20 dark:via-surface-800 dark:to-brand-900/10 border-brand-200/50 dark:border-brand-700/30 !p-0">
        <div className="absolute top-0 right-0 w-40 h-40 bg-brand-100/40 dark:bg-brand-900/20 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
        <div className="relative flex flex-col items-center text-center py-8 sm:py-10 px-6">
          <div className="w-14 h-14 rounded-2xl bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center mb-4 animate-bounce-gentle">
            <div className="text-brand-600 dark:text-brand-400">
              <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 002-2V2M7 2v20M21 15V2v0a5 5 0 00-5 5v6c0 1.1.9 2 2 2h3zm0 0v7" />
              </svg>
            </div>
          </div>
          <p className="text-sm font-medium text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-2">{stats?.restaurant?.name}</p>
          <div className="flex items-baseline gap-3">
            <span className="text-7xl sm:text-8xl font-extrabold text-brand-600 dark:text-brand-400 tabular-nums animate-scale-in">
              {stats?.confirmedLunches || 0}
            </span>
          </div>
          <p className="text-xl sm:text-2xl font-semibold text-surface-800 dark:text-surface-100 mt-1">{heroLabel}</p>
          <p className="text-sm text-surface-500 dark:text-surface-400 mt-2">Based on confirmed lunch responses</p>
          {stats?.totalEmployees > 0 && (
            <div className="mt-4 flex items-center gap-2 text-xs text-surface-400 dark:text-surface-500">
              <span className="inline-block w-2 h-2 rounded-full bg-brand-400 animate-pulse-soft" />
              {confirmedPct}% confirmation rate
            </div>
          )}
        </div>
      </Card>

      {/* Stat Cards */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        {[
          { title: 'Confirmed', value: stats?.confirmedLunches || 0, color: 'success', pct: confirmedPct },
          { title: 'Not Taking', value: stats?.notTakingLunch || 0, color: 'danger', pct: total > 0 ? Math.round((stats.notTakingLunch / total) * 100) : 0 },
          { title: 'No Response', value: stats?.noResponse || 0, color: 'warning', pct: total > 0 ? Math.round((stats.noResponse / total) * 100) : 0 },
        ].map((card, idx) => (
          <Card key={card.title} hover className="animate-fade-in-up" style={{ animationDelay: `${idx * 80}ms` }}>
            <div className="flex items-start justify-between mb-3">
              <div className={`rounded-xl p-2.5 ${
                card.color === 'success' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' :
                card.color === 'danger' ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' :
                'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400'
              }`}>
                {card.color === 'success' ? (
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                ) : card.color === 'danger' ? (
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                ) : (
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                )}
              </div>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                card.color === 'success' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300' :
                card.color === 'danger' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300' :
                'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'
              }`}>
                {card.pct}%
              </span>
            </div>
            <p className="text-sm text-surface-500 dark:text-surface-400">{card.title}</p>
            <p className="text-3xl font-bold text-surface-900 dark:text-surface-100 mt-0.5 tabular-nums">{card.value}</p>
            <div className="mt-3 w-full bg-surface-100 dark:bg-surface-700 rounded-full h-1.5 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ease-out ${
                  card.color === 'success' ? 'bg-emerald-500' :
                  card.color === 'danger' ? 'bg-red-500' :
                  'bg-amber-500'
                }`}
                style={{ width: `${card.pct}%` }}
              />
            </div>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="animate-fade-in-up" style={{ animationDelay: '200ms' }}>
          <div className="mb-5">
            <h3 className="text-base font-semibold text-surface-900 dark:text-surface-100">Meal Distribution</h3>
            <p className="text-xs text-surface-400 dark:text-surface-500 mt-0.5">{displayDate} response breakdown</p>
          </div>
          {total > 0 ? (
            <div className="flex items-center justify-center">
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={100}
                    paddingAngle={3}
                    dataKey="value"
                    strokeWidth={0}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip content={<PieTooltip />} />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    formatter={(value) => (
                      <span className="text-xs font-medium text-surface-600 dark:text-surface-300">{value}</span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex items-center justify-center h-[260px] text-surface-400 dark:text-surface-500 text-sm">
              No data available
            </div>
          )}
        </Card>

        <Card className="animate-fade-in-up" style={{ animationDelay: '280ms' }}>
          <div className="mb-5">
            <h3 className="text-base font-semibold text-surface-900 dark:text-surface-100">Weekly Trend</h3>
            <p className="text-xs text-surface-400 dark:text-surface-500 mt-0.5">Last 7 days of confirmed meals</p>
          </div>
          {trendData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={trendData} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}>
                <defs>
                  <linearGradient id="emeraldGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22c55e" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#22c55e" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:stroke-surface-700" vertical={false} />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} dy={8} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} dx={-4} />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="confirmed"
                  name="Confirmed"
                  stroke="#22c55e"
                  strokeWidth={2.5}
                  fill="url(#emeraldGradient)"
                  dot={false}
                  activeDot={{ r: 5, fill: '#22c55e', stroke: '#fff', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[260px] text-surface-400 dark:text-surface-500 text-sm">
              No trend data available
            </div>
          )}
        </Card>
      </div>

      {/* Who's confirmed */}
      <Card padding="none" className="animate-fade-in-up" style={{ animationDelay: '320ms' }}>
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-surface-100 dark:border-surface-700/50">
          <div>
            <h3 className="text-base font-semibold text-surface-900 dark:text-surface-100">Confirmed for lunch</h3>
            <p className="text-xs text-surface-400 dark:text-surface-500 mt-0.5">{displayDate}</p>
          </div>
          <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 tabular-nums">
            {roster?.confirmed?.length || 0} meals
          </span>
        </div>

        {roster?.confirmed?.length ? (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-surface-100 dark:border-surface-700/50">
                  <th className="px-5 sm:px-6 py-2.5 text-left text-[11px] font-semibold text-surface-400 dark:text-surface-500 uppercase tracking-wider">#</th>
                  <th className="px-5 sm:px-6 py-2.5 text-left text-[11px] font-semibold text-surface-400 dark:text-surface-500 uppercase tracking-wider">Employee</th>
                  <th className="px-5 sm:px-6 py-2.5 text-left text-[11px] font-semibold text-surface-400 dark:text-surface-500 uppercase tracking-wider hidden sm:table-cell">Department</th>
                  <th className="px-5 sm:px-6 py-2.5 text-left text-[11px] font-semibold text-surface-400 dark:text-surface-500 uppercase tracking-wider hidden md:table-cell">Confirmed at</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-50 dark:divide-surface-700/50">
                {roster.confirmed.map((emp, i) => (
                  <tr key={i} className="hover:bg-surface-50/60 dark:hover:bg-surface-700/40 transition-colors">
                    <td className="px-5 sm:px-6 py-3 text-sm text-surface-400 dark:text-surface-500 tabular-nums">{i + 1}</td>
                    <td className="px-5 sm:px-6 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 flex items-center justify-center text-xs font-bold shrink-0">
                          {emp.name?.charAt(0)?.toUpperCase()}
                        </div>
                        <span className="text-sm font-medium text-surface-900 dark:text-surface-100">{emp.name}</span>
                      </div>
                    </td>
                    <td className="px-5 sm:px-6 py-3 text-sm text-surface-500 dark:text-surface-400 hidden sm:table-cell">{emp.department || '—'}</td>
                    <td className="px-5 sm:px-6 py-3 text-sm text-surface-400 dark:text-surface-500 hidden md:table-cell tabular-nums">
                      {emp.confirmed_at ? new Date(emp.confirmed_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-6 py-10 text-center text-sm text-surface-400 dark:text-surface-500">
            No confirmations yet for this day.
          </div>
        )}

        {(roster?.pending?.length > 0 || roster?.declined?.length > 0) && (
          <div className="px-5 sm:px-6 py-3 border-t border-surface-100 dark:border-surface-700/50 text-xs text-surface-400 dark:text-surface-500">
            {roster.pending.length} awaiting response · {roster.declined.length} not taking lunch
          </div>
        )}
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-fade-in-up" style={{ animationDelay: '360ms' }}>
        <Link to="/restaurant/requirements">
          <Card hover className="group cursor-pointer">
            <div className="flex items-center gap-4">
              <div className="rounded-xl bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 p-3 group-hover:bg-brand-600 dark:group-hover:bg-brand-500 group-hover:text-white transition-colors duration-200">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-surface-900 dark:text-surface-100">View Meal Requirements</p>
                <p className="text-xs text-surface-500 dark:text-surface-400 mt-0.5">See breakdown by organization</p>
              </div>
              <svg className="w-4 h-4 text-surface-400 dark:text-surface-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </div>
          </Card>
        </Link>
        <Link to="/restaurant/reports">
          <Card hover className="group cursor-pointer">
            <div className="flex items-center gap-4">
              <div className="rounded-xl bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 p-3 group-hover:bg-amber-600 dark:group-hover:bg-amber-500 group-hover:text-white transition-colors duration-200">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-surface-900 dark:text-surface-100">Generate Report</p>
                <p className="text-xs text-surface-500 dark:text-surface-400 mt-0.5">Export preparation report</p>
              </div>
              <svg className="w-4 h-4 text-surface-400 dark:text-surface-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </div>
          </Card>
        </Link>
      </div>
    </div>
  );
}
