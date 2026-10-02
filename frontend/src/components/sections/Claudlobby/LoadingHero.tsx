import type { ReactNode } from "react";
import { claudlobby } from "../../../content/claudlobby";
import { photoSrc, photoSrcSet } from "../../../utils/photos";
import { MARK_SIZES } from "./Hero";
import "./Claudlobby.css";

/**
 * Claudlobby's hero while the projects load, around the lines the project
 * page's skeleton stands in: the panel and the mark already, so a direct
 * visit doesn't flash from the site's light skeleton to the charcoal panel,
 * and the mark's download starts with the page, not after the projects.
 */
export function LoadingHero({ children }: { children: ReactNode }) {
  const { mark } = claudlobby;
  return (
    // .cl-page, as on the page itself: its colours, and not the breadcrumbs'
    // next sibling (ProjectDetailPage.css).
    <div className="cl-page">
      <div className="page-hero cl-hero cl-hero--loading" aria-hidden="true">
        <div className="cl-hero-body">{children}</div>
        <img
          className="cl-mark"
          alt=""
          width={220}
          height={220}
          loading="eager"
          sizes={MARK_SIZES}
          srcSet={photoSrcSet(mark.photo)}
          src={photoSrc(mark.photo)}
        />
      </div>
    </div>
  );
}
