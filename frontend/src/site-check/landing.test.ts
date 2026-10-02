import { describe, expect, it } from "vitest";
import site from "virtual:site-config";
import { PLANNED } from "../test/claudlobbyRules";

// The card's source, when the site keeps one.
const [cardHtml] = Object.values(
  import.meta.glob<string>("@site/og-image.html", { query: "?raw", import: "default", eager: true }),
);

/** The card's own words, whitespace collapsed, so a wrapped phrase reads as one. */
const cardText = cardHtml
  ? (new DOMParser().parseFromString(cardHtml, "text/html").body.textContent ?? "")
      .replace(/\s+/g, " ")
      .trim()
  : "";

// With home: landing, the share card speaks for Claudlobby's landing page, so
// it keeps that page's rules (content/claudlobby.test.ts has the copy's own).
describe.skipIf(site.home !== "landing")("the landing page's share card", () => {
  const said = [site.seo.image.alt, cardText].filter(Boolean);

  it("uses no em-dashes (CLAUDE.md tone rule)", () => {
    for (const text of said) expect(text, text).not.toContain("—");
  });

  it("names no other model provider: they're the roadmap, not the product", () => {
    for (const text of said) expect(text, text).not.toMatch(PLANNED);
  });
});
