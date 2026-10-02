import { render, screen } from "@testing-library/react";
import { afterEach, describe, it, expect, vi } from "vitest";
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
    { id: "about", label: "About" },
    { id: "journey", label: "Journey" },
  ];

  it("renders menu when open", () => {
    render(
      <MemoryRouter>
        <MobileMenu sections={sections} activeSection="about" />
      </MemoryRouter>,
    );
    expect(screen.getByText("menu")).toBeInTheDocument();
    expect(screen.getByText("about")).toBeInTheDocument();
    expect(screen.getByText("journey")).toBeInTheDocument();
  });

  it("renders social links", () => {
    render(
      <MemoryRouter>
        <MobileMenu sections={sections} />
      </MemoryRouter>,
    );
    // Claudlobby, then exactly the menu socials, in site.yaml's order.
    const menuSocials = socialsIn(site, "menu");
    expect(menuSocials).not.toHaveLength(0);
    const connect = screen.getByText("connect").parentElement!;
    const links = [...connect.querySelectorAll("a")].map((link) => [
      link.textContent,
      link.getAttribute("href"),
    ]);
    expect(links).toEqual([
      ["claudlobby on github", CLAUDLOBBY_REPO],
      ...menuSocials.map((social) => [social.label, social.url]),
    ]);
  });

  it("renders page links", () => {
    render(
      <MemoryRouter>
        <MobileMenu />
      </MemoryRouter>,
    );
    expect(screen.getByText("home")).toBeInTheDocument();
    // "about me", so it can't be mistaken for /about's own About section.
    expect(screen.getByRole("link", { name: "about me" })).toHaveAttribute(
      "href",
      "/about",
    );
    expect(screen.getByText("all projects")).toBeInTheDocument();
  });

  describe("with home: profile (#188)", () => {
    const home = site.home;
    afterEach(() => {
      site.home = home;
    });

    it("links home and the projects, with no about me or Claudlobby link", () => {
      site.home = "profile";
      render(
        <MemoryRouter>
          <MobileMenu />
        </MemoryRouter>,
      );
      expect(screen.getByRole("link", { name: "home" })).toHaveAttribute("href", "/");
      expect(screen.getByText("all projects")).toBeInTheDocument();
      expect(screen.queryByText("about me")).toBeNull();
      expect(screen.queryByText("claudlobby on github")).toBeNull();
    });
  });

  it("marks active section", () => {
    render(
      <MemoryRouter>
        <MobileMenu sections={sections} activeSection="about" />
      </MemoryRouter>,
    );
    const aboutBtn = screen.getByText("about");
    expect(aboutBtn.className).toContain("active");
  });
});
