import { Component, type ReactNode, type ErrorInfo } from "react";
import "./ErrorBoundary.css";
import { LoadError } from "../LoadError/LoadError";

type ErrorBoundaryProps = {
  children: ReactNode;
  /** Custom fallback UI. Receives error and reset function. */
  fallback?: (error: Error, reset: () => void) => ReactNode;
  /** Compact mode for inline/section-level use */
  compact?: boolean;
  /** Called when an error is caught */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
};

type ErrorBoundaryState = {
  error: Error | null;
};

/**
 * ErrorBoundary
 *
 * Catches render errors in child components and displays a fallback UI
 * instead of crashing the entire app to a white screen.
 *
 * Supports two modes:
 * - Full (default): page-level boundary with prominent error display
 * - Compact: section-level boundary with minimal inline error display
 */
export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  private handleReset = (): void => {
    this.setState({ error: null });
  };

  render(): ReactNode {
    const { error } = this.state;
    const { children, fallback, compact } = this.props;

    if (error) {
      if (fallback) {
        return fallback(error, this.handleReset);
      }

      if (compact) {
        return (
          <LoadError
            compact
            message="Something went wrong loading this section."
            onRetry={this.handleReset}
          />
        );
      }

      return (
        <div className="error-boundary" role="alert">
          <div className="error-boundary__icon">!</div>
          <h2 className="error-boundary__title">Something went wrong</h2>
          <p className="error-boundary__message">
            An unexpected error occurred. You can try again, and if the problem
            persists, try refreshing the page.
          </p>
          <div className="error-boundary__actions">
            <button
              className="error-boundary__retry-btn"
              onClick={this.handleReset}
            >
              Try again
            </button>
            <button
              className="error-boundary__reload-btn"
              onClick={() => window.location.reload()}
            >
              Reload page
            </button>
          </div>
          {import.meta.env.DEV && (
            <details className="error-boundary__details">
              <summary>Error details</summary>
              <pre>{error.message}</pre>
              <pre>{error.stack}</pre>
            </details>
          )}
        </div>
      );
    }

    return children;
  }
}
