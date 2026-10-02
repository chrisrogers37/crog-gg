import { describe, expect, it } from "vitest";
import site from "virtual:site-config";
import { shareCard, textOf } from "../test/site";

/** The card's own words. */
const cardText = textOf(shareCard()?.body);

// Every page's link preview (og-image.html), so it keeps the copy's rules.
describe("the share card", () => {
  it("uses no em-dashes (CLAUDE.md tone rule)", () => {
    for (const text of [site.seo.image.alt, cardText].filter(Boolean)) {
      expect(text, text).not.toContain("—");
    }
  });
});
