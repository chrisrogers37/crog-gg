import { Link } from "react-router-dom";
import { claudlobby } from "../../../content/claudlobby";
import { CLAUDLOBBY_REPO } from "../../../content/links";
import { InlineCode } from "./InlineCode";

function StarIcon() {
  return (
    <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
      <path
        fill="currentColor"
        d="M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97.719 4.192a.751.751 0 0 1-1.088.791L8 12.347l-3.766 1.98a.75.75 0 0 1-1.088-.79l.72-4.194L.818 6.374a.75.75 0 0 1 .416-1.28l4.21-.611L7.327.668A.75.75 0 0 1 8 .25Z"
      />
    </svg>
  );
}

/**
 * Who built it, what it is, how mature it is, and the two next steps, all
 * above the fold on a phone (#173, #179, #181 G2/G9).
 */
export function Hero() {
  const { hero, maturity } = claudlobby;
  return (
    <section className="cl-hero" aria-labelledby="cl-hero-heading">
      <p className="cl-eyebrow">{hero.eyebrow}</p>
      <h1 id="cl-hero-heading" className="cl-hero-headline">
        {hero.headline}
      </h1>
      <p className="cl-hero-sub">
        <InlineCode text={hero.sub} />
      </p>
      <p className="cl-hero-credibility">
        {hero.credibility} <Link to="/about">{hero.aboutLink}</Link>
      </p>
      <div className="cl-hero-ctas">
        <a
          className="btn btn-primary"
          href={CLAUDLOBBY_REPO}
          target="_blank"
          rel="noopener noreferrer"
        >
          <StarIcon />
          {hero.ctaStar}
        </a>
        <a className="btn btn-ghost" href="#quickstart">
          {hero.ctaQuickstart}
        </a>
      </div>
      <p className="cl-maturity cl-note">
        <span className="cl-badge">{maturity.label}</span> {maturity.today}{" "}
        {maturity.planned}{" "}
        <a href="#roadmap">{maturity.link}</a>
      </p>
    </section>
  );
}
