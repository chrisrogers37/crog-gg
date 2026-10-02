import { describe, expect, it } from "vitest";

/**
 * GokuStats is not Chris's project and must not appear anywhere on the site
 * (#176): not in copy, project cards, content or page heads. Images, video
 * and what a project page fetches at runtime (its README) can't be read here,
 * so those still need checking by eye.
 */
// "GokuStats", "goku stats", "goku-stats", "goku_stats".
const NEVER = /goku[\s_-]*stats/i;

const files = import.meta.glob<string>(
  [
    // Source that can carry copy; tests and styles can't.
    "./**/*.{ts,tsx,json}",
    "!./**/*.test.{ts,tsx}",
    "!./**/__tests__/**",
    "!./test/**",
    "../public/**/*.{yaml,json,xml,txt,html,webmanifest}",
    "../index.html",
  ],
  { query: "?raw", import: "default", eager: true },
);

describe("never featured", () => {
  it("mentions GokuStats nowhere in the site's source and content", () => {
    const paths = Object.keys(files);
    // The globs still reach the site: a broken path would pass vacuously.
    expect(paths.length).toBeGreaterThan(50);
    expect(paths.filter((path) => NEVER.test(files[path]))).toEqual([]);
  });
});
