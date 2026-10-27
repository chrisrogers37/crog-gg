import type { CSSProperties } from "react";
import { benzo, claudfather, deadRedux, shuffify, storydump } from "../styles/palette";

/** Shared by project cards and marks. Copy and destinations stay in project YAML. */
export const projectBrands = {
  claudfather: { surface: claudfather.charcoal, ink: claudfather.cream, accent: claudfather.orange, link: claudfather.orangeDeep, darkLink: claudfather.orange },
  storydump: { surface: storydump.paper, ink: storydump.ink, accent: storydump.orange, link: storydump.orangeDeep, darkLink: storydump.orange },
  shuffify: { surface: shuffify.base, ink: shuffify.ink, accent: shuffify.lime, link: shuffify.greenDeep, darkLink: shuffify.lime },
  benzo: { surface: benzo.paper, ink: benzo.ink, accent: benzo.rose, link: benzo.rose, darkLink: benzo.pillLight },
  "dead-redux": { surface: deadRedux.page, ink: deadRedux.ink, accent: deadRedux.amber, link: deadRedux.amberDeep, darkLink: deadRedux.amber },
} as const;

export type ProjectBrand = keyof typeof projectBrands;
export const PROJECT_BRAND_IDS = Object.keys(projectBrands) as ProjectBrand[];

export const projectLabels = { view: "view project", featured: "featured project", builtWith: "built with" } as const;

export function projectBrandStyle(brand?: ProjectBrand): CSSProperties | undefined {
  if (!brand) return undefined;
  const colors = projectBrands[brand];
  return {
    "--project-surface": colors.surface,
    "--project-ink": colors.ink,
    "--project-accent": colors.accent,
    "--project-link": colors.link,
    "--project-dark-link": colors.darkLink,
  } as CSSProperties;
}
