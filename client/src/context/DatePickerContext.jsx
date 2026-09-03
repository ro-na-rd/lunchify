import { createContext, useContext, useState, useCallback } from 'react';

const DatePickerContext = createContext(null);

function formatDateISO(date) {
  return date.toISOString().split('T')[0];
}

function getToday() {
  return formatDateISO(new Date());
}

function getYesterday() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return formatDateISO(d);
}

function getTomorrow() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return formatDateISO(d);
}

function isToday(dateStr) {
  return dateStr === getToday();
}

function isYesterday(dateStr) {
  return dateStr === getYesterday();
}

function isTomorrow(dateStr) {
  return dateStr === getTomorrow();
}

function getRelativeLabel(dateStr) {
  if (isToday(dateStr)) return 'Today';
  if (isYesterday(dateStr)) return 'Yesterday';
  if (isTomorrow(dateStr)) return 'Tomorrow';
  return null;
}

function formatDisplayDate(dateStr) {
  const relative = getRelativeLabel(dateStr);
  if (relative) return relative;
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatHeaderDate(dateStr) {
  const relative = getRelativeLabel(dateStr);
  if (relative) return `Today · ${new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatHeroLabel(dateStr) {
  if (isToday(dateStr)) return 'Meals to Prepare Today';
  if (isYesterday(dateStr)) return 'Meals to Prepare · Yesterday';
  if (isTomorrow(dateStr)) return 'Meals to Prepare · Tomorrow';
  const date = new Date(dateStr + 'T00:00:00');
  return `Meals to Prepare · ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
}

export function DatePickerProvider({ children }) {
  const [selectedDate, setSelectedDate] = useState(getToday);

  const setToday = useCallback(() => {
    setSelectedDate(getToday());
  }, []);

  const goToToday = useCallback(() => {
    setSelectedDate(getToday());
  }, []);

  const value = {
    selectedDate,
    setSelectedDate,
    setToday,
    goToToday,
    isToday: isToday(selectedDate),
    isYesterday: isYesterday(selectedDate),
    isTomorrow: isTomorrow(selectedDate),
    displayDate: formatDisplayDate(selectedDate),
    headerDate: formatHeaderDate(selectedDate),
    heroLabel: formatHeroLabel(selectedDate),
    relativeLabel: getRelativeLabel(selectedDate),
    getToday,
    getYesterday,
    getTomorrow,
  };

  return (
    <DatePickerContext.Provider value={value}>
      {children}
    </DatePickerContext.Provider>
  );
}

export function useDatePicker() {
  const context = useContext(DatePickerContext);
  if (!context) {
    throw new Error('useDatePicker must be used within a DatePickerProvider');
  }
  return context;
}

export { formatDateISO, getToday, getYesterday, getTomorrow, isToday, isYesterday, isTomorrow, getRelativeLabel, formatDisplayDate, formatHeaderDate, formatHeroLabel };
