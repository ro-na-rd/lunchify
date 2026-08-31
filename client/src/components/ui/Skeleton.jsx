const variantClasses = {
  text: 'h-4 rounded',
  circular: 'rounded-full',
  rectangular: 'rounded-xl',
  card: 'h-48 rounded-2xl',
};

export default function Skeleton({
  className = '',
  variant = 'text',
  width,
  height,
  count = 1,
}) {
  const base = `bg-gradient-to-r from-surface-200 via-surface-100 to-surface-200 bg-[length:200%_100%] animate-shimmer ${variantClasses[variant] || variantClasses.text}`;

  const style = {
    ...(width ? { width } : {}),
    ...(height ? { height } : {}),
  };

  if (count > 1) {
    return (
      <div className="space-y-2" style={style}>
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className={`${base} ${className}`}
            style={i === count - 1 ? { width: '70%' } : undefined}
          />
        ))}
      </div>
    );
  }

  return <div className={`${base} ${className}`} style={style} />;
}
