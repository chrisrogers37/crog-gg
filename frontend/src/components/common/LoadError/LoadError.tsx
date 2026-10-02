// ErrorBoundary's panel and button, so the site keeps one filled button style.
// ErrorBoundary's own compact fallback is this component.
import "../ErrorBoundary/ErrorBoundary.css";

type LoadErrorProps = {
  message: string;
  onRetry: () => void;
  /** The smaller panel a failed section shows inside a page. */
  compact?: boolean;
};

/** Content that failed to load says so, with a way to try again. */
export function LoadError({ message, onRetry, compact = false }: LoadErrorProps) {
  return (
    <div
      className={compact ? "error-boundary error-boundary--compact" : "error-boundary"}
      role="alert"
    >
      <p className="error-boundary__message">{message}</p>
      <button className="error-boundary__retry-btn" onClick={onRetry}>
        Retry
      </button>
    </div>
  );
}
