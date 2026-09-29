import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { ActionButtons } from "../ActionButtons";

/**
 * The in-flight affordances, pinned because another test leans on them.
 *
 * `contentStore`'s regeneration guard deliberately stays SILENT when a press
 * arrives while one is already running, and its justification is this component:
 * the button is disabled and says what it is doing, so a message there would
 * report an error for a button that is working.
 *
 * That reasoning is only sound while these two properties hold, and nothing
 * pinned them. Delete either and the store test still passes while the press
 * goes back to being the invisible no-op the split exists to end.
 */

const props = {
  onRegenerate: () => {},
  onReset: () => {},
  isRegenerating: false,
  hasModifiedContent: false,
  cooldownRemaining: 0,
  cooldownTotal: 30,
  isReady: false,
};

const button = () =>
  screen.getByRole("button", { description: /regenerates the text with ai/i });

describe("ActionButtons while a regeneration is in flight", () => {
  it("disables the button", () => {
    render(<ActionButtons {...props} isRegenerating />);
    expect(button()).toBeDisabled();
  });

  it("says what it is doing rather than going quiet", () => {
    render(<ActionButtons {...props} isRegenerating />);
    expect(button()).toHaveTextContent(/weaving/i);
  });

  it("is pressable and named again once the press has finished", () => {
    // The positive control. Both assertions above are equally true of a button
    // that is permanently disabled and permanently mid-cast, which would be its
    // own defect -- so pin the state they are supposed to be distinguishable from.
    render(<ActionButtons {...props} />);
    expect(button()).toBeEnabled();
    expect(button()).toHaveTextContent(/summon new lore/i);
  });
});

describe("ActionButtons accessible names", () => {
  // Named by the words on them (WCAG 2.5.3), so a voice-control user can say
  // what they see; Lighthouse flagged the old labels, which did not contain it.
  it("names each button by its visible text", () => {
    render(<ActionButtons {...props} hasModifiedContent />);
    expect(
      screen.getByRole("button", { name: "SUMMON NEW LORE" }),
    ).toHaveAccessibleDescription(/regenerates the text with ai/i);
    expect(
      screen.getByRole("button", { name: "DISPEL ENCHANTMENT" }),
    ).toHaveAccessibleDescription(/restores the original text/i);
  });

  it("names the cooldown by the number it shows", () => {
    render(<ActionButtons {...props} cooldownRemaining={27} />);
    expect(button()).toHaveAccessibleName("27 seconds of cooldown left");
  });
});
