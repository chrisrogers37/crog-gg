// Renders the site's link-preview cards at 1200x630 (#188), each from its
// HTML source in site/ to its PNG in site/public/: the site's card
// (og-image), and Claudlobby's page's own (claudlobby-card) where the site
// keeps one.
//
// Run from frontend/ after changing a card's text or colours:
//   node scripts/og-image/render.mjs
// It needs Playwright's Chromium (npx playwright install chromium), which the
// E2E suite already uses. The PNGs are committed; the build does not run this.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { chromium } from "@playwright/test";

const here = path.dirname(fileURLToPath(import.meta.url));
const site = path.resolve(here, "../../../site");
const cards = ["og-image", "claudlobby-card"].filter((card) =>
  fs.existsSync(path.join(site, `${card}.html`)),
);
if (cards.length === 0) {
  throw new Error(`no card source (og-image.html, claudlobby-card.html) in ${site}`);
}

const browser = await chromium.launch();
try {
  const page = await browser.newPage({
    viewport: { width: 1200, height: 630 },
    deviceScaleFactor: 1,
  });
  for (const card of cards) {
    const out = path.join(site, "public", `${card}.png`);
    await page.goto(pathToFileURL(path.join(site, `${card}.html`)).href);
    await page.screenshot({ path: out, type: "png" });
    console.log(`wrote ${path.relative(process.cwd(), out)}`);
  }
} finally {
  await browser.close();
}
