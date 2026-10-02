import { describe, expect, it } from "vitest";
import { CLAUDLOBBY_GETTING_STARTED, CLAUDLOBBY_REPO as REPO, isClaudlobbyFrontPage } from "./links";

describe("isClaudlobbyFrontPage, which decides what counts as a repo click (#177)", () => {
  it.each([
    REPO,
    `${REPO}/`,
    `${REPO}#quick-start`,
    `${REPO}?tab=readme-ov-file`,
    `${REPO}/?tab=readme-ov-file#readme`,
    REPO.toLowerCase(),
  ])("counts %s: GitHub serves it as the front page", (href) => {
    expect(isClaudlobbyFrontPage(href)).toBe(true);
  });

  it.each([
    `${REPO}/issues`,
    `${REPO}/releases`,
    `${REPO}-docs`,
    CLAUDLOBBY_GETTING_STARTED,
    "https://github.com/Claudfather",
    "https://github.com/someone/else",
    "https://gitlab.com/Claudfather/Claudlobby",
    "#quickstart",
    "",
  ])("doesn't count %s", (href) => {
    expect(isClaudlobbyFrontPage(href)).toBe(false);
  });
});
