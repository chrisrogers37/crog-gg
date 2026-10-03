import { describe, it, expect } from "vitest";
import { claudlobby } from "./claudlobby";
import { PLANNED, strings } from "../test/claudlobbyRules";

/**
 * The rules for Claudlobby's page copy (content/claudlobby.ts). Its shape is
 * the type checker's job; these are the rules a type can't express. What
 * says it off the page, its card and its page's head, its share card's words
 * included, is the site's project file, so site:check holds that to them
 * (site-check/projects.test.ts, site-check/cards.test.ts).
 */

const copy = strings(claudlobby);

describe("Claudlobby's page copy", () => {
  it("has no empty strings", () => {
    for (const text of copy) expect(text).toMatch(/\S/);
  });

  it("pairs every backtick, so no copy turns into code by accident", () => {
    // InlineCode renders the text between backticks as <code>; one stray
    // backtick would make the rest of the sentence code.
    for (const text of copy) {
      expect((text.match(/`/g) ?? []).length % 2, text).toBe(0);
    }
  });

  it("gives its numbers a source pinned to a commit, and a date", () => {
    // #173: the counts must match the README they were read from, so the link
    // goes to that exact version of it rather than to whatever main says now.
    const { library } = claudlobby.why;
    expect(library.source).toMatch(
      /^https:\/\/github\.com\/Claudfather\/Claudlobby\/blob\/[0-9a-f]{40}\/README\.md/,
    );
    expect(library.asOf).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    for (const count of library.counts) {
      expect(Number.isInteger(count.value)).toBe(true);
    }
  });

  it("gives its roles a source pinned to a commit, and a date", () => {
    // Each role says what profiles and skills in the library do, so the link
    // goes to the library as it was read, not to whatever main says now.
    const { workers } = claudlobby;
    expect(workers.source).toMatch(
      /^https:\/\/github\.com\/Claudfather\/Claudlobby\/tree\/[0-9a-f]{40}\/library(\/|$)/,
    );
    expect(workers.asOf).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("uses no em-dashes (CLAUDE.md tone rule)", () => {
    for (const text of copy) expect(text, text).not.toContain("—");
  });

  it("keeps the employer out of the hero (Chris, 2026-09-30)", () => {
    // The hero renders the maturity note too (Hero.tsx).
    for (const text of strings([claudlobby.hero, claudlobby.maturity])) {
      expect(text).not.toMatch(/artemis/i);
    }
  });
});

describe("tone split and maturity (#179)", () => {
  it("names other model providers only in the maturity note's plan and the roadmap's Next column", () => {
    const { maturity, roadmap, ...rest } = claudlobby;
    const { planned, ...maturityRest } = maturity;
    const { next, ...roadmapRest } = roadmap;
    for (const text of [...strings(rest), ...strings(maturityRest), ...strings(roadmapRest)]) {
      expect(text, text).not.toMatch(PLANNED);
    }
    // And the two places that may name them still do, so PLANNED still
    // recognises the words the copy uses.
    expect(planned).toMatch(PLANNED);
    expect(next.items.some((item) => PLANNED.test(item))).toBe(true);
  });

  it("says plainly what runs today and that the rest is roadmap", () => {
    expect(claudlobby.maturity.today).toMatch(/claude code/i);
    expect(claudlobby.maturity.planned).toMatch(/roadmap/i);
  });
});
