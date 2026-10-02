import fs from "node:fs";
import path from "node:path";
import { expect, type APIRequestContext, type Page } from "@playwright/test";
import yaml from "js-yaml";
import { projectIndexShape, projectShape } from "../src/config/contentSchema";
import { claudlobby } from "../src/content/claudlobby";
import type { BioData } from "../src/types/Bio";
import { parseYaml } from "../src/utils/contentFile";
import { readProjects } from "../src/utils/projectLoader";
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

/** A file in the active site's content/projects/, checked as the app checks it. */
const projectsFile = (file: string) =>
  fs.readFileSync(path.join(siteDir(), "public/content/projects", file), "utf8");
const projectIndex = parseYaml(projectIndexShape, projectsFile("index.yaml"), "index.yaml");
const projectId = (file: string) => parseYaml(projectShape, projectsFile(file), file).id;

/** Whether the site lists Claudlobby, whose page is its own (content/ownPages.ts). */
export const CLAUDLOBBY = projectIndex.projects.map(projectId).includes("claudlobby");

/** The card a page's link preview shows: Claudlobby's page has its own. */
export const cardOf = (path: string) =>
  path === "/projects/claudlobby" ? claudlobby.brand.card : site.seo.image;

/** The featured project's id, if index.yaml features one. */
export const FEATURED = projectIndex.featured && projectId(projectIndex.featured);

/** The projects as the running site serves them, through the app's own loader. */
export const servedProjects = (request: APIRequestContext) =>
  readProjects(async (file) => (await request.get(`/content/projects/${file}`)).text());

/** That `selector`'s top edge is below the sticky header, not under it. */
export async function expectBelowHeader(page: Page, selector: string) {
  const target = page.locator(selector);
  await expect(target).toBeInViewport();
  const header = (await page.locator("header.compact-header").boundingBox())!;
  expect((await target.boundingBox())!.y).toBeGreaterThanOrEqual(header.y + header.height);
}

/**
 * Whether the page can offer SUMMON, given that the specs' API answers that
 * it's served (fixtures.ts): only site.yaml's features.regenerate: off hides
 * it then (#189).
 */
export const SUMMON = site.features?.regenerate !== "off";

/** A section's or link's name, matched whole, whatever characters it has. */
export const named = (label: string) =>
  new RegExp(`^${label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i");
