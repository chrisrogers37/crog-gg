import { describe, expect, it } from "vitest";
import site from "virtual:site-config";
import { PLANNED } from "../test/claudlobbyRules";
import { shareCard, textOf } from "../test/site";

/** The card's own words. */
const cardText = textOf(shareCard()?.body);

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
