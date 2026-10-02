import type { ComponentType } from "react";
import { ClaudlobbyPage } from "../components/sections/Claudlobby";

/**
 * Projects with a page of their own, by id, shown at /projects/<id> in place
 * of the standard one (pages/Projects/ProjectDetailPage.tsx); the breadcrumbs
 * and the way back stay the site's. A site whose projects don't include the
 * id never shows the page.
 */
export const PROJECT_PAGES: Partial<Record<string, ComponentType>> = {
  claudlobby: ClaudlobbyPage,
};
