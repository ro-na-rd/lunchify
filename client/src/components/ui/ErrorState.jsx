import Button from './Button';

const ErrorIcon = () => (
  <svg className="w-8 h-8 text-danger-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
  </svg>
);

export default function ErrorState({
  title = 'Something went wrong',
  message = 'An unexpected error occurred. Please try again.',
  onRetry,
  className = '',
}) {
  return (
    <div className={`flex flex-col items-center justify-center text-center py-12 ${className}`}>
      <div className="w-16 h-16 rounded-2xl bg-danger-50 flex items-center justify-center mb-4">
        <ErrorIcon />
      </div>
      <h3 className="text-lg font-semibold text-surface-900">{title}</h3>
      <p className="text-surface-500 mt-1 max-w-sm mx-auto">{message}</p>
      {onRetry && (
        <div className="mt-6">
          <Button variant="primary" onClick={onRetry}>
            Try again
          </Button>
        </div>
      )}
    </div>
  );
}
