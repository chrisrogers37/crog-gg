// ErrorBoundary's panel and button, so the site keeps one filled button style.
import "../ErrorBoundary/ErrorBoundary.css";

type LoadErrorProps = {
  message: string;
  onRetry: () => void;
};

/** Content that failed to load says so, with a way to try again. */
export function LoadError({ message, onRetry }: LoadErrorProps) {
  return (
    <div className="error-boundary" role="alert">
      <p className="error-boundary__message">{message}</p>
      <button className="error-boundary__retry-btn" onClick={onRetry}>
        Retry
      </button>
    </div>
  );
}
