// Renders og-image.html to public/og-image.png at 1200x630.
//
// Run from frontend/ after changing the card's text or colours:
//   node scripts/og-image/render.mjs
// It needs Playwright's Chromium (npx playwright install chromium), which the
// E2E suite already uses. The PNG is committed; the build does not run this.
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { chromium } from "@playwright/test";

const here = path.dirname(fileURLToPath(import.meta.url));
const out = path.resolve(here, "../../public/og-image.png");

const browser = await chromium.launch();
try {
  const page = await browser.newPage({
    viewport: { width: 1200, height: 630 },
    deviceScaleFactor: 1,
  });
  await page.goto(pathToFileURL(path.join(here, "og-image.html")).href);
  await page.screenshot({ path: out, type: "png" });
} finally {
  await browser.close();
}

console.log(`wrote ${path.relative(process.cwd(), out)}`);
