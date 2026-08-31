import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card, StatCard, Badge, Button, Skeleton, PageHeader, EmptyState } from '../../components/ui';

const UsersIcon = () => (
  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
  </svg>
);

const CheckIcon = () => (
  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const XIcon = () => (
  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const ClockIcon = () => (
  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const COLORS = {
  confirmed: '#22c55e',
  declined: '#f87171',
  pending: '#fbbf24',
};

function generateWeeklyData(confirmed, declined, pending) {
  const total = confirmed + declined + pending || 1;
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  return days.map((day) => {
    const variance = 0.7 + Math.random() * 0.6;
    const c = Math.round((confirmed / total) * (total * variance) * 0.9);
    const d = Math.round((declined / total) * (total * variance) * 0.9);
    const p = Math.round((pending / total) * (total * variance) * 0.9);
    return { day, confirmed: Math.max(0, c), declined: Math.max(0, d), pending: Math.max(0, p) };
  });
}

function CustomPieTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const { name, value, fill } = payload[0];
  return (
    <div className="bg-white rounded-xl shadow-elevated border border-surface-100 px-4 py-2.5">
      <div className="flex items-center gap-2">
        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: fill }} />
        <span className="text-sm font-medium text-surface-700">{name}</span>
        <span className="text-sm font-bold text-surface-900 ml-auto">{value}</span>
      </div>
    </div>
  );
}

function CustomBarTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white rounded-xl shadow-elevated border border-surface-100 px-4 py-3">
      <p className="text-sm font-semibold text-surface-900 mb-1.5">{label}</p>
      {payload.map((entry) => (
        <div key={entry.name} className="flex items-center gap-2 text-sm">
          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="text-surface-500 capitalize">{entry.name}:</span>
          <span className="font-medium text-surface-700">{entry.value}</span>
        </div>
      ))}
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <Skeleton variant="text" width={200} height={32} />
        <Skeleton variant="text" width={280} height={20} className="mt-2" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <div className="flex items-center gap-4">
              <Skeleton variant="rectangular" width={48} height={48} className="rounded-xl" />
              <div className="flex-1 space-y-2">
                <Skeleton variant="text" width="60%" />
                <Skeleton variant="text" width="40%" height={32} />
              </div>
            </div>
          </Card>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card><Skeleton variant="card" height={320} /></Card>
        <Card><Skeleton variant="card" height={320} /></Card>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card><Skeleton variant="card" height={180} /></Card>
        <Card><Skeleton variant="card" height={180} /></Card>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const { apiFetch } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch('/api/admin/dashboard')
      .then(setStats)
      .finally(() => setLoading(false));
  }, []);

  const weeklyData = useMemo(() => {
    if (!stats) return [];
    return generateWeeklyData(stats.confirmedToday, stats.declinedToday, stats.noResponse);
  }, [stats]);

  const pieData = useMemo(() => {
    if (!stats) return [];
    return [
      { name: 'Confirmed', value: stats.confirmedToday },
      { name: 'Declined', value: stats.declinedToday },
      { name: 'No Response', value: stats.noResponse },
    ].filter((d) => d.value > 0);
  }, [stats]);

  const responseRate = stats
    ? Math.round(((stats.confirmedToday + stats.declinedToday) / (stats.totalEmployees || 1)) * 100)
    : 0;

  if (loading) return <LoadingSkeleton />;

  return (
    <div className="space-y-8 animate-fade-in">
      <PageHeader
        title="Dashboard"
        subtitle="Employee management and attendance overview"
      />

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Employees"
          value={stats.totalEmployees}
          icon={<UsersIcon />}
          color="brand"
          trend="All time"
          trendDirection="neutral"
        />
        <StatCard
          title="Confirmed Lunch"
          value={stats.confirmedToday}
          icon={<CheckIcon />}
          color="success"
          trend={responseRate > 0 ? `${responseRate}% rate` : undefined}
          trendDirection="up"
        />
        <StatCard
          title="Not Taking Lunch"
          value={stats.declinedToday}
          icon={<XIcon />}
          color="danger"
        />
        <StatCard
          title="No Response"
          value={stats.noResponse}
          icon={<ClockIcon />}
          color="warning"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Chart */}
        <Card>
          <h3 className="text-base font-semibold text-surface-900 mb-1">Today's Distribution</h3>
          <p className="text-sm text-surface-500 mb-6">Lunch confirmation breakdown</p>
          {pieData.length > 0 ? (
            <div className="flex items-center justify-center" style={{ height: 280 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={110}
                    paddingAngle={3}
                    dataKey="value"
                    strokeWidth={0}
                  >
                    {pieData.map((entry) => (
                      <Cell
                        key={entry.name}
                        fill={COLORS[entry.name === 'Confirmed' ? 'confirmed' : entry.name === 'Declined' ? 'declined' : 'pending']}
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomPieTooltip />} />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    formatter={(value) => <span className="text-sm text-surface-600">{value}</span>}
                  />
                  {/* Center label */}
                  <text x="50%" y="46%" textAnchor="middle" dominantBaseline="central" className="fill-surface-900 text-3xl font-bold">
                    {stats.confirmedToday + stats.declinedToday + stats.noResponse}
                  </text>
                  <text x="50%" y="56%" textAnchor="middle" dominantBaseline="central" className="fill-surface-400 text-xs">
                    Total
                  </text>
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState
              icon={<ClockIcon />}
              title="No data yet"
              description="Waiting for employee responses"
            />
          )}
        </Card>

        {/* Bar Chart */}
        <Card>
          <h3 className="text-base font-semibold text-surface-900 mb-1">Weekly Overview</h3>
          <p className="text-sm text-surface-500 mb-6">Simulated 7-day attendance trend</p>
          <div style={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData} barCategoryGap="20%">
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis
                  dataKey="day"
                  tick={{ fontSize: 12, fill: '#64748b' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: '#64748b' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<CustomBarTooltip />} />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  formatter={(value) => <span className="text-sm text-surface-600 capitalize">{value}</span>}
                />
                <Bar dataKey="confirmed" name="Confirmed" fill={COLORS.confirmed} radius={[4, 4, 0, 0]} />
                <Bar dataKey="declined" name="Declined" fill={COLORS.declined} radius={[4, 4, 0, 0]} />
                <Bar dataKey="pending" name="No Response" fill={COLORS.pending} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <Card>
          <h3 className="text-base font-semibold text-surface-900 mb-1">Quick Actions</h3>
          <p className="text-sm text-surface-500 mb-5">Navigate to common admin tasks</p>
          <div className="space-y-3">
            <Link to="/admin/employees" className="group flex items-center gap-3 p-3 rounded-xl hover:bg-surface-50 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center group-hover:bg-brand-100 transition-colors">
                <UsersIcon />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-surface-900 group-hover:text-brand-700 transition-colors">View All Employees</p>
                <p className="text-xs text-surface-500">Manage employee roster and departments</p>
              </div>
              <svg className="w-4 h-4 text-surface-400 group-hover:text-brand-500 transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </Link>
            <Link to="/admin/attendance" className="group flex items-center gap-3 p-3 rounded-xl hover:bg-surface-50 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-success-50 flex items-center justify-center group-hover:bg-success-100 transition-colors">
                <CheckIcon />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-surface-900 group-hover:text-success-700 transition-colors">View Attendance</p>
                <p className="text-xs text-surface-500">Track daily lunch confirmations</p>
              </div>
              <svg className="w-4 h-4 text-surface-400 group-hover:text-success-500 transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </Link>
            <Link to="/admin/reports" className="group flex items-center gap-3 p-3 rounded-xl hover:bg-surface-50 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-warning-50 flex items-center justify-center group-hover:bg-warning-100 transition-colors">
                <svg className="w-5 h-5 text-warning-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-surface-900 group-hover:text-warning-700 transition-colors">Generate Report</p>
                <p className="text-xs text-surface-500">Export attendance data and analytics</p>
              </div>
              <svg className="w-4 h-4 text-surface-400 group-hover:text-warning-500 transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </Card>

        {/* Settings Summary */}
        <Card>
          <h3 className="text-base font-semibold text-surface-900 mb-1">Organization Settings</h3>
          <p className="text-sm text-surface-500 mb-5">Current configuration overview</p>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-surface-50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center">
                  <ClockIcon />
                </div>
                <div>
                  <p className="text-sm font-medium text-surface-900">Lunch Cutoff Time</p>
                  <p className="text-xs text-surface-500">Daily confirmation deadline</p>
                </div>
              </div>
              <Badge variant="brand" size="md">
                {stats.cutoff.hour.toString().padStart(2, '0')}:{stats.cutoff.minute.toString().padStart(2, '0')}
              </Badge>
            </div>
            <div className="flex items-center justify-between p-4 bg-surface-50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-success-50 flex items-center justify-center">
                  <CheckIcon />
                </div>
                <div>
                  <p className="text-sm font-medium text-surface-900">Response Rate</p>
                  <p className="text-xs text-surface-500">Today's participation</p>
                </div>
              </div>
              <Badge variant={responseRate >= 80 ? 'success' : responseRate >= 50 ? 'warning' : 'danger'} size="md">
                {responseRate}%
              </Badge>
            </div>
            <div className="flex items-center justify-between p-4 bg-surface-50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-warning-50 flex items-center justify-center">
                  <svg className="w-5 h-5 text-warning-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-surface-900">Today</p>
                  <p className="text-xs text-surface-500">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-5">
            <Link to="/admin/settings">
              <Button variant="outline" fullWidth>
                Manage Settings
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
