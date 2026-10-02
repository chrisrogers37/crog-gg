import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { MemoryRouter } from "react-router";
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
    expect(screen.getByText("github")).toBeInTheDocument();
    expect(screen.getByText("linkedin")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "claudlobby on github" }),
    ).toHaveAttribute("href", CLAUDLOBBY_REPO);
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
