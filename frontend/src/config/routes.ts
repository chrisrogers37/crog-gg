import type { SiteConfig } from "./schema";

/** Where the personal page lives: /about beside the landing page, else / (#188). */
export const aboutPath = (site: Pick<SiteConfig, "home">) =>
  site.home === "landing" ? "/about" : "/";
