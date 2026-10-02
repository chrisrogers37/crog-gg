import { test as base, expect } from "@playwright/test";
import type { Features } from "../src/config/features";

/**
 * The specs' `test`: every page gets an answer from GET /api/features (#189
 * M21), since the e2e servers run with no API and a page with no answer
 * hides SUMMON and the GitHub panels. Both are served by default, as on a
 * deployment with its keys; a spec that needs another answer sets it with
 * `test.use({ features: ... })`.
 */
export const test = base.extend<{ features: Features }>({
  features: [{ regenerate: true, github: true }, { option: true }],
  page: async ({ page, features }, use) => {
    await page.route("**/api/features", (route) => route.fulfill({ json: features }));
    await use(page);
  },
});

export { expect };
