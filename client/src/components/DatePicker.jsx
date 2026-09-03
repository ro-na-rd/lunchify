import { useState, useEffect, useRef, useCallback } from 'react';
import { useDatePicker } from '../context/DatePickerContext';

const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year, month) {
  return new Date(year, month, 1).getDay();
}

function formatDateISO(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function isSameDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export default function DatePicker() {
  const { selectedDate, setSelectedDate, setToday, headerDate, isToday } = useDatePicker();
  const [open, setOpen] = useState(false);
  const [viewDate, setViewDate] = useState(() => {
    const [y, m, d] = selectedDate.split('-').map(Number);
    return new Date(y, m - 1, d);
  });
  const panelRef = useRef(null);
  const buttonRef = useRef(null);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    function handleClick(e) {
      if (panelRef.current && !panelRef.current.contains(e.target) && buttonRef.current && !buttonRef.current.contains(e.target)) {
        close();
      }
    }
    function handleKey(e) {
      if (e.key === 'Escape') close();
    }
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [open, close]);

  useEffect(() => {
    if (!open) {
      const [y, m, d] = selectedDate.split('-').map(Number);
      setViewDate(new Date(y, m - 1, d));
    }
  }, [selectedDate, open]);

  const selectDate = (dateStr) => {
    setSelectedDate(dateStr);
    setOpen(false);
  };

  const selectToday = () => {
    const today = new Date();
    setViewDate(new Date(today.getFullYear(), today.getMonth(), today.getDate()));
    selectDate(formatDateISO(today));
  };

  const selectYesterday = () => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    setViewDate(new Date(d.getFullYear(), d.getMonth(), d.getDate()));
    selectDate(formatDateISO(d));
  };

  const selectTomorrow = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    setViewDate(new Date(d.getFullYear(), d.getMonth(), d.getDate()));
    selectDate(formatDateISO(d));
  };

  const prevMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
  };

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const calendarDays = [];
  for (let i = 0; i < firstDay; i++) {
    calendarDays.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    calendarDays.push(d);
  }

  const todayStr = formatDateISO(new Date());
  const selectedDateObj = new Date(selectedDate + 'T00:00:00');
  const isDateSelected = (day) => {
    if (!day) return false;
    return formatDateISO(new Date(year, month, day)) === selectedDate;
  };
  const isDateToday = (day) => {
    if (!day) return false;
    return formatDateISO(new Date(year, month, day)) === todayStr;
  };

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-2 bg-surface-100 dark:bg-surface-800 hover:bg-surface-200 dark:hover:bg-surface-700 rounded-xl transition-colors duration-150 border border-surface-200 dark:border-surface-700"
      >
        <svg className="w-4 h-4 text-surface-400 dark:text-surface-500 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <span className="text-sm font-medium text-surface-700 dark:text-surface-200 hidden sm:inline">
          {headerDate}
        </span>
        <span className="text-sm font-medium text-surface-700 dark:text-surface-200 sm:hidden">
          {isToday ? 'Today' : new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </span>
        <svg className={`w-3.5 h-3.5 text-surface-400 dark:text-surface-500 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div
          ref={panelRef}
          className="absolute right-0 top-full mt-2 z-50 w-[320px] bg-white dark:bg-surface-800 rounded-2xl shadow-elevated border border-surface-200 dark:border-surface-700 overflow-hidden animate-scale-in"
          style={{ animationDuration: '150ms' }}
        >
          {/* Quick Options */}
          <div className="p-3 border-b border-surface-100 dark:border-surface-700">
            <div className="flex gap-1.5">
              {[
                { label: 'Today', action: selectToday, active: isToday },
                { label: 'Yesterday', action: selectYesterday },
                { label: 'Tomorrow', action: selectTomorrow },
              ].map((opt) => (
                <button
                  key={opt.label}
                  onClick={opt.action}
                  className={`flex-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 ${
                    opt.active
                      ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                      : 'bg-surface-100 dark:bg-surface-700 text-surface-600 dark:text-surface-300 hover:bg-surface-200 dark:hover:bg-surface-600'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Calendar Navigation */}
          <div className="flex items-center justify-between px-4 py-3">
            <button
              onClick={prevMonth}
              className="p-1.5 rounded-lg text-surface-400 dark:text-surface-500 hover:bg-surface-100 dark:hover:bg-surface-700 hover:text-surface-600 dark:hover:text-surface-300 transition-colors"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <span className="text-sm font-semibold text-surface-900 dark:text-surface-100">
              {MONTHS[month]} {year}
            </span>
            <button
              onClick={nextMonth}
              className="p-1.5 rounded-lg text-surface-400 dark:text-surface-500 hover:bg-surface-100 dark:hover:bg-surface-700 hover:text-surface-600 dark:hover:text-surface-300 transition-colors"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Day Headers */}
          <div className="grid grid-cols-7 px-4 gap-0">
            {DAYS.map((day) => (
              <div key={day} className="text-center text-[11px] font-medium text-surface-400 dark:text-surface-500 py-1">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 px-4 pb-2 gap-0">
            {calendarDays.map((day, idx) => {
              if (day === null) {
                return <div key={`empty-${idx}`} className="h-9" />;
              }
              const selected = isDateSelected(day);
              const today = isDateToday(day);

              return (
                <button
                  key={`day-${day}`}
                  onClick={() => selectDate(formatDateISO(new Date(year, month, day)))}
                  className={`h-9 w-full flex items-center justify-center rounded-lg text-sm font-medium transition-all duration-100 ${
                    selected
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/25'
                      : today
                        ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 font-semibold'
                        : 'text-surface-700 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-700'
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>

          {/* Footer */}
          <div className="p-3 border-t border-surface-100 dark:border-surface-700">
            <button
              onClick={selectToday}
              className="w-full py-2 rounded-xl text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors"
            >
              Go to Today
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
