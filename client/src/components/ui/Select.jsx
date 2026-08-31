import { forwardRef } from 'react';

const ChevronIcon = () => (
  <svg
    className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400 pointer-events-none"
    viewBox="0 0 20 20"
    fill="currentColor"
  >
    <path
      fillRule="evenodd"
      d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
      clipRule="evenodd"
    />
  </svg>
);

const Select = forwardRef(
  (
    {
      label,
      error,
      placeholder,
      options = [],
      className = '',
      disabled = false,
      id,
      children,
      ...props
    },
    ref
  ) => {
    const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="space-y-1.5">
        {label && (
          <label
            htmlFor={selectId}
            className="block text-sm font-medium text-surface-700"
          >
            {label}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            disabled={disabled}
            className={`
              w-full rounded-xl border px-4 py-2.5 text-sm bg-white appearance-none pr-10
              transition-colors
              focus:outline-none
              ${
                error
                  ? 'border-danger-300 focus:border-danger-500 focus:ring-2 focus:ring-danger-500/10'
                  : 'border-surface-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10'
              }
              ${disabled ? 'opacity-50 cursor-not-allowed bg-surface-50' : ''}
              ${className}
            `}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
            {children}
          </select>
          <ChevronIcon />
        </div>
        {error && <p className="text-sm text-danger-600">{error}</p>}
      </div>
    );
  }
);

Select.displayName = 'Select';

export default Select;
