import Card from './Card';
import Skeleton from './Skeleton';

const colorMap = {
  brand: 'bg-brand-100 text-brand-600',
  success: 'bg-success-100 text-success-600',
  danger: 'bg-danger-100 text-danger-600',
  warning: 'bg-warning-100 text-warning-600',
  orange: 'bg-orange-100 text-orange-600',
};

const trendColors = {
  up: 'text-success-600',
  down: 'text-danger-600',
  neutral: 'text-surface-500',
};

const trendArrows = {
  up: '\u2191',
  down: '\u2193',
  neutral: '\u2192',
};

export default function StatCard({
  title,
  value,
  icon,
  trend,
  trendDirection = 'neutral',
  color = 'brand',
  loading = false,
  className = '',
}) {
  if (loading) {
    return (
      <Card className={className}>
        <div className="flex items-center gap-4">
          <Skeleton variant="rectangular" width={48} height={48} className="rounded-xl" />
          <div className="flex-1 space-y-2">
            <Skeleton variant="text" width="60%" />
            <Skeleton variant="text" width="40%" />
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <div className="flex items-center gap-4">
        {icon && (
          <div className={`rounded-xl p-3 ${colorMap[color] || colorMap.brand}`}>
            {icon}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm text-surface-500 truncate">{title}</p>
          <p className="text-2xl font-bold text-surface-900 mt-0.5">{value}</p>
        </div>
        {trend && (
          <span className={`text-sm font-medium shrink-0 ${trendColors[trendDirection]}`}>
            <span className="mr-0.5">{trendArrows[trendDirection]}</span>
            {trend}
          </span>
        )}
      </div>
    </Card>
  );
}
