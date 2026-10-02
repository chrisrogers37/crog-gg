import site from "virtual:site-config";
import { createSeo } from "./site";

/** The app's head builders and page metadata, from site/site.yaml (#188). */
export const seo = createSeo(site);

export const {
  SITE_URL,
  OG_IMAGE,
  absoluteUrl,
  pageTitle,
  headTags,
  HOME_META,
  ABOUT_META,
  PROJECTS_META,
  NOT_FOUND_META,
  projectMeta,
} = seo;

export { jsonLd, projectBreadcrumbs } from "./site";
export type { LandingPage, PageMeta, ProjectSummary } from "./site";
