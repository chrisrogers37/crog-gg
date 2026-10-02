// Renders the site's link-preview cards at 1200x630 (#188): every
// site/<name>.html to site/public/<name>.png. The site's card (og-image), and
// a project's own (`card` in its file), such as claudlobby-card.
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
const cards = fs
  .readdirSync(site)
  .filter((file) => file.endsWith(".html"))
  .map((file) => file.slice(0, -".html".length));
if (cards.length === 0) throw new Error(`no card source (<name>.html) in ${site}`);

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
