import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';

export default function KitchenView() {
  const { restaurantId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [clock, setClock] = useState(new Date());

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/restaurant/kitchen/${restaurantId}`);
      if (!res.ok) throw new Error('Restaurant not found');
      const result = await res.json();
      setData(result);
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [restaurantId]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, [fetchData]);

  useEffect(() => {
    const timer = setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (d) => d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  };

  const shell = 'min-h-screen bg-gradient-to-br from-[#0a1836] via-[#0b1b3f] to-[#0a1430]';

  if (loading && !data) {
    return (
      <div className={`${shell} flex items-center justify-center`}>
        <div className="text-center">
          <div className="w-14 h-14 border-4 border-brand-500/30 border-t-brand-400 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-blue-200/60 text-sm font-medium">Loading kitchen display…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${shell} flex items-center justify-center`}>
        <div className="text-center max-w-md mx-auto px-6">
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Restaurant not found</h2>
          <p className="text-blue-200/50">{error}</p>
        </div>
      </div>
    );
  }

  const total = (data?.confirmed || 0) + (data?.declined || 0) + (data?.pending || 0);
  const responseRate = total > 0 ? Math.round(((data?.confirmed || 0) + (data?.declined || 0)) / total * 100) : 0;

  const card = 'bg-white/[0.04] border border-white/10 rounded-2xl';

  return (
    <div className={shell}>
      {/* Top Bar */}
      <div className="bg-[#0a1836]/80 backdrop-blur-xl border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center shadow-lg shadow-brand-500/30">
                <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 002-2V2" />
                  <path d="M7 2v20" />
                  <path d="M21 15V2v0a5 5 0 00-5 5v6c0 1.1.9 2 2 2h3zm0 0v7" />
                </svg>
              </div>
              <div>
                <h1 className="text-base font-bold text-white tracking-tight">{data?.restaurant || 'Restaurant'}</h1>
                <p className="text-[11px] text-blue-200/50 font-medium">Kitchen Display &middot; Lunchify</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-lg border border-white/10">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs text-blue-100/80 font-medium">Live</span>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-white tabular-nums">{formatTime(clock)}</p>
                <p className="text-[11px] text-blue-200/50">{formatDate(data?.date)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Meals to prepare — hero */}
          <div className="col-span-2 rounded-2xl p-6 sm:p-8 text-white relative overflow-hidden bg-gradient-to-br from-brand-500 to-brand-700 shadow-xl shadow-brand-900/40">
            <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/3" />
            <div className="absolute bottom-0 left-0 w-28 h-28 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/3" />
            <div className="relative">
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2 h-2 rounded-full bg-emerald-300" />
                <p className="text-brand-100 text-sm font-medium">Meals to Prepare</p>
              </div>
              <p className="text-6xl sm:text-7xl font-black tabular-nums leading-none">{data?.confirmed || 0}</p>
              <p className="text-brand-100/80 text-sm mt-3 font-medium">
                {data?.confirmed === 1 ? '1 employee confirmed' : `${data?.confirmed || 0} employees confirmed`}
              </p>
            </div>
          </div>

          {/* Declined */}
          <div className={`${card} p-5 sm:p-6`}>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-3 h-3 rounded-full bg-red-400" />
              <p className="text-blue-200/50 text-xs font-medium uppercase tracking-wider">Declined</p>
            </div>
            <p className="text-4xl sm:text-5xl font-black text-red-400 tabular-nums">{data?.declined || 0}</p>
            <p className="text-blue-200/40 text-xs mt-2">Not taking lunch</p>
          </div>

          {/* Pending */}
          <div className={`${card} p-5 sm:p-6`}>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-3 h-3 rounded-full bg-amber-400 animate-pulse" />
              <p className="text-blue-200/50 text-xs font-medium uppercase tracking-wider">Pending</p>
            </div>
            <p className="text-4xl sm:text-5xl font-black text-amber-400 tabular-nums">{data?.pending || 0}</p>
            <p className="text-blue-200/40 text-xs mt-2">No response yet</p>
          </div>
        </div>

        {/* Response Rate */}
        <div className={`${card} p-4 sm:p-5`}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-blue-100/80">Response Rate</p>
            <p className="text-sm font-bold text-white tabular-nums">{responseRate}%</p>
          </div>
          <div className="h-3 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-brand-400 to-brand-300 rounded-full transition-all duration-700"
              style={{ width: `${responseRate}%` }}
            />
          </div>
          <div className="flex items-center justify-between mt-2">
            <p className="text-xs text-blue-200/40">{(data?.confirmed || 0) + (data?.declined || 0)} of {total} responded</p>
            <p className="text-xs text-blue-200/40">Total employees: {data?.totalEmployees || 0}</p>
          </div>
        </div>

        {/* Confirmed Employees Table */}
        {data?.confirmedEmployees?.length > 0 && (
          <div className={`${card} overflow-hidden`}>
            <div className="px-5 sm:px-6 py-4 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/15 flex items-center justify-center">
                  <svg className="w-4 h-4 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-sm font-bold text-white">Confirmed — preparing meals</h2>
              </div>
              <span className="px-2.5 py-1 bg-emerald-500/15 text-emerald-300 text-xs font-bold rounded-lg">{data.confirmed}</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left px-5 sm:px-6 py-3 text-[11px] font-semibold text-blue-200/40 uppercase tracking-wider">#</th>
                    <th className="text-left px-5 sm:px-6 py-3 text-[11px] font-semibold text-blue-200/40 uppercase tracking-wider">Employee</th>
                    <th className="text-left px-5 sm:px-6 py-3 text-[11px] font-semibold text-blue-200/40 uppercase tracking-wider hidden sm:table-cell">Department</th>
                    <th className="text-left px-5 sm:px-6 py-3 text-[11px] font-semibold text-blue-200/40 uppercase tracking-wider hidden md:table-cell">Emp. No.</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {data.confirmedEmployees.map((emp, i) => (
                    <tr key={i} className="hover:bg-white/[0.03] transition-colors">
                      <td className="px-5 sm:px-6 py-3.5 text-sm text-blue-200/40 tabular-nums">{i + 1}</td>
                      <td className="px-5 sm:px-6 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-brand-500/20 flex items-center justify-center text-brand-200 font-bold text-xs shrink-0">
                            {emp.name?.charAt(0)?.toUpperCase()}
                          </div>
                          <span className="text-sm font-semibold text-white">{emp.name}</span>
                        </div>
                      </td>
                      <td className="px-5 sm:px-6 py-3.5 hidden sm:table-cell">
                        <span className="px-2 py-1 bg-white/5 text-blue-100/70 text-xs font-medium rounded-md">{emp.department || '-'}</span>
                      </td>
                      <td className="px-5 sm:px-6 py-3.5 text-sm text-blue-200/40 font-mono hidden md:table-cell">{emp.employee_number || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Pending Employees */}
        {data?.pendingEmployees?.length > 0 && (
          <div className={`${card} overflow-hidden`}>
            <div className="px-5 sm:px-6 py-4 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-500/15 flex items-center justify-center">
                  <svg className="w-4 h-4 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h2 className="text-sm font-bold text-white">Awaiting Response</h2>
              </div>
              <span className="px-2.5 py-1 bg-amber-500/15 text-amber-300 text-xs font-bold rounded-lg">{data.pending}</span>
            </div>
            <div className="p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {data.pendingEmployees.map((emp, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-3 bg-white/[0.03] rounded-xl border border-white/5">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/15 flex items-center justify-center text-amber-300 font-bold text-xs shrink-0">
                    {emp.name?.charAt(0)?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{emp.name}</p>
                    <p className="text-xs text-blue-200/40">{emp.department || ''}</p>
                  </div>
                  <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shrink-0" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Declined Employees */}
        {data?.declinedEmployees?.length > 0 && (
          <div className={`${card} overflow-hidden`}>
            <div className="px-5 sm:px-6 py-4 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-red-500/15 flex items-center justify-center">
                  <svg className="w-4 h-4 text-red-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <h2 className="text-sm font-bold text-white">Not Taking Lunch</h2>
              </div>
              <span className="px-2.5 py-1 bg-red-500/15 text-red-300 text-xs font-bold rounded-lg">{data.declined}</span>
            </div>
            <div className="p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {data.declinedEmployees.map((emp, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-3 bg-white/[0.03] rounded-xl border border-white/5 opacity-60">
                  <div className="w-8 h-8 rounded-lg bg-red-500/15 flex items-center justify-center text-red-300 font-bold text-xs shrink-0">
                    {emp.name?.charAt(0)?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{emp.name}</p>
                    <p className="text-xs text-blue-200/40">{emp.department || ''}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {data?.confirmed === 0 && data?.declined === 0 && data?.pending === 0 && (
          <div className={`${card} p-12 text-center`}>
            <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-blue-200/40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-white">No responses yet</h3>
            <p className="text-blue-200/50 mt-1">Confirmations will appear here as employees respond.</p>
          </div>
        )}

        {/* Footer */}
        <div className="text-center py-4 flex items-center justify-center gap-2">
          <div className="w-2 h-2 rounded-full bg-brand-400 animate-pulse" />
          <p className="text-xs text-blue-200/40">
            Auto-refreshes every 15 seconds
            {lastUpdated ? ` · updated ${lastUpdated.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}` : ''}
            {' · Lunchify by Azul Tech'}
          </p>
        </div>
      </div>
    </div>
  );
}
