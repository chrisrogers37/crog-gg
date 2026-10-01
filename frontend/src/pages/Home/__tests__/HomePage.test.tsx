import { describe, it, expect } from "vitest";
import { renderWithProviders, screen } from "../../../test/utils";
import { HomePage } from "../HomePage";
import { claudlobby } from "../../../content/claudlobby";
import {
  CLAUDLOBBY_GETTING_STARTED,
  CLAUDLOBBY_README_QUICKSTART,
  CLAUDLOBBY_REPO,
} from "../../../content/links";

const { hero, quickstart } = claudlobby;

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

  it("sends the quickstart to the README's own steps", () => {
    renderWithProviders(<HomePage />);
    expect(
      screen.getByRole("link", { name: quickstart.readmeLink }),
    ).toHaveAttribute("href", CLAUDLOBBY_README_QUICKSTART);
    expect(
      screen.getByRole("link", { name: quickstart.docsLink }),
    ).toHaveAttribute("href", CLAUDLOBBY_GETTING_STARTED);
  });
});
