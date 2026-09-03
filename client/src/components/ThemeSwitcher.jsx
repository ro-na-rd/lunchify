import { useTheme } from '../context/ThemeContext';

export default function ThemeSwitcher({ collapsed = false }) {
  const { theme, setTheme } = useTheme();

  const options = [
    { value: 'light', icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="5" />
        <line x1="12" y1="1" x2="12" y2="3" />
        <line x1="12" y1="21" x2="12" y2="23" />
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
        <line x1="1" y1="12" x2="3" y2="12" />
        <line x1="21" y1="12" x2="23" y2="12" />
        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
      </svg>
    ), label: 'Light' },
    { value: 'dark', icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
      </svg>
    ), label: 'Dark' },
    { value: 'system', icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
        <line x1="8" y1="21" x2="16" y2="21" />
        <line x1="12" y1="17" x2="12" y2="21" />
      </svg>
    ), label: 'System' },
  ];

  return (
    <div className="flex items-center bg-surface-100 dark:bg-surface-800 rounded-xl p-1 gap-0.5">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => setTheme(opt.value)}
          title={opt.label}
          className={`flex items-center justify-center rounded-lg transition-all duration-200 ${
            collapsed ? 'w-8 h-8' : 'px-2.5 h-8 gap-1.5'
          } ${
            theme === opt.value
              ? 'bg-white dark:bg-surface-700 text-surface-900 dark:text-surface-100 shadow-sm'
              : 'text-surface-400 dark:text-surface-500 hover:text-surface-600 dark:hover:text-surface-300'
          }`}
          aria-label={`${opt.label} mode`}
        >
          {opt.icon}
          {!collapsed && <span className="text-xs font-medium">{opt.label}</span>}
        </button>
      ))}
    </div>
  );
}
