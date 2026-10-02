import { Link } from "react-router";
import { SEO } from "../../components/SEO";
import { NOT_FOUND_META } from "../../seo";
import "./NotFoundPage.css";

/**
 * NotFoundPage Component
 *
 * Displays a 404 error page with a link back to the home page.
 * Uses fantasy theming consistent with the rest of the application.
 */
export function NotFoundPage() {
  return (
    <div className="not-found-page">
      <SEO {...NOT_FOUND_META} />
      <div className="not-found-content">
        <h1 className="not-found-title">404</h1>
        <h2 className="not-found-subtitle">Page Not Found</h2>
        <p className="not-found-description">
          The scroll you seek has been lost to the ages, adventurer.
        </p>
        <Link to="/" className="not-found-link">
          Return to the Realm
        </Link>
      </div>
    </div>
  );
}
