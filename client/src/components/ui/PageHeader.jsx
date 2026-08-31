import { Link } from 'react-router-dom';

const BackIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
  </svg>
);

export default function PageHeader({
  title,
  subtitle,
  action,
  backTo,
  className = '',
}) {
  return (
    <div className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8 ${className}`}>
      <div>
        {backTo && (
          <Link
            to={backTo}
            className="inline-flex items-center gap-1.5 text-sm text-surface-500 hover:text-surface-700 transition-colors mb-2"
          >
            <BackIcon />
            Back
          </Link>
        )}
        <h1 className="text-2xl font-bold text-surface-900">{title}</h1>
        {subtitle && (
          <p className="text-surface-500 mt-1">{subtitle}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
