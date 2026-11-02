import { claudfather } from "../../../content/claudfather";
import type { Project } from "../../../types";
import { WebsiteLink } from "./WebsiteLink";
import { ClaudfatherMark } from "../../common/ProjectMark";
export { ClaudfatherMark } from "../../common/ProjectMark";

export function Hero({ project }: { project: Project }) {
  const { hero, mark, website, organization } = claudfather;
  return (
    <section className="page-hero cl-hero" aria-labelledby="cl-hero-heading">
      <p className="page-eyebrow">
        {project.featured
          ? `${project.title} · Featured project`
          : project.title}
      </p>
      <div className="cl-hero-body">
        <h1 id="cl-hero-heading" className="page-headline">
          {hero.headline}
        </h1>
        <p className="page-sub">{hero.sub}</p>
        <p className="cl-maturity">
          <span className="badge">{hero.status}</span>
        </p>
        <div className="page-ctas">
          <a className="btn btn-primary" href="#how-it-works">
            {hero.cta}
          </a>
          <WebsiteLink website={website} />
        </div>
        <a
          className="cf-source-link"
          href={organization}
          target="_blank"
          rel="noopener noreferrer"
        >
          View source organization <span aria-hidden="true">↗</span>
        </a>
      </div>
      <ClaudfatherMark alt={mark.alt} />
    </section>
  );
}
