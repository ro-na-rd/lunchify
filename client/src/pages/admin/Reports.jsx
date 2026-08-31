import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/ui/Toast';
import {
  Card, Button, Badge, Input, Select, Skeleton, EmptyState, PageHeader,
} from '../../components/ui';

const DownloadIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const ChartIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

const FileIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const statusBadge = {
  confirmed: { variant: 'success', label: 'Taking Lunch' },
  declined: { variant: 'danger', label: 'Not Taking Lunch' },
};

function LoadingSkeleton() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <Skeleton variant="text" width={200} height={32} />
        <Skeleton variant="text" width={280} height={18} className="mt-2" />
      </div>
      <Card>
        <Skeleton variant="text" width={180} height={24} className="mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => <Skeleton key={i} variant="rectangular" height={40} className="rounded-xl" />)}
        </div>
        <Skeleton variant="rectangular" width={160} height={40} className="rounded-xl mt-4" />
      </Card>
    </div>
  );
}

export default function AdminReports() {
  const { apiFetch } = useAuth();
  const { showToast } = useToast();
  const [departments, setDepartments] = useState([]);
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [department, setDepartment] = useState('');
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    apiFetch('/api/admin/departments')
      .then(setDepartments)
      .catch(() => {})
      .finally(() => setFetching(false));
  }, []);

  const summary = useMemo(() => {
    if (!records.length) return { total: 0, confirmed: 0, declined: 0 };
    return {
      total: records.length,
      confirmed: records.filter(r => r.status === 'confirmed').length,
      declined: records.filter(r => r.status === 'declined').length,
    };
  }, [records]);

  const generateReport = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ startDate, endDate });
      if (department) params.set('department', department);
      const data = await apiFetch(`/api/admin/reports/attendance?${params}`);
      setRecords(data.records);
      setGenerated(true);
      showToast({ type: 'success', title: 'Report generated', message: `Found ${data.records.length} records.` });
    } catch (err) {
      showToast({ type: 'error', title: 'Report failed', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  const downloadCSV = async () => {
    try {
      const params = new URLSearchParams({ startDate, endDate, format: 'csv' });
      if (department) params.set('department', department);
      const blob = await apiFetch(`/api/admin/reports/attendance?${params}`);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `attendance-report-${startDate}-to-${endDate}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      showToast({ type: 'success', title: 'Download started', message: 'Your CSV file is downloading.' });
    } catch (err) {
      showToast({ type: 'error', title: 'Download failed', message: err.message });
    }
  };

  if (fetching) return <LoadingSkeleton />;

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Reports"
        subtitle="Generate and export company-level attendance reports"
      />

      {/* Report Parameters */}
      <Card>
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center text-brand-600">
            <ChartIcon />
          </div>
          <div>
            <h3 className="text-base font-semibold text-surface-900">Report Parameters</h3>
            <p className="text-sm text-surface-500">Configure date range and department filter</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            label="Start Date"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
          <Input
            label="End Date"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
          <Select
            label="Department"
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            options={[{ value: '', label: 'All Departments' }, ...departments.map(d => ({ value: d, label: d }))]}
          />
        </div>

        <div className="flex gap-3 mt-5">
          <Button variant="primary" icon={<ChartIcon />} loading={loading} onClick={generateReport}>
            Generate Report
          </Button>
          {generated && records.length > 0 && (
            <Button variant="success" icon={<DownloadIcon />} onClick={downloadCSV}>
              Export CSV
            </Button>
          )}
        </div>
      </Card>

      {/* Results */}
      {generated && (
        <>
          {/* Summary Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-fade-in-up">
            <Card>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center text-brand-600">
                  <FileIcon />
                </div>
                <div>
                  <p className="text-2xl font-bold text-surface-900">{summary.total}</p>
                  <p className="text-sm text-surface-500">Total Records</p>
                </div>
              </div>
            </Card>
            <Card>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-success-50 flex items-center justify-center text-success-600">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-2xl font-bold text-success-700">{summary.confirmed}</p>
                  <p className="text-sm text-surface-500">Confirmed</p>
                </div>
              </div>
            </Card>
            <Card>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-danger-50 flex items-center justify-center text-danger-600">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-2xl font-bold text-danger-700">{summary.declined}</p>
                  <p className="text-sm text-surface-500">Declined</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Results Table */}
          <Card padding="none" className="animate-fade-in-up">
            <div className="px-6 py-4 border-b border-surface-100">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <h3 className="text-base font-semibold text-surface-900">Attendance Report</h3>
                  <p className="text-sm text-surface-500">
                    {startDate} to {endDate} &middot; {records.length} records
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" icon={<DownloadIcon />} onClick={downloadCSV}>
                    CSV
                  </Button>
                  <Button variant="outline" size="sm" disabled>
                    Excel
                  </Button>
                  <Button variant="outline" size="sm" disabled>
                    PDF
                  </Button>
                </div>
              </div>
            </div>

            {/* Mobile Cards */}
            <div className="sm:hidden divide-y divide-surface-50">
              {records.length === 0 ? (
                <EmptyState
                  icon={<FileIcon />}
                  title="No records found"
                  description="Try adjusting the date range or department filter"
                />
              ) : (
                records.map((record, idx) => (
                  <div key={idx} className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-surface-900 truncate">{record.name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          {record.employee_number && <p className="text-xs text-surface-400">#{record.employee_number}</p>}
                          {record.department && <Badge variant="neutral" size="sm">{record.department}</Badge>}
                        </div>
                        <p className="text-xs text-surface-400 mt-1">
                          {new Date(record.date + 'T00:00:00').toLocaleDateString()}
                        </p>
                      </div>
                      <Badge variant={statusBadge[record.status]?.variant || 'neutral'} dot>
                        {statusBadge[record.status]?.label || record.status}
                      </Badge>
                    </div>
                    {record.confirmed_at && (
                      <p className="text-xs text-surface-400 mt-2">
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
                  <tr className="border-b border-surface-100">
                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-surface-500 uppercase tracking-wider">Employee</th>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-surface-500 uppercase tracking-wider">Employee #</th>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-surface-500 uppercase tracking-wider">Department</th>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-surface-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-surface-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-surface-500 uppercase tracking-wider">Confirmed At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-50">
                  {records.length === 0 ? (
                    <tr>
                      <td colSpan={6}>
                        <EmptyState
                          icon={<FileIcon />}
                          title="No records found"
                          description="Try adjusting the date range or department filter"
                        />
                      </td>
                    </tr>
                  ) : (
                    records.map((record, idx) => (
                      <tr key={idx} className="hover:bg-surface-50/50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-surface-900">{record.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-surface-600">
                          {record.employee_number || <span className="text-surface-300">-</span>}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-surface-500">
                          {record.department || <span className="text-surface-300">-</span>}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-surface-700">
                          {new Date(record.date + 'T00:00:00').toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge variant={statusBadge[record.status]?.variant || 'neutral'} dot>
                            {statusBadge[record.status]?.label || record.status}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-surface-500">
                          {record.confirmed_at
                            ? new Date(record.confirmed_at).toLocaleString()
                            : <span className="text-surface-300">-</span>}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}

      {!generated && (
        <Card>
          <EmptyState
            icon={<ChartIcon />}
            title="No report generated yet"
            description="Select your date range and click Generate Report to view attendance data"
          />
        </Card>
      )}
    </div>
  );
}
