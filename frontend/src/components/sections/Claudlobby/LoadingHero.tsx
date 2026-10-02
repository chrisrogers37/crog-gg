import type { ReactNode } from "react";
import { ClaudfatherMark } from "./Hero";
import "./Claudlobby.css";

/**
 * Claudlobby's hero while the projects load, around the lines the project
 * page's skeleton stands in: the panel and the mark already, so a direct
 * visit doesn't flash from the site's light skeleton to the charcoal panel,
 * and the mark's download starts with the page, not after the projects.
 */
export function LoadingHero({ children }: { children: ReactNode }) {
  return (
    // .cl-page, as on the page itself: its colours, and not the breadcrumbs'
    // next sibling (ProjectDetailPage.css).
    <div className="cl-page">
      <div className="page-hero cl-hero cl-hero--loading" aria-hidden="true">
        <div className="cl-hero-body">{children}</div>
        <ClaudfatherMark alt="" />
      </div>
    </div>
  );
}
