import { render, screen, within } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { MemoryRouter } from "react-router";
import site from "virtual:site-config";
import { socialsIn } from "../../../../config/socials";
import { MobileMenu } from "../MobileMenu";
import { CLAUDLOBBY_REPO } from "../../../../content/links";

// Mock the store
vi.mock("../../../../store", () => ({
  useUIStore: (selector: (state: Record<string, unknown>) => unknown) => {
    const state = {
      isMobileMenuOpen: true,
      closeMobileMenu: vi.fn(),
    };
    return selector(state);
  },
  useIsMobileMenuOpen: () => true,
}));

describe("MobileMenu", () => {
  // As site.yaml may write them; the menu shows them lowercase.
  const sections = [
    { id: "about", label: "About" },
    { id: "journey", label: "Journey" },
  ];

  it("renders menu when open, linking the page's sections by their ids", () => {
    render(
      <MemoryRouter>
        <MobileMenu sections={sections} />
      </MemoryRouter>,
    );
    expect(screen.getByText("menu")).toBeInTheDocument();
    // In a group its label names, apart from the page links of the same name.
    const group = screen.getByRole("group", { name: "sections" });
    const links = within(group)
      .getAllByRole("link")
      .map((link) => [link.textContent, link.getAttribute("href")]);
    expect(links).toEqual([
      ["about", "#about"],
      ["journey", "#journey"],
    ]);
  });

  it("renders social links: exactly the menu socials, in site.yaml's order", () => {
    render(
      <MemoryRouter>
        <MobileMenu sections={sections} />
      </MemoryRouter>,
    );
    const menuSocials = socialsIn(site, "menu");
    expect(menuSocials).not.toHaveLength(0);
    const connect = screen.getByText("connect").parentElement!;
    const links = [...connect.querySelectorAll("a")].map((link) => [
      link.textContent,
      link.getAttribute("href"),
    ]);
    expect(links).toEqual(menuSocials.map((social) => [social.label, social.url]));
    expect(links.some(([, href]) => href?.startsWith(CLAUDLOBBY_REPO))).toBe(false);
  });

  it("renders page links: the owner's page is home", () => {
    render(
      <MemoryRouter>
        <MobileMenu />
      </MemoryRouter>,
    );
    const about = screen.getAllByRole("link", { name: "about" });
    expect(about.map((link) => link.getAttribute("href"))).toEqual(["/"]);
    expect(screen.getByRole("link", { name: "projects" })).toHaveAttribute(
      "href",
      "/projects",
    );
  });
});
