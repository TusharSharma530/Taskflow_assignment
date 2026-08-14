import { RefreshIcon } from './icons';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({
  title = 'Something went wrong',
  message = "We couldn't load your tasks. Please try again.",
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="error-state" role="alert">
      <div className="error-state-icon" aria-hidden="true">
        !
      </div>
      <h3 className="error-state-title">{title}</h3>
      <p className="error-state-message">{message}</p>
      {onRetry ? (
        <button type="button" className="button button-secondary" onClick={onRetry}>
          <RefreshIcon width={16} height={16} />
          Try again
        </button>
      ) : null}
    </div>
  );
}