import { Link } from "react-router";
import { SEO } from "../../components/SEO";
import { NOT_FOUND_META } from "../../seo";

/**
 * The page for any URL the router doesn't match: the site's page layout
 * (styles/page.css), with a way home.
 */
export function NotFoundPage() {
  return (
    <div className="page not-found-page">
      <SEO {...NOT_FOUND_META} />
      <header className="page-hero">
        <p className="page-eyebrow">404</p>
        <h1 className="page-headline">page not found</h1>
        <p className="page-sub">the scroll you seek has been lost to the ages, adventurer.</p>
        <div className="page-ctas">
          <Link to="/" className="btn btn-primary">
            return to the realm
          </Link>
        </div>
      </header>
    </div>
  );
}
