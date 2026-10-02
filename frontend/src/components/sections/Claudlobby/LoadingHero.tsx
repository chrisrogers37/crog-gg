import "./Claudlobby.css";

/**
 * Claudlobby's hero while the projects load: its panel already, with blank
 * lines, so a direct visit doesn't flash from the site's light skeleton to
 * the charcoal panel (ProjectDetailPage's skeleton shows it).
 */
export function LoadingHero() {
  return (
    <div className="cl-page">
      <div className="page-hero cl-hero cl-hero--loading" aria-hidden="true">
        <div className="cl-hero-body">
          <div className="page-skeleton page-skeleton--eyebrow" />
          <div className="page-skeleton page-skeleton--headline" />
          <div className="page-skeleton" />
          <div className="page-skeleton page-skeleton--short" />
        </div>
      </div>
    </div>
  );
}
