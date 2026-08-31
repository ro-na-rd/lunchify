import { forwardRef } from 'react';

const Input = forwardRef(
  (
    {
      label,
      error,
      icon,
      className = '',
      disabled = false,
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="space-y-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-surface-700"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none">
              {icon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            disabled={disabled}
            className={`
              w-full rounded-xl border px-4 py-2.5 text-sm bg-white
              transition-colors placeholder:text-surface-400
              focus:outline-none
              ${icon ? 'pl-11' : ''}
              ${
                error
                  ? 'border-danger-300 focus:border-danger-500 focus:ring-2 focus:ring-danger-500/10'
                  : 'border-surface-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10'
              }
              ${disabled ? 'opacity-50 cursor-not-allowed bg-surface-50' : ''}
              ${className}
            `}
            {...props}
          />
        </div>
        {error && <p className="text-sm text-danger-600">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
