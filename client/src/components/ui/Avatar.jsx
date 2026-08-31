const sizeClasses = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
};

const colorPalette = [
  'bg-brand-600',
  'bg-success-600',
  'bg-warning-500',
  'bg-danger-600',
  'bg-orange-500',
];

function getInitials(name) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0]?.toUpperCase() || '?';
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

function getColor(name) {
  if (!name) return colorPalette[0];
  const code = name.charCodeAt(0);
  return colorPalette[code % colorPalette.length];
}

export default function Avatar({
  name = '',
  size = 'md',
  className = '',
}) {
  return (
    <div
      className={`
        rounded-full flex items-center justify-center font-medium text-white
        ${sizeClasses[size] || sizeClasses.md}
        ${getColor(name)}
        ${className}
      `}
      title={name}
      aria-label={name}
    >
      {getInitials(name)}
    </div>
  );
}
