import { describe, it, expect, vi } from "vitest";
import { renderWithProviders, screen, userEvent } from "../../../test/utils";
import { HomePage } from "../HomePage";
import { claudlobby } from "../../../content/claudlobby";
import { CLAUDLOBBY_REPO } from "../../../content/links";

const { hero } = claudlobby;

describe("HomePage", () => {
  it("leads with one heading and both next steps", () => {
    renderWithProviders(<HomePage />);
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByRole("link", { name: hero.ctaStar })).toHaveAttribute(
      "href",
      CLAUDLOBBY_REPO,
    );
    expect(
      screen.getByRole("link", { name: hero.ctaQuickstart }),
    ).toHaveAttribute("href", "#quickstart");
    expect(screen.getByRole("link", { name: hero.aboutLink })).toHaveAttribute(
      "href",
      "/about",
    );
  });

  it("never skips a heading level", () => {
    renderWithProviders(<HomePage />);
    const levels = screen
      .getAllByRole("heading")
      .map((heading) => Number(heading.tagName.slice(1)));
    levels.forEach((level, index) => {
      if (index > 0) expect(level).toBeLessThanOrEqual(levels[index - 1] + 1);
    });
  });

  it("renders backticked terms in the copy as code", () => {
    const { container } = renderWithProviders(<HomePage />);
    expect(container.querySelector(".cl-hero-sub code")?.textContent).toBe(
      "fleet.yaml",
    );
  });

  it("copies the quickstart commands and announces it", async () => {
    // userEvent.setup() stands in a clipboard for the test.
    const user = userEvent.setup();
    renderWithProviders(<HomePage />);

    await user.click(screen.getByRole("button", { name: "Copy" }));

    expect(
      await screen.findByRole("button", { name: "Copied" }),
    ).toBeInTheDocument();
    expect(await navigator.clipboard.readText()).toContain(
      `git clone ${CLAUDLOBBY_REPO}.git`,
    );
    expect(
      screen.getByText("Commands copied to the clipboard"),
    ).toBeInTheDocument();
  });

  it("says so when the clipboard refuses, instead of claiming it copied", async () => {
    const user = userEvent.setup();
    vi.spyOn(navigator.clipboard, "writeText").mockRejectedValue(
      new Error("denied"),
    );
    renderWithProviders(<HomePage />);

    await user.click(screen.getByRole("button", { name: "Copy" }));

    expect(
      await screen.findByRole("button", { name: "Copy failed" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/couldn't copy/i)).toBeInTheDocument();
  });
});
