import { Link, useRouteError } from "react-router";
import "../../components/common/ErrorBoundary/ErrorBoundary.css";

/**
 * Every route's errorElement (#196 M40), so a page that fails to render shows
 * an error, not NotFoundPage, which would mark a real URL noindex and drop its
 * canonical. Unmatched URLs never get here: the "*" route renders NotFoundPage.
 * A lazy page whose chunk a deploy replaced gets one reload first (lazyPage).
 */
export function RouteError() {
  const error = useRouteError();
  return (
    <div className="page">
      <div className="error-boundary" role="alert">
        <div className="error-boundary__icon">!</div>
        <h2 className="error-boundary__title">something went wrong</h2>
        <p className="error-boundary__message">
          this page failed to load. reloading usually fixes it, or you can go{" "}
          <Link to="/">home</Link>.
        </p>
        <div className="error-boundary__actions">
          <button
            className="btn btn-primary"
            onClick={() => window.location.reload()}
          >
            reload page
          </button>
        </div>
        {import.meta.env.DEV && error instanceof Error && (
          <details className="error-boundary__details">
            <summary>error details</summary>
            <pre>{error.message}</pre>
            <pre>{error.stack}</pre>
          </details>
        )}
      </div>
    </div>
  );
}
