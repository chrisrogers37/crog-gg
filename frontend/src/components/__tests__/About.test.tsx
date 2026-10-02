import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import About from "../About";
import { makeBio } from "../../test/builders";

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

// The shipped copy's own rules (paragraphs, the sign-off) are site:check's:
// src/site-check/content.test.ts.
