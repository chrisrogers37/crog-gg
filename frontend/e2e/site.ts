import fs from "node:fs";
import path from "node:path";
import yaml from "js-yaml";
import type { BioData } from "../src/types/Bio";
import { readSiteConfig, siteDir } from "../scripts/site-config";

/**
 * The active site (SITE_DIR, else site/), which the dev and preview servers
 * serve (#191). The specs read it rather than naming the owner's sections and
 * projects, so they pass on any site and fail only on a broken one.
 */
export const site = readSiteConfig();

/** The home page's sections, in site.yaml's order. */
export const SECTIONS = site.sections;

/** The active site's bio.yaml, for what the page shows only when it's set. */
export const bio = yaml.load(
  fs.readFileSync(path.join(siteDir(), "public/content/bio.yaml"), "utf8"),
) as BioData;

/** The active site's project index, for the projects it lists and features. */
const projectIndex = yaml.load(
  fs.readFileSync(path.join(siteDir(), "public/content/projects/index.yaml"), "utf8"),
) as { projects: string[]; featured?: string };

/** Whether the site lists Claudlobby, whose page is its own (content/projectPages.ts). */
export const CLAUDLOBBY = projectIndex.projects.includes("claudlobby.yaml");

/** The featured project's id, if index.yaml features one. */
export const FEATURED = projectIndex.featured?.replace(/\.yaml$/, "");

/**
 * Whether the page can offer SUMMON, given that the specs' API answers that
 * it's served (fixtures.ts): only site.yaml's features.regenerate: off hides
 * it then (#189).
 */
export const SUMMON = site.features?.regenerate !== "off";

/** A section's or link's name, matched whole, whatever characters it has. */
export const named = (label: string) =>
  new RegExp(`^${label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i");
