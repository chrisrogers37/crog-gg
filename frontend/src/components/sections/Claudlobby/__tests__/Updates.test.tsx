import { describe, it, expect, vi } from "vitest";
import { renderWithProviders, screen, userEvent } from "../../../../test/utils";
import { claudlobby } from "../../../../content/claudlobby";
import {
  CLAUDLOBBY_RELEASES,
  CLAUDLOBBY_RELEASES_FEED,
} from "../../../../content/links";
import { track } from "../../../../services/analytics";
import { Updates } from "../Updates";

vi.mock("../../../../services/analytics", () => ({ track: vi.fn() }));

const { updates } = claudlobby;

describe("Updates", () => {
  it("points at the repo's releases and their feed, with no form to fill in", () => {
    const { container } = renderWithProviders(<Updates />);
    expect(
      screen.getByRole("link", { name: updates.watchLink }),
    ).toHaveAttribute("href", CLAUDLOBBY_RELEASES);
    expect(screen.getByRole("link", { name: updates.feedLink })).toHaveAttribute(
      "href",
      CLAUDLOBBY_RELEASES_FEED,
    );
    expect(container.querySelector("form, input")).toBeNull();
  });

  it("reports a click on Watch releases once", async () => {
    const user = userEvent.setup();
    renderWithProviders(<Updates />);

    await user.click(screen.getByRole("link", { name: updates.watchLink }));

    expect(track).toHaveBeenCalledExactlyOnceWith({ name: "updates_click" });
  });
});
