import { claudfather } from "../../content/claudfather";
import type { ProjectBrand } from "../../content/projectPresentation";
import { benzo } from "../../styles/palette";
import { photoSrc, photoSrcSet } from "../../utils/photos";
import "./ProjectMark.css";

/** The same capsule on the Benzo page and both project lists. */
export function PillMark({ className = "project-symbol" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 240 170" aria-hidden="true" focusable="false">
      <g transform="rotate(-28 120 85)">
        <rect x="25" y="38" width="190" height="94" rx="47" fill={benzo.pillLight} stroke={benzo.rose} strokeWidth="1.5" />
        <path d="M120 38h48a47 47 0 0 1 0 94h-48Z" fill={benzo.pink} />
        <path d="M120 39v92" stroke={benzo.rose} strokeWidth="1.5" />
        <path d="M48 75a27 27 0 0 1 27-18h22" fill="none" stroke={benzo.paper} strokeWidth="5" strokeLinecap="round" />
      </g>
    </svg>
  );
}

export function ClaudfatherMark({ alt, className = "cl-mark" }: { alt: string; className?: string }) {
  const { photo } = claudfather.mark;
  return <img className={className} alt={alt} width={220} height={220} sizes="(max-width: 640px) 64px, 220px" srcSet={photoSrcSet(photo)} src={photoSrc(photo)} />;
}

/** Marks are decorative: the adjacent project title supplies their name. */
export function ProjectMark({ brand, icon, title }: { brand?: ProjectBrand; icon?: string; title: string }) {
  let mark;
  switch (brand) {
    case "claudfather": mark = <ClaudfatherMark alt="" className="project-symbol" />; break;
    case "benzo": mark = <PillMark />; break;
    case "storydump": mark = (
      <svg className="project-symbol" viewBox="0 0 100 100" focusable="false">
        <circle cx="50" cy="50" r="32" fill="none" stroke="var(--project-accent)" strokeWidth="10" />
        <circle cx="50" cy="50" r="10" fill="var(--project-ink)" />
      </svg>
    ); break;
    case "shuffify": mark = (
      <svg className="project-symbol" viewBox="0 0 100 100" fill="none" stroke="var(--project-accent)" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" focusable="false">
        <path d="M20 28h15l30 44h15M20 72h15l13-19M56 42l9-14h15M71 19l9 9-9 9M71 63l9 9-9 9" />
      </svg>
    ); break;
    case "dead-redux": mark = (
      <svg className="project-symbol" viewBox="0 0 100 100" fill="none" stroke="var(--project-accent)" focusable="false">
        <circle cx="50" cy="50" r="36" strokeWidth="2" /><circle cx="50" cy="50" r="28" opacity=".65" /><circle cx="50" cy="50" r="20" opacity=".65" />
        <circle cx="50" cy="50" r="11" fill="var(--project-accent)" /><circle cx="50" cy="50" r="3" fill="var(--project-surface)" stroke="none" />
      </svg>
    ); break;
    default: mark = <span className="project-initial">{icon ?? title.slice(0, 1)}</span>;
  }
  return <span className="project-mark" aria-hidden="true">{mark}</span>;
}
