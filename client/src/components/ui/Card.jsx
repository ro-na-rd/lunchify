const paddings = {
  none: 'p-0',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};

export default function Card({
  className = '',
  hover = false,
  padding = 'md',
  children,
  ...props
}) {
  return (
    <div
      className={`
        bg-white rounded-2xl shadow-card border border-surface-100/50
        ${hover ? 'hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-200' : ''}
        ${paddings[padding] || paddings.md}
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
}
