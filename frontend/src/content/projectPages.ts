import type { ComponentType } from "react";
import { ClaudlobbyLoadingHero, ClaudlobbyPage } from "../components/sections/Claudlobby";
import type { Project } from "../types";
import type { OwnPageId } from "./ownPages";

/**
 * Each project with a page of its own, shown at /projects/<id> in place of
 * the standard one (pages/Projects/ProjectDetailPage.tsx); the breadcrumbs and
 * the way back stay the site's. A site whose projects don't include the id
 * never shows the page. Every id in ownPages.ts needs one here.
 */
export const PROJECT_PAGES: Record<OwnPageId, ComponentType<{ project: Project }>> = {
  claudlobby: ClaudlobbyPage,
};

/** What each shows in its hero's place while the projects load, in its own look. */
export const PROJECT_PAGE_LOADING: Record<OwnPageId, ComponentType> = {
  claudlobby: ClaudlobbyLoadingHero,
};
