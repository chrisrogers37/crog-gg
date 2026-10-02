import { afterEach, describe, expect, it } from "vitest";
import site from "virtual:site-config";
import { renderWithProviders, screen } from "../../../../test/utils";
import { Navigation } from "../Navigation";

describe("Navigation", () => {
  const home = site.home;
  afterEach(() => {
    site.home = home;
  });

  it("names the owner, linking home", () => {
    renderWithProviders(<Navigation />);
    expect(screen.getByRole("link", { name: site.owner.name })).toHaveAttribute(
      "href",
      "/",
    );
  });

  it("links the landing page, the personal page, the projects and Claudlobby", () => {
    site.home = "landing";
    renderWithProviders(<Navigation />);

    const pages = screen
      .getAllByRole("link")
      .filter((link) => link.classList.contains("nav-link"));
    expect(pages.map((link) => [link.textContent, link.getAttribute("href")])).toEqual([
      ["Home", "/"],
      ["About", "/about"],
      ["Projects", "/projects"],
    ]);
    expect(screen.getByRole("link", { name: /claudlobby/i })).toBeInTheDocument();
  });

  it("with home: profile, makes the personal page home and drops Claudlobby (#188)", () => {
    site.home = "profile";
    renderWithProviders(<Navigation />);

    const pages = screen
      .getAllByRole("link")
      .filter((link) => link.classList.contains("nav-link"));
    expect(pages.map((link) => [link.textContent, link.getAttribute("href")])).toEqual([
      ["Home", "/"],
      ["Projects", "/projects"],
    ]);
    expect(screen.queryByRole("link", { name: /claudlobby/i })).toBeNull();
  });
});
