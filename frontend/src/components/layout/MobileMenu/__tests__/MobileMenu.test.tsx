import { render, screen } from "@testing-library/react";
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
  const sections = [
    { id: "about", label: "about" },
    { id: "journey", label: "journey" },
  ];

  it("renders menu when open, with the page's sections", () => {
    render(
      <MemoryRouter>
        <MobileMenu sections={sections} activeSection="" />
      </MemoryRouter>,
    );
    expect(screen.getByText("menu")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "about" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "journey" })).toBeInTheDocument();
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
    expect(screen.getByRole("link", { name: "about" })).toHaveAttribute("href", "/");
    expect(screen.getByRole("link", { name: "projects" })).toHaveAttribute(
      "href",
      "/projects",
    );
  });

  it("marks active section", () => {
    render(
      <MemoryRouter>
        <MobileMenu sections={sections} activeSection="journey" />
      </MemoryRouter>,
    );
    expect(screen.getByRole("button", { name: "journey" }).className).toContain("active");
    expect(screen.getByRole("button", { name: "about" }).className).not.toContain("active");
  });
});
