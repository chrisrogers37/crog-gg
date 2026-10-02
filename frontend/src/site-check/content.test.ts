import { describe, expect, it } from "vitest";
import yaml from "js-yaml";
import site from "virtual:site-config";
import bioYaml from "@site/public/content/bio.yaml?raw";
import type { BioData } from "../types/Bio";

/** The site's About copy, read the way the app reads it. */
const aboutText = (yaml.load(bioYaml) as BioData).about_text ?? "";

const paragraphs = aboutText
  .split(/\n\s*\n/)
  .map((paragraph) => paragraph.trim())
  .filter(Boolean);

describe("the site's About copy", () => {
  /**
   * Parsed with js-yaml rather than matched out of the raw source, so what is
   * checked is the paragraph structure the page depends on, not the block
   * style it is written in: `|`, `|-` and `|2` all render the same paragraphs.
   */
  it("is at least one paragraph", () => {
    expect(paragraphs.length).toBeGreaterThan(0);
  });

  it("ends on the sign-off that names the button", () => {
    // The last line tells the reader which control to press, so losing it is a
    // product regression rather than a copy edit. The regeneration prompt is
    // told to leave it alone; this pins the source it starts from. On the last
    // paragraph, not the file: the label sitting in a comment or halfway up
    // the copy would satisfy a whole-file check.
    expect(paragraphs.at(-1)).toContain(site.regenerate.labels.button);
  });
});
