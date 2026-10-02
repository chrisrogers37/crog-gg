import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import yaml from "js-yaml";
import About from "../About";
import { BioData } from "../../types/Bio";
import { makeBio } from "../../test/builders";
// Read through Vite rather than fs: the path is resolved by the same module
// graph the app uses, so a moved content file fails here instead of resolving
// to nothing against whatever the runner's cwd happened to be.
import bioYaml from "../../../public/content/bio.yaml?raw";

/**
 * The About blurb is authored as paragraphs and rendered as one text node.
 *
 * Nothing splits it into elements: `about_text` arrives as a single string with
 * blank lines in it, and the only thing that turns those into visible breaks is
 * `white-space: pre-line` on the wrapper. Drop that one declaration and every
 * paragraph collapses into a wall of text -- with the content still correct, the
 * component still rendering, and no other test in the suite failing.
 *
 * Measured rather than assumed, in real Chromium at the deployed line-height:
 * under `pre-line` a blank line adds a full empty line box (+30px), and
 * consecutive newlines are preserved rather than collapsed. That is the property
 * the shipped YAML depends on, so it is pinned here.
 *
 * jsdom does not lay text out, so what is assertable here is the declaration and
 * the preserved newlines, not the pixels. The pixels were measured separately
 * and are cited above.
 */

const PARAGRAPHS = ["first beat.", "second beat.", "third beat."];

/** Render the blurb and hand back the node the text actually lives in. */
const renderBio = () => {
  render(
    <About
      onRegenerate={() => {}}
      content={makeBio({ about_text: PARAGRAPHS.join("\n\n") })}
    />,
  );
  const node = screen.getByText(/first beat/).closest("div");
  expect(node).not.toBeNull();
  return node as HTMLElement;
};

/** The shipped copy, read the way the app reads it. */
const shippedAboutText = () => (yaml.load(bioYaml) as BioData).about_text ?? "";

const paragraphsOf = (text: string) =>
  text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

describe("About paragraph rendering", () => {
  it("preserves the newlines it was given rather than collapsing them", () => {
    // getByText with an exact string would normalise the whitespace away, which
    // is the very thing under test -- so match on the node's own textContent.
    expect(renderBio().textContent).toBe(PARAGRAPHS.join("\n\n"));
  });

  it("declares the white-space rule that makes those newlines visible", () => {
    expect(renderBio().style.whiteSpace).toBe("pre-line");
  });
});

describe("the shipped About copy", () => {
  /**
   * Chris authored this as six beats and it shipped as one 819-character
   * paragraph, which is the defect this file exists alongside. The count is not
   * pinned -- it has already moved once, from five to six, and that is a content
   * edit rather than a regression -- but re-flattening it to a single block is.
   *
   * Parsed with js-yaml rather than matched out of the raw source, so that what
   * is pinned is the paragraph structure the page depends on and not the block
   * style it happens to be written in. `|`, `|-` and `|2` all render the same
   * paragraphs, and a test that failed on those would be a false red on an
   * ordinary content edit.
   */
  it("is more than one paragraph", () => {
    expect(paragraphsOf(shippedAboutText()).length).toBeGreaterThan(1);
  });

  it("still ends on the sign-off that names the button", () => {
    // The last line tells the reader which control to press, so losing it is a
    // product regression rather than a copy edit. The regeneration prompt is
    // told to leave it alone; this pins the source it starts from.
    //
    // Asserted on the LAST PARAGRAPH, not on the file: the string sitting in a
    // YAML comment, in a social link, or halfway up the blurb would satisfy a
    // whole-file check while the copy no longer ends on the call to action.
    const paragraphs = paragraphsOf(shippedAboutText());
    expect(paragraphs.at(-1)).toContain("SUMMON NEW LORE");
  });
});
