import { describe, expect, it } from "vitest";
import site from "virtual:site-config";
import { renderWithProviders, screen } from "../../../../test/utils";
import { Navigation } from "../Navigation";

describe("Navigation", () => {
  it("names the owner, linking home", () => {
    renderWithProviders(<Navigation />);
    expect(screen.getByRole("link", { name: site.owner.name })).toHaveAttribute(
      "href",
      "/",
    );
  });

  it("links the owner's page and the projects, and nothing of Claudlobby's", () => {
    renderWithProviders(<Navigation />);

    const pages = screen
      .getAllByRole("link")
      .filter((link) => link.classList.contains("nav-link"));
    expect(pages.map((link) => [link.textContent, link.getAttribute("href")])).toEqual([
      ["about", "/"],
      ["projects", "/projects"],
    ]);
    expect(screen.queryByRole("link", { name: /claudlobby/i })).toBeNull();
  });
});
