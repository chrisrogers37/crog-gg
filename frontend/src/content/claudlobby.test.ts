import { describe, it, expect } from "vitest";
import { claudlobby } from "./claudlobby";
import { HOME_META, OG_IMAGE, pageTitle } from "../seo/site";
import ogImageHtml from "../../scripts/og-image/og-image.html?raw";

/**
 * The homepage copy's rules (content/claudlobby.ts). Its shape is the type
 * checker's job; these are the rules a type can't express.
 */

/** Every string in the value. */
const strings = (value: unknown): string[] =>
  typeof value === "string"
    ? [value]
    : Array.isArray(value)
      ? value.flatMap(strings)
      : value && typeof value === "object"
        ? Object.values(value).flatMap(strings)
        : [];

const copy = strings(claudlobby);

/** The share card's own words, as rendered into og-image.png. */
const cardText = (
  new DOMParser().parseFromString(ogImageHtml, "text/html").body.textContent ??
  ""
)
  .split("\n")
  .map((line) => line.trim())
  .filter(Boolean);

/**
 * What `/` says about Claudlobby off the page: the tab and share title, the
 * search snippet, the share card and its alt text, and the JSON-LD.
 */
const homeHead = [
  pageTitle(HOME_META),
  HOME_META.description,
  OG_IMAGE.alt,
  ...cardText,
  ...strings(HOME_META.schemas),
];

/** Every rule about what `/` says covers both. */
const homeText = [...copy, ...homeHead];

describe("homepage copy", () => {
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

  it("uses no em-dashes (CLAUDE.md tone rule)", () => {
    for (const text of homeText) expect(text, text).not.toContain("—");
  });

  it("keeps the employer out of the hero (Chris, 2026-09-30)", () => {
    for (const text of strings(claudlobby.hero)) {
      expect(text).not.toMatch(/artemis/i);
    }
  });
});

describe("tone split and maturity (#179)", () => {
  // Other agents and providers are the plan, not the product: they may be
  // named only where the page says they're planned.
  const PLANNED =
    /openai|chatgpt|\bgpt|gemini|codex|mistral|llama|qwen|deepseek|grok|local models?|multi[- ]?provider|provider[- ]?agnostic|model[- ]?agnostic|any llm/i;

  it("names other model providers only in the maturity note's plan and the roadmap's Next column", () => {
    const { maturity, roadmap, ...rest } = claudlobby;
    const { planned, ...maturityRest } = maturity;
    const { next, ...roadmapRest } = roadmap;
    for (const text of [
      ...strings(rest),
      ...strings(maturityRest),
      ...strings(roadmapRest),
      ...homeHead,
    ]) {
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
