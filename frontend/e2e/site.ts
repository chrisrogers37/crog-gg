import fs from "node:fs";
import path from "node:path";
import type { Page } from "@playwright/test";
import yaml from "js-yaml";
import { aboutPath } from "../src/config/routes";
import type { BioData } from "../src/types/Bio";
import { readSiteConfig, siteDir } from "../scripts/site-config";

/**
 * The active site (SITE_DIR, else site/), which the dev and preview servers
 * serve (#191). The specs read it rather than naming the owner's tabs and
 * routes, so they pass on any site and fail only on a broken one.
 */
export const site = readSiteConfig();

/** /about's tabs, in site.yaml's order. */
export const SECTIONS = site.sections;

/** The About tab, selected on load wherever it sits (site.yaml must list it). */
export const ABOUT = SECTIONS.find(({ id }) => id === "about")!;

/** The other tabs, in order: none is selected on load. */
export const OTHER_TABS = SECTIONS.filter(({ id }) => id !== "about");

/** The tab the section navigator offers after this one ("up next"), if any. */
export const tabAfter = (tab: (typeof SECTIONS)[number]) =>
  SECTIONS[SECTIONS.indexOf(tab) + 1];

/** The active site's bio.yaml, for what the page shows only when it's set. */
export const bio = yaml.load(
  fs.readFileSync(path.join(siteDir(), "public/content/bio.yaml"), "utf8"),
) as BioData;

/** Where the tabs live: /about beside the landing page, else /. */
export const TABS_PATH = aboutPath(site);

/** Whether / is the Claudlobby landing page. */
export const LANDING = site.home === "landing";

/**
 * Whether the page can offer SUMMON, given that the specs' API answers that
 * it's served (fixtures.ts): only site.yaml's features.regenerate: off hides
 * it then (#189).
 */
export const SUMMON = site.features?.regenerate !== "off";

/** A tab's or panel's name, matched whole, whatever characters it has. */
export const named = (label: string) =>
  new RegExp(`^${label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i");

/** Paragraphs enough to overflow the About preview at any width the specs use. */
const FILLER = Array.from(
  { length: 8 },
  (_, index) =>
    `filler paragraph ${index + 1}, long enough to wrap across the column at every width the specs use, so the preview has text to fade out and "see more" has text to open.`,
).join("\n\n");

/**
 * Gives the About text enough paragraphs to overflow its preview, whatever the
 * site's bio says, so a spec that opens, collapses or measures the preview
 * doesn't depend on how long a site's About copy is: a one-paragraph bio is an
 * ordinary edit (#191). Call it before the page loads.
 */
export async function withLongAbout(page: Page) {
  await page.route("**/content/bio.yaml", async (route) => {
    const response = await route.fetch();
    const bio = yaml.load(await response.text()) as Record<string, unknown>;
    bio.about_text = `${String(bio.about_text ?? "").trim()}\n\n${FILLER}`;
    await route.fulfill({ response, body: yaml.dump(bio) });
  });
}
