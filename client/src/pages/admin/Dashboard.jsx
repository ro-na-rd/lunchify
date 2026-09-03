import { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card, StatCard, Badge, Button, Skeleton, EmptyState, ErrorState, Input, Select, Modal, Avatar } from '../../components/ui';
import { useToast } from '../../components/ui/Toast';

const COLORS = {
  confirmed: '#22c55e',
  declined: '#f87171',
  pending: '#fbbf24',
};

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function formatDateLabel(dateStr) {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
}

function formatDateShort(dateStr) {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function isToday(dateStr) {
  return dateStr === new Date().toISOString().split('T')[0];
}

function getRelativeDayLabel(dateStr) {
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  if (dateStr === today) return 'Today';
  if (dateStr === yesterday) return 'Yesterday';
  return formatDateShort(dateStr);
}

function CustomPieTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const { name, value, fill } = payload[0];
  return (
    <div className="bg-white dark:bg-surface-800 rounded-xl shadow-elevated border border-surface-100 dark:border-surface-700 px-4 py-2.5">
      <div className="flex items-center gap-2">
        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: fill }} />
        <span className="text-sm font-medium text-surface-700 dark:text-surface-200">{name}</span>
        <span className="text-sm font-bold text-surface-900 dark:text-surface-100 ml-auto">{value}</span>
      </div>
    </div>
  );
}

function CustomBarTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-surface-800 rounded-xl shadow-elevated border border-surface-100 dark:border-surface-700 px-4 py-3">
      <p className="text-sm font-semibold text-surface-900 dark:text-surface-100 mb-1.5">{label}</p>
      {payload.map((entry) => (
        <div key={entry.name} className="flex items-center gap-2 text-sm">
          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="text-surface-500 dark:text-surface-400 capitalize">{entry.name}:</span>
          <span className="font-medium text-surface-700 dark:text-surface-200">{entry.value}</span>
        </div>
      ))}
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-8 animate-fade-in">
      <div className="space-y-2">
        <Skeleton variant="text" width={240} height={36} />
        <Skeleton variant="text" width={320} height={20} />
      </div>
      <div className="flex items-center gap-3">
        <Skeleton variant="rectangular" width={120} height={40} className="rounded-xl" />
        <Skeleton variant="rectangular" width={100} height={40} className="rounded-xl" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
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
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <Card className="lg:col-span-2"><Skeleton variant="card" height={320} /></Card>
        <Card className="lg:col-span-3"><Skeleton variant="card" height={320} /></Card>
      </div>
      <Card><Skeleton variant="card" height={200} /></Card>
    </div>
  );
}

const statusBadge = {
  confirmed: { variant: 'success', label: 'Taking Lunch' },
  declined: { variant: 'danger', label: 'Not Taking' },
  pending: { variant: 'warning', label: 'No Response' },
};

export default function AdminDashboard() {
  const { apiFetch, user } = useAuth();
  const { showToast } = useToast();
  const [stats, setStats] = useState(null);
  const [weeklyData, setWeeklyData] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [reminders, setReminders] = useState({ count: 0, employees: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tableLoading, setTableLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [reminderModalOpen, setReminderModalOpen] = useState(false);
  const [sendingReminder, setSendingReminder] = useState(false);
  const [allNoResponseEmployees, setAllNoResponseEmployees] = useState([]);

  const today = new Date().toISOString().split('T')[0];

  const fetchDashboard = useCallback(async (date) => {
    setLoading(true);
    setError(null);
    let dashOk = false;
    try {
      const dashData = await apiFetch(`/api/admin/dashboard?date=${date}`);
      setStats(dashData);
      dashOk = true;
    } catch {
      setError('Unable to load dashboard data.');
    }
    try {
      const weekData = await apiFetch('/api/admin/dashboard/weekly');
      setWeeklyData(weekData.weeklyData || []);
    } catch { /* ok, leave weeklyData as-is */ }
    try {
      const deptData = await apiFetch('/api/admin/departments');
      setDepartments(deptData || []);
    } catch { /* ok */ }
    try {
      const reminderData = await apiFetch('/api/admin/dashboard/reminders');
      setReminders(reminderData || { count: 0, employees: [] });
    } catch { /* ok */ }
    setLoading(false);
  }, [apiFetch]);

  const fetchAttendance = useCallback(async (date) => {
    setTableLoading(true);
    try {
      const data = await apiFetch(`/api/admin/attendance?date=${date}&limit=50`);
      setAttendanceRecords(data.records || []);
    } catch {
      setAttendanceRecords([]);
    } finally {
      setTableLoading(false);
    }
  }, [apiFetch]);

  useEffect(() => {
    fetchDashboard(selectedDate);
  }, [selectedDate, fetchDashboard]);

  useEffect(() => {
    fetchAttendance(selectedDate);
  }, [selectedDate, fetchAttendance]);

  const noResponseEmployees = useMemo(() => {
    return attendanceRecords.filter(r => !r.status || r.status === 'pending');
  }, [attendanceRecords]);

  const handlePrevDay = () => {
    const d = new Date(selectedDate + 'T12:00:00');
    d.setDate(d.getDate() - 1);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const handleNextDay = () => {
    const d = new Date(selectedDate + 'T12:00:00');
    d.setDate(d.getDate() + 1);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const handleReturnToday = () => {
    setSelectedDate(today);
  };

  const safeStats = useMemo(() => {
    if (!stats) return { totalEmployees: 0, confirmedToday: 0, declinedToday: 0, noResponse: 0 };
    const total = Math.max(0, stats.totalEmployees || 0);
    const confirmed = Math.min(Math.max(0, stats.confirmedToday || 0), total);
    const declined = Math.min(Math.max(0, stats.declinedToday || 0), total - confirmed);
    const noResponse = Math.max(0, total - confirmed - declined);
    return { totalEmployees: total, confirmedToday: confirmed, declinedToday: declined, noResponse };
  }, [stats]);

  const pieData = useMemo(() => {
    return [
      { name: 'Confirmed', value: safeStats.confirmedToday },
      { name: 'Declined', value: safeStats.declinedToday },
      { name: 'No Response', value: safeStats.noResponse },
    ].filter((d) => d.value > 0);
  }, [safeStats]);

  const responseRate = safeStats.totalEmployees > 0
    ? Math.round(((safeStats.confirmedToday + safeStats.declinedToday) / safeStats.totalEmployees) * 100)
    : 0;

  const filteredRecords = useMemo(() => {
    let result = attendanceRecords;
    if (search) {
      const s = search.toLowerCase();
      result = result.filter(r =>
        r.name.toLowerCase().includes(s) ||
        (r.employee_number && r.employee_number.toLowerCase().includes(s))
      );
    }
    if (deptFilter) {
      result = result.filter(r => r.department === deptFilter);
    }
    if (statusFilter) {
      if (statusFilter === 'pending') {
        result = result.filter(r => !r.status || r.status === 'pending');
      } else {
        result = result.filter(r => r.status === statusFilter);
      }
    }
    return result;
  }, [attendanceRecords, search, deptFilter, statusFilter]);

  const handleSendReminder = async () => {
    setSendingReminder(true);
    try {
      const result = await apiFetch('/api/admin/dashboard/reminders', { method: 'POST' });
      setReminderModalOpen(false);
      showToast({ type: 'success', title: 'Reminders sent', message: result.message || `Reminder sent to ${result.sent} employee(s)` });
    } catch {
      showToast({ type: 'error', title: 'Failed to send reminders', message: 'Could not send reminders. Please try again.' });
    } finally {
      setSendingReminder(false);
    }
  };

  const handleSendSingleReminder = async (empId, empName) => {
    try {
      const result = await apiFetch('/api/admin/dashboard/reminders', {
        method: 'POST',
        body: JSON.stringify({ employeeIds: [empId] }),
      });
      showToast({ type: 'success', title: 'Reminder sent', message: `Reminder sent to ${empName}` });
    } catch {
      showToast({ type: 'error', title: 'Failed', message: `Could not send reminder to ${empName}` });
    }
  };

  if (loading) return <LoadingSkeleton />;

  if (error) {
    return (
      <div className="animate-fade-in">
        <ErrorState title="Unable to load dashboard" message={error} onRetry={() => fetchDashboard(selectedDate)} />
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-[28px] font-bold text-surface-900 dark:text-surface-100 tracking-tight">
          {getGreeting()}, {user?.name?.split(' ')[0]} <span className="inline-block animate-[wave_0.6s_ease-in-out_0.3s_1]">&#x1F44B;</span>
        </h1>
        <p className="text-surface-500 dark:text-surface-400 mt-1.5 text-[15px]">
          Here's the lunch attendance overview for <span className="font-medium text-surface-700 dark:text-surface-200">{formatDateLabel(selectedDate)}</span>
        </p>
      </div>

      {/* Date Selector */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={handlePrevDay}
          className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 text-surface-600 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-700 transition-colors"
          title="Previous day"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>

        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="rounded-xl border border-surface-200 dark:border-surface-700 px-3 py-2 text-sm bg-white dark:bg-surface-800 dark:text-surface-100 transition-colors focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10"
        />

        <button
          onClick={handleNextDay}
          className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 text-surface-600 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-700 transition-colors"
          title="Next day"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>

        {!isToday(selectedDate) && (
          <button
            onClick={handleReturnToday}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-400 hover:bg-brand-100 dark:hover:bg-brand-900/30 transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            Today
          </button>
        )}

        <span className="hidden sm:inline-flex items-center px-3 py-2 text-sm font-medium text-surface-500 dark:text-surface-400">
          {getRelativeDayLabel(selectedDate)}
        </span>

        {reminders.count > 0 && (
          <button
            onClick={() => setReminderModalOpen(true)}
            className="ml-auto inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            {reminders.count} not responded
          </button>
        )}
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          title="Total Employees"
          value={safeStats.totalEmployees}
          icon={
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
            </svg>
          }
          color="brand"
        />
        <StatCard
          title="Taking Lunch"
          value={safeStats.confirmedToday}
          icon={
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          }
          color="success"
          trend={responseRate > 0 ? `${responseRate}%` : undefined}
          trendDirection="up"
        />
        <StatCard
          title="Not Taking"
          value={safeStats.declinedToday}
          icon={
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M18 6L6 18M6 6l12 12" />
            </svg>
          }
          color="danger"
        />
        <StatCard
          title="No Response"
          value={safeStats.noResponse}
          icon={
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          color="warning"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Pie Chart */}
        <Card className="lg:col-span-2">
          <div className="mb-5">
            <h3 className="text-base font-semibold text-surface-900 dark:text-surface-100">Today's Distribution</h3>
            <p className="text-sm text-surface-400 dark:text-surface-500 mt-0.5">Lunch confirmation breakdown</p>
          </div>
          {pieData.length > 0 ? (
            <div className="flex items-center justify-center" style={{ height: 260 }}>
              <ResponsiveContainer width="100%" height="100%">
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
                    formatter={(value) => <span className="text-sm text-surface-600 dark:text-surface-300">{value}</span>}
                  />
                  <text x="50%" y="46%" textAnchor="middle" dominantBaseline="central" className="fill-surface-900 dark:fill-surface-100 text-2xl font-bold">
                    {safeStats.totalEmployees}
                  </text>
                  <text x="50%" y="56%" textAnchor="middle" dominantBaseline="central" className="fill-surface-400 dark:fill-surface-500 text-xs">
                    Total
                  </text>
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState
              icon={<svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
              title="No data yet"
              description="Waiting for employee responses"
            />
          )}
        </Card>

        {/* Bar Chart */}
        <Card className="lg:col-span-3">
          <div className="mb-5">
            <h3 className="text-base font-semibold text-surface-900 dark:text-surface-100">Weekly Overview</h3>
            <p className="text-sm text-surface-400 dark:text-surface-500 mt-0.5">7-day attendance trend</p>
          </div>
          <div style={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData} barCategoryGap="20%">
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:stroke-surface-700" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip content={<CustomBarTooltip />} />
                <Legend verticalAlign="bottom" height={36} formatter={(value) => <span className="text-sm text-surface-600 dark:text-surface-300 capitalize">{value}</span>} />
                <Bar dataKey="confirmed" name="Confirmed" fill={COLORS.confirmed} radius={[4, 4, 0, 0]} />
                <Bar dataKey="declined" name="Declined" fill={COLORS.declined} radius={[4, 4, 0, 0]} />
                <Bar dataKey="pending" name="No Response" fill={COLORS.pending} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Attendance Table */}
      <Card padding="none">
        <div className="px-6 py-4 border-b border-surface-100 dark:border-surface-700/50">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h3 className="text-base font-semibold text-surface-900 dark:text-surface-100">Attendance</h3>
              <p className="text-sm text-surface-500 dark:text-surface-400 mt-0.5">
                {formatDateLabel(selectedDate)} &middot; {attendanceRecords.length} records
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative flex-1 sm:w-56">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                </span>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by name or employee #"
                  className="w-full rounded-xl border border-surface-200 dark:border-surface-700 pl-10 pr-4 py-2 text-sm bg-white dark:bg-surface-800 dark:text-surface-100 transition-colors focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 placeholder:text-surface-400"
                />
              </div>
              <select
                value={deptFilter}
                onChange={(e) => setDeptFilter(e.target.value)}
                className="rounded-xl border border-surface-200 dark:border-surface-700 px-3 py-2 text-sm bg-white dark:bg-surface-800 dark:text-surface-100 transition-colors focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10"
              >
                <option value="">All Departments</option>
                {departments.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-xl border border-surface-200 dark:border-surface-700 px-3 py-2 text-sm bg-white dark:bg-surface-800 dark:text-surface-100 transition-colors focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10"
              >
                <option value="">All Statuses</option>
                <option value="confirmed">Confirmed</option>
                <option value="declined">Declined</option>
                <option value="pending">No Response</option>
              </select>
            </div>
          </div>
        </div>

        {/* Mobile Cards */}
        <div className="sm:hidden divide-y divide-surface-50 dark:divide-surface-700/50">
          {tableLoading ? (
            <div className="p-6 space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton variant="circular" width={40} height={40} />
                  <div className="flex-1 space-y-2"><Skeleton variant="text" width="60%" /><Skeleton variant="text" width="40%" /></div>
                </div>
              ))}
            </div>
          ) : filteredRecords.length === 0 ? (
            <EmptyState
              icon={<svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
              title="No records found"
              description={attendanceRecords.length === 0 ? "No attendance data for this date" : "No records match your filters"}
            />
          ) : (
            filteredRecords.map((record, idx) => (
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
                  <div className="flex items-center gap-2">
                    <Badge variant={statusBadge[record.status || 'pending'].variant} dot>
                      {statusBadge[record.status || 'pending'].label}
                    </Badge>
                    {(!record.status || record.status === 'pending') && (
                      <button
                        onClick={() => handleSendSingleReminder(record.user_id, record.name)}
                        className="p-1.5 rounded-lg text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors"
                        title="Send reminder"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                        </svg>
                      </button>
                    )}
                  </div>
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
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider">Department</th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider">Response Time</th>
                <th className="px-6 py-3.5 text-right text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-50 dark:divide-surface-700/50">
              {tableLoading ? (
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
              ) : filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={5}>
                    <EmptyState
                      icon={<svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                      title="No records found"
                      description={attendanceRecords.length === 0 ? "No attendance data for this date" : "No records match your filters"}
                    />
                  </td>
                </tr>
              ) : (
                filteredRecords.map((record, idx) => (
                  <tr key={idx} className="hover:bg-surface-50/50 dark:hover:bg-surface-700/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <Avatar name={record.name} size="sm" />
                        <div>
                          <span className="text-sm font-medium text-surface-900 dark:text-surface-100">{record.name}</span>
                          {record.employee_number && (
                            <p className="text-xs text-surface-400 dark:text-surface-500">#{record.employee_number}</p>
                          )}
                        </div>
                      </div>
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
                        ? new Date(record.confirmed_at).toLocaleTimeString()
                        : <span className="text-surface-300 dark:text-surface-600">-</span>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      {(!record.status || record.status === 'pending') && (
                        <button
                          onClick={() => handleSendSingleReminder(record.user_id, record.name)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors"
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                          </svg>
                          Remind
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <Card>
          <h3 className="text-base font-semibold text-surface-900 dark:text-surface-100 mb-4">Quick Actions</h3>
          <div className="space-y-2">
            {[
              { to: '/admin/employees', label: 'View All Employees', desc: 'Manage employee roster', color: 'brand' },
              { to: '/admin/attendance', label: 'View Attendance', desc: 'Track daily confirmations', color: 'green' },
              { to: '/admin/reports', label: 'Generate Report', desc: 'Export attendance data', color: 'amber' },
            ].map((action) => (
              <Link key={action.to} to={action.to} className="group flex items-center gap-3 p-3 rounded-xl hover:bg-surface-50 dark:hover:bg-surface-700 transition-colors">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                  action.color === 'brand' ? 'bg-brand-50 dark:bg-brand-900/20 group-hover:bg-brand-100 dark:group-hover:bg-brand-900/30' :
                  action.color === 'green' ? 'bg-emerald-50 dark:bg-emerald-900/20 group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900/30' :
                  'bg-amber-50 dark:bg-amber-900/20 group-hover:bg-amber-100 dark:group-hover:bg-amber-900/30'
                }`}>
                  <svg className={`w-5 h-5 ${
                    action.color === 'brand' ? 'text-brand-600 dark:text-brand-400' :
                    action.color === 'green' ? 'text-emerald-600 dark:text-emerald-400' :
                    'text-amber-600 dark:text-amber-400'
                  }`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-surface-900 dark:text-surface-100">{action.label}</p>
                  <p className="text-xs text-surface-400 dark:text-surface-500">{action.desc}</p>
                </div>
                <svg className="w-4 h-4 text-surface-300 dark:text-surface-500 group-hover:text-surface-500 dark:group-hover:text-surface-300 transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            ))}
          </div>
        </Card>

        {/* Settings Summary */}
        <Card>
          <h3 className="text-base font-semibold text-surface-900 dark:text-surface-100 mb-4">Organization</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3.5 bg-surface-50 dark:bg-surface-700/50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center">
                  <svg className="w-4 h-4 text-brand-600 dark:text-brand-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-surface-900 dark:text-surface-100">Cutoff Time</p>
                  <p className="text-xs text-surface-400 dark:text-surface-500">Daily confirmation deadline</p>
                </div>
              </div>
              <Badge variant="brand" size="md">
                {stats?.cutoff?.hour?.toString().padStart(2, '0')}:{stats?.cutoff?.minute?.toString().padStart(2, '0')}
              </Badge>
            </div>
            <div className="flex items-center justify-between p-3.5 bg-surface-50 dark:bg-surface-700/50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                  <svg className="w-4 h-4 text-emerald-600 dark:text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-surface-900 dark:text-surface-100">Response Rate</p>
                  <p className="text-xs text-surface-400 dark:text-surface-500">Today's participation</p>
                </div>
              </div>
              <Badge variant={responseRate >= 80 ? 'success' : responseRate >= 50 ? 'warning' : 'danger'} size="md">
                {responseRate}%
              </Badge>
            </div>
          </div>
          <div className="mt-4">
            <Link to="/admin/settings">
              <Button variant="outline" fullWidth size="sm">
                Manage Settings
              </Button>
            </Link>
          </div>
        </Card>
      </div>

      {/* Reminder Modal */}
      <Modal isOpen={reminderModalOpen} onClose={() => setReminderModalOpen(false)} title="Send Lunch Reminder">
        <div className="space-y-4">
          <p className="text-sm text-surface-600 dark:text-surface-300">
            Send a lunch confirmation reminder to <span className="font-semibold">{reminders.count}</span> employee{reminders.count !== 1 ? 's' : ''} who have not responded for today?
          </p>
          {reminders.employees.length > 0 && (
            <div className="max-h-48 overflow-y-auto rounded-xl border border-surface-200 dark:border-surface-700 divide-y divide-surface-100 dark:divide-surface-700/50">
              {reminders.employees.map((emp) => (
                <div key={emp.id} className="flex items-center gap-3 px-4 py-3">
                  <Avatar name={emp.name} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-surface-900 dark:text-surface-100 truncate">{emp.name}</p>
                    <p className="text-xs text-surface-400 dark:text-surface-500 truncate">{emp.email}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={() => setReminderModalOpen(false)} disabled={sendingReminder}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSendReminder} disabled={sendingReminder}>
              {sendingReminder ? 'Sending...' : `Send to ${reminders.count} employee${reminders.count !== 1 ? 's' : ''}`}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
