import { describe, expect, it } from "vitest";
import site from "virtual:site-config";
import bioYaml from "@site/public/content/bio.yaml?raw";
import { bioShape } from "../config/contentSchema";
import { parseYaml } from "../utils/contentFile";

/**
 * The site's About copy, read the way the app reads it: held to bio.yaml's
 * shape (#190), so a file that doesn't fit fails here, naming the field.
 */
const aboutText = parseYaml(bioShape, bioYaml, "content/bio.yaml").about_text;

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

  // With features.regenerate: off there's no button to name (#191 item 9).
  it.skipIf(site.features?.regenerate === "off")("ends on the sign-off that names the button", () => {
    // The last line tells the reader which control to press, so losing it is a
    // product regression rather than a copy edit. The regeneration prompt is
    // told to leave it alone; this pins the source it starts from. On the last
    // paragraph, not the file: the label sitting in a comment or halfway up
    // the copy would satisfy a whole-file check.
    expect(
      paragraphs.at(-1),
      "the About text's last paragraph names the button: add that line, or set features.regenerate: off",
    ).toContain(site.regenerate.labels.button);
  });
});
