const variants = {
  success: {
    base: 'bg-success-50 text-success-700 border-success-200',
    dot: 'bg-success-500',
  },
  danger: {
    base: 'bg-danger-50 text-danger-700 border-danger-200',
    dot: 'bg-danger-500',
  },
  warning: {
    base: 'bg-warning-50 text-warning-700 border-warning-200',
    dot: 'bg-warning-500',
  },
  info: {
    base: 'bg-brand-50 text-brand-700 border-brand-200',
    dot: 'bg-brand-500',
  },
  neutral: {
    base: 'bg-surface-100 text-surface-600 border-surface-200',
    dot: 'bg-surface-400',
  },
  brand: {
    base: 'bg-brand-600 text-white border-brand-600',
    dot: 'bg-white',
  },
};

const sizeClasses = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-xs',
};

export default function Badge({
  variant = 'neutral',
  size = 'sm',
  dot = false,
  children,
  className = '',
}) {
  const v = variants[variant] || variants.neutral;

  return (
    <span
      className={`
        inline-flex items-center rounded-full border font-medium
        ${v.base}
        ${sizeClasses[size] || sizeClasses.sm}
        ${className}
      `}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${v.dot}`} />}
      {children}
    </span>
  );
}
