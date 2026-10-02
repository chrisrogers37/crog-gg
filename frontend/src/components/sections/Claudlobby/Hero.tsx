import { claudlobby } from "../../../content/claudlobby";
import { track } from "../../../services/analytics";
import { RepoLink } from "../../common/RepoLink";
import { InlineCode } from "../../common/InlineCode";

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
 * What it is, how mature it is, and the two next steps, all above the fold on
 * a phone (#173, #179, #181 G2/G9). Only Claudlobby's: who built it is the
 * site around it.
 */
export function Hero() {
  const { hero, maturity } = claudlobby;
  return (
    <section className="page-hero" aria-labelledby="cl-hero-heading">
      <p className="page-eyebrow">{hero.eyebrow}</p>
      <h1 id="cl-hero-heading" className="page-headline">
        {hero.headline}
      </h1>
      <p className="page-sub">
        <InlineCode text={hero.sub} />
      </p>
      <div className="page-ctas">
        <RepoLink location="hero" className="btn btn-primary">
          <StarIcon />
          {hero.ctaStar}
        </RepoLink>
        <a
          className="btn btn-ghost"
          href="#quickstart"
          onClick={() => track({ name: "quickstart_click" })}
        >
          {hero.ctaQuickstart}
        </a>
      </div>
      <p className="cl-maturity page-note">
        <span className="badge">{maturity.label}</span> {maturity.today}{" "}
        {maturity.planned}{" "}
        <a href="#roadmap">{maturity.link}</a>
        {" · "}
        <a href="#updates">{maturity.updatesLink}</a>
      </p>
    </section>
  );
}
