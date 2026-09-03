import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { PageHeader, Card, Button, Skeleton } from '../../components/ui';

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

const DownloadIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const PrinterIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
  </svg>
);

const CalendarIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const UtensilsIcon = () => (
  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 002-2V2M7 2v20M21 15V2v0a5 5 0 00-5 5v6c0 1.1.9 2 2 2h3zm0 0v7" />
  </svg>
);

const FileTextIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

function ReportSkeleton() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-2">
          <Skeleton variant="text" width={140} height={24} />
          <Skeleton variant="text" width={260} height={14} />
        </div>
        <Skeleton variant="rectangular" width={180} height={44} className="rounded-xl" />
      </div>
      <Skeleton variant="rectangular" height={480} className="rounded-2xl" />
    </div>
  );
}

export default function RestaurantReports() {
  const { apiFetch } = useAuth();
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const generateReport = async () => {
    setLoading(true);
    try {
      const data = await apiFetch(`/api/restaurant/reports/preparation?date=${date}`);
      setReport(data);
      setGenerated(true);
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const downloadCSV = async () => {
    setDownloading(true);
    try {
      const blob = await apiFetch(`/api/restaurant/reports/preparation?date=${date}&format=csv`);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `preparation-report-${date}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert(err.message);
    } finally {
      setDownloading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Reports"
        subtitle="Generate lunch preparation reports"
      />

      {/* Generator */}
      <Card className="animate-fade-in-up">
        <div className="flex flex-col sm:flex-row gap-4 items-end">
          <div className="flex-1">
            <label className="block text-xs font-medium text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-2">
              Report Date
            </label>
            <div className="flex items-center gap-2 bg-surface-50 dark:bg-surface-900 rounded-xl border border-surface-200 dark:border-surface-700 px-3 py-2.5">
              <CalendarIcon />
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="text-sm font-medium text-surface-700 dark:text-surface-200 bg-transparent border-none outline-none cursor-pointer flex-1"
              />
            </div>
          </div>
          <Button
            variant="primary"
            size="lg"
            loading={loading}
            onClick={generateReport}
            className="sm:self-end"
          >
            Generate Report
          </Button>
        </div>
      </Card>

      {loading && <ReportSkeleton />}

      {/* Report Card */}
      {generated && report && !loading && (
        <div className="animate-fade-in-up" style={{ animationDelay: '100ms' }}>
          <Card padding="none" className="overflow-hidden">
            {/* Report Header */}
            <div className="bg-gradient-to-r from-brand-600 to-brand-700 px-6 sm:px-8 py-6 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
              <div className="relative">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                    <FileTextIcon />
                  </div>
                  <span className="text-xs font-medium text-brand-200 uppercase tracking-wider">Preparation Report</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold">{report.restaurant}</h2>
                <p className="text-brand-200 mt-1">
                  {new Date(report.date + 'T00:00:00').toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
            </div>

            {/* Report Body */}
            <div className="px-6 sm:px-8 py-6 sm:py-8 dark:bg-surface-800">
              {/* Big number callout */}
              <div className="flex flex-col items-center text-center mb-8 py-6 bg-success-50 dark:bg-emerald-900/20 rounded-2xl border border-success-200/50 dark:border-emerald-700/30">
                <div className="w-14 h-14 rounded-2xl bg-success-100 dark:bg-emerald-900/30 flex items-center justify-center mb-3">
                  <div className="text-success-600 dark:text-emerald-400">
                    <UtensilsIcon />
                  </div>
                </div>
                <p className="text-sm font-medium text-success-600 dark:text-emerald-400 uppercase tracking-wider mb-1">Total Meals Required</p>
                <p className="text-6xl sm:text-7xl font-extrabold text-success-600 dark:text-emerald-400 tabular-nums animate-scale-in">
                  {report.totalMealsRequired}
                </p>
                <p className="text-sm text-success-600/70 dark:text-emerald-400/70 mt-2">Based on confirmed lunch responses</p>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                {/* Confirmed */}
                <div className="flex items-center gap-4 bg-success-50 dark:bg-emerald-900/20 rounded-xl p-4 border border-success-100 dark:border-emerald-800/30">
                  <div className="rounded-xl bg-success-100 dark:bg-emerald-900/30 text-success-600 dark:text-emerald-400 p-2.5">
                    <CheckIcon />
                  </div>
                  <div>
                    <p className="text-xs text-success-600/70 dark:text-emerald-400/70">Confirmed</p>
                    <p className="text-2xl font-bold text-success-700 dark:text-emerald-300 tabular-nums">{report.confirmedLunches}</p>
                  </div>
                </div>

                {/* Not Taking */}
                <div className="flex items-center gap-4 bg-danger-50 dark:bg-red-900/20 rounded-xl p-4 border border-danger-100 dark:border-red-800/30">
                  <div className="rounded-xl bg-danger-100 dark:bg-red-900/30 text-danger-600 dark:text-red-400 p-2.5">
                    <XIcon />
                  </div>
                  <div>
                    <p className="text-xs text-danger-600/70 dark:text-red-400/70">Not Taking Lunch</p>
                    <p className="text-2xl font-bold text-danger-700 dark:text-red-300 tabular-nums">{report.notTakingLunch}</p>
                  </div>
                </div>

                {/* No Response */}
                <div className="flex items-center gap-4 bg-warning-50 dark:bg-amber-900/20 rounded-xl p-4 border border-warning-100 dark:border-amber-800/30">
                  <div className="rounded-xl bg-warning-100 dark:bg-amber-900/30 text-warning-600 dark:text-amber-400 p-2.5">
                    <ClockIcon />
                  </div>
                  <div>
                    <p className="text-xs text-warning-600/70 dark:text-amber-400/70">No Response</p>
                    <p className="text-2xl font-bold text-warning-700 dark:text-amber-300 tabular-nums">{report.noResponse}</p>
                  </div>
                </div>
              </div>

              {/* Visual breakdown bar */}
              <div className="mb-8">
                <p className="text-xs font-medium text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-2">Response Breakdown</p>
                <div className="w-full h-4 rounded-full bg-surface-100 dark:bg-surface-700 overflow-hidden flex">
                  {report.totalMealsRequired > 0 && (
                    <>
                      <div
                        className="h-full bg-success-500 transition-all duration-700"
                        style={{ width: `${(report.confirmedLunches / (report.confirmedLunches + report.notTakingLunch + report.noResponse || 1)) * 100}%` }}
                      />
                      <div
                        className="h-full bg-danger-400 transition-all duration-700"
                        style={{ width: `${(report.notTakingLunch / (report.confirmedLunches + report.notTakingLunch + report.noResponse || 1)) * 100}%` }}
                      />
                      <div
                        className="h-full bg-warning-400 transition-all duration-700"
                        style={{ width: `${(report.noResponse / (report.confirmedLunches + report.notTakingLunch + report.noResponse || 1)) * 100}%` }}
                      />
                    </>
                  )}
                </div>
                <div className="flex items-center gap-4 mt-2">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-success-500" />
                    <span className="text-xs text-surface-600 dark:text-surface-300">Confirmed</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-danger-400" />
                    <span className="text-xs text-surface-600 dark:text-surface-300">Not Taking</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-warning-400" />
                    <span className="text-xs text-surface-600 dark:text-surface-300">No Response</span>
                  </div>
                </div>
              </div>

              {/* Export Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-surface-100 dark:border-surface-700/50">
                <Button
                  variant="success"
                  icon={<DownloadIcon />}
                  onClick={downloadCSV}
                  loading={downloading}
                >
                  Download CSV
                </Button>
                <Button
                  variant="secondary"
                  icon={
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  }
                  disabled
                >
                  Excel
                </Button>
                <Button
                  variant="secondary"
                  icon={<PrinterIcon />}
                  onClick={handlePrint}
                >
                  Print
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Empty state when no report generated yet */}
      {!generated && !loading && (
        <div className="flex flex-col items-center justify-center text-center py-16 animate-fade-in">
          <div className="w-20 h-20 rounded-3xl bg-surface-100 dark:bg-surface-800 flex items-center justify-center mb-5">
            <svg className="w-10 h-10 text-surface-300 dark:text-surface-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-surface-900 dark:text-surface-100">Generate a Report</h3>
          <p className="text-surface-500 dark:text-surface-400 mt-1 max-w-sm">
            Select a date and click Generate Report to create a meal preparation report
          </p>
        </div>
      )}
    </div>
  );
}
