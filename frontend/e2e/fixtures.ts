import { test as base, expect } from "@playwright/test";

/** What GET /api/features answers (#189 M21). */
export type FeaturesAnswer = {
  regenerate: boolean;
  github: boolean;
};

/**
 * The specs' `test`: every page gets an answer from GET /api/features, since
 * the e2e servers run with no API and a page with no answer hides SUMMON and
 * the GitHub panels. SUMMON is served by default; a spec that needs another
 * answer sets it with `test.use({ features: ... })`.
 */
export const test = base.extend<{ features: FeaturesAnswer }>({
  features: [{ regenerate: true, github: false }, { option: true }],
  page: async ({ page, features }, use) => {
    await page.route("**/api/features", (route) => route.fulfill({ json: features }));
    await use(page);
  },
});

export { expect };
