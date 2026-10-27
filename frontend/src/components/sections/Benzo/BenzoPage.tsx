import type { ReactNode } from "react";
import type { Project } from "../../../types";
import { benzo } from "../../../content/benzo";
import { githubRepo } from "../../../utils/projectLinks";
import "./Benzo.css";

const EXTERNAL = { target: "_blank", rel: "noopener noreferrer" } as const;

function PillMark() {
  return (
    <svg className="benzo-mark" viewBox="0 0 240 170" aria-hidden="true">
      <g transform="rotate(-28 120 85)">
        <rect className="benzo-mark-shell" x="25" y="38" width="190" height="94" rx="47" />
        <path className="benzo-mark-half" d="M120 38h48a47 47 0 0 1 0 94h-48Z" />
        <path className="benzo-mark-seam" d="M120 39v92" />
        <path className="benzo-mark-shine" d="M48 75a27 27 0 0 1 27-18h22" />
      </g>
    </svg>
  );
}

export function BenzoLoadingHero({ children }: { children: ReactNode }) {
  return (
    <div className="benzo-page">
      <div className="page-hero benzo-hero" aria-hidden="true">
        <div>{children}</div>
        <PillMark />
      </div>
    </div>
  );
}

export function BenzoPage({ project }: { project: Project }) {
  const repo = githubRepo(project);
  const source = repo ? `https://github.com/${repo.owner}/${repo.name}` : undefined;
  const website = project.url !== "#" ? project.url : undefined;
  const install = website ? new URL("#before-install", website).href : undefined;

  return (
    <div className="benzo-page">
      <header className="page-hero benzo-hero">
        <div className="benzo-hero-copy">
          <p className="page-eyebrow">{benzo.eyebrow}</p>
          <h1 className="page-headline">{project.title}<span className="benzo-period">.</span></h1>
          <p className="benzo-headline">{benzo.headline}</p>
          <p className="benzo-lead">{benzo.lead}</p>
          <div className="page-ctas">
            {website && <a className="btn btn-primary" href={website} {...EXTERNAL}>{benzo.websiteLabel}<span aria-hidden="true">↗</span></a>}
            {source && <a className="btn btn-ghost" href={`${source}/releases`} {...EXTERNAL}>{benzo.downloadLabel}</a>}
          </div>
          {source && <p className="benzo-download-note">{benzo.downloadNote}</p>}
        </div>
        <div className="benzo-identity">
          <PillMark />
          <p>{benzo.markCaption}</p>
        </div>
      </header>

      <section className="benzo-story" aria-labelledby="benzo-story-title">
        <h2 id="benzo-story-title">{benzo.story.heading}</h2>
        <div><p>{benzo.story.body}</p><p>{benzo.story.context}</p></div>
      </section>

      <div className="benzo-features">
        {benzo.features.map((feature) => (
          <section key={feature.title}>
            <h2>{feature.title}</h2>
            <p>{feature.body}</p>
          </section>
        ))}
      </div>

      <section className="benzo-handoff" aria-labelledby="benzo-handoff-title">
        <div>
          <h2 id="benzo-handoff-title">{benzo.handoff.heading}</h2>
          <p>{benzo.handoff.body}</p>
          {website && <a className="benzo-text-link" href={website} {...EXTERNAL}>{benzo.handoff.label}<span aria-hidden="true"> ↗</span></a>}
        </div>
        <div className="benzo-install-note">
          <p>{benzo.handoff.note}</p>
          {install && <a className="benzo-text-link" href={install} {...EXTERNAL}>{benzo.handoff.setupLabel}<span aria-hidden="true"> ↗</span></a>}
        </div>
      </section>

      <footer className="benzo-details">
        {project.technologies.length > 0 && <p>{benzo.stackLabel} {project.technologies.join(" · ")}</p>}
        {source && <nav aria-label="Benzo project links"><a href={source} {...EXTERNAL}>{benzo.sourceLabel}</a><a href={`${source}/issues`} {...EXTERNAL}>{benzo.helpLabel}</a></nav>}
      </footer>
    </div>
  );
}
