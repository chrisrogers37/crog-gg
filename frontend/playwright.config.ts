import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright E2E Testing Configuration
 *
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  // Test directory
  testDir: "./e2e",

  // Run tests in parallel
  fullyParallel: true,

  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,

  // One retry on CI, and a test that only passes on its retry fails the run:
  // a flaky test is reported, not hidden (#198 M72).
  retries: process.env.CI ? 1 : 0,
  failOnFlakyTests: !!process.env.CI,

  // Parallel workers
  workers: process.env.CI ? 1 : undefined,

  // Reporter configuration
  reporter: [["html", { outputFolder: "playwright-report" }], ["list"]],

  // Shared settings for all projects
  use: {
    // Base URL for the dev server
    baseURL: "http://localhost:5173",

    // Trace the first attempt and keep it only if it fails. With flaky tests
    // failing CI, a flake's trace is then the failing run, not the retry that
    // passed (#198 M72).
    trace: "retain-on-first-failure",

    // Take screenshot on failure
    screenshot: "only-on-failure",
  },

  // Configure projects for major browsers
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
      testIgnore: [/prerender\.spec\.ts/, /analytics\.spec\.ts/],
    },
    // The crawler's view of a production build: raw HTML, no browser.
    {
      name: "prerender",
      testMatch: /prerender\.spec\.ts/,
      use: { baseURL: "http://localhost:4179" },
    },
    // Analytics, which only a production build loads.
    {
      name: "analytics",
      testMatch: /analytics\.spec\.ts/,
      use: { ...devices["Desktop Chrome"], baseURL: "http://localhost:4179" },
    },
    // Uncomment to test on more browsers
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },
    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },
  ],

  // The dev server for the browser tests, and a production build under
  // `vite preview` for e2e/prerender.spec.ts and e2e/analytics.spec.ts. The
  // build is never reused from an earlier run: stale output is exactly what
  // those specs must not pass on.
  webServer: [
    {
      command: "npm run dev",
      url: "http://localhost:5173",
      reuseExistingServer: !process.env.CI,
      timeout: 120 * 1000,
    },
    {
      command: "npm run build && npx vite preview --port 4179 --strictPort",
      url: "http://localhost:4179",
      reuseExistingServer: false,
      timeout: 180 * 1000,
    },
  ],
});
