import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, it, expect, vi } from "vitest";
import { useContentStore } from "../../../store";
import { ActionButtons } from "../ActionButtons";
import site from "virtual:site-config";

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
};

// The button reads its cooldown from the store. limitsRequested keeps the
// once-per-load /api/limits read out of every test but the one that pins it.
beforeEach(() => {
  useContentStore.setState({
    cooldownEndsAt: null,
    cooldownTotal: 0,
    dailyCapReached: false,
    limitsRequested: true,
  });
});

const button = () =>
  screen.getByRole("button", { description: /regenerates the text with ai/i });

describe("ActionButtons while a regeneration is in flight", () => {
  it("disables the button", () => {
    render(<ActionButtons {...props} isRegenerating />);
    expect(button()).toBeDisabled();
  });

  it("says what it is doing rather than going quiet", () => {
    render(<ActionButtons {...props} isRegenerating />);
    expect(button()).toHaveTextContent(site.regenerate.labels.busy);
  });

  it("is pressable and named again once the press has finished", () => {
    // The positive control. Both assertions above are equally true of a button
    // that is permanently disabled and permanently mid-cast, which would be its
    // own defect -- so pin the state they are supposed to be distinguishable from.
    render(<ActionButtons {...props} />);
    expect(button()).toBeEnabled();
    expect(button()).toHaveTextContent(site.regenerate.labels.button);
  });
});

describe("ActionButtons accessible names", () => {
  // Named by the words on them (WCAG 2.5.3), so a voice-control user can say
  // what they see; Lighthouse flagged the old labels, which did not contain it.
  it("names each button by its visible text", () => {
    render(<ActionButtons {...props} hasModifiedContent />);
    expect(
      screen.getByRole("button", { name: site.regenerate.labels.button }),
    ).toHaveAccessibleDescription(/regenerates the text with ai/i);
    expect(
      screen.getByRole("button", { name: site.regenerate.labels.reset }),
    ).toHaveAccessibleDescription(/restores the original text/i);
  });

  it("names the cooldown by the number it shows", () => {
    useContentStore.setState({ cooldownEndsAt: Date.now() + 27_000, cooldownTotal: 30 });
    render(<ActionButtons {...props} />);
    expect(button()).toHaveAccessibleName("27 seconds of cooldown left");
  });
});

describe("ActionButtons after the daily cap", () => {
  it("stays disabled and says why once the server has refused for the day (#196 M44)", () => {
    useContentStore.setState({ dailyCapReached: true });
    render(<ActionButtons {...props} />);
    expect(button()).toBeDisabled();
    expect(button()).toHaveTextContent(/daily limit reached/i);
  });
});

describe("ActionButtons and the server's cooldown", () => {
  const realFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = realFetch;
  });

  it("reads /api/limits once per page load, when the button first shows", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      json: async () => ({ cooldown_remaining: 0, cooldown_total: 30 }),
    });
    globalThis.fetch = fetchMock as unknown as typeof fetch;
    useContentStore.setState({ limitsRequested: false });

    const first = render(<ActionButtons {...props} />);
    first.unmount();
    render(<ActionButtons {...props} />);

    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    expect(fetchMock.mock.calls[0][0]).toMatch(/\/api\/limits$/);
  });
});
