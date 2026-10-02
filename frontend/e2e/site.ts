import type { Page } from "@playwright/test";
import yaml from "js-yaml";
import { aboutPath } from "../src/config/routes";
import { readSiteConfig } from "../scripts/site-config";

/**
 * The active site (SITE_DIR, else site/), which the dev and preview servers
 * serve (#191). The specs read it rather than naming the owner's tabs and
 * routes, so they pass on any site and fail only on a broken one.
 */
export const site = readSiteConfig();

/** /about's tabs in order; the first is selected on load. */
export const SECTIONS = site.sections;

/** Where the tabs live: /about beside the landing page, else /. */
export const TABS_PATH = aboutPath(site);

/** Whether / is the Claudlobby landing page. */
export const LANDING = site.home === "landing";

/** A tab's or panel's name, matched whole. */
export const named = (label: string) => new RegExp(`^${label}$`, "i");

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
