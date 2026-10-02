import { afterEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders, screen } from "../../../../test/utils";
import { Footer } from "../Footer";

const REPO = "https://github.com/example/site";

describe("Footer", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("links the source repo last, in a new tab, when the build names it (#188)", () => {
    vi.stubEnv("VITE_SOURCE_REPO_URL", ` ${REPO} `);
    const { container } = renderWithProviders(<Footer />);

    const link = screen.getByRole("link", { name: "view source" });
    expect(link).toHaveAttribute("href", REPO);
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
    expect(container.querySelector(".footer-links a:last-child")).toBe(link);
  });

  it.each(["", "   "])("shows no source link when the repo is %j", (value) => {
    vi.stubEnv("VITE_SOURCE_REPO_URL", value);
    renderWithProviders(<Footer />);

    // By text, not role: an <a> React renders without an href isn't a link,
    // but its words would still show.
    expect(screen.queryByText(/view source/i)).toBeNull();
  });

  it("claims no rights over the code beside the source link", () => {
    vi.stubEnv("VITE_SOURCE_REPO_URL", REPO);
    renderWithProviders(<Footer />);

    expect(screen.getByRole("contentinfo")).not.toHaveTextContent(
      /all rights reserved/i,
    );
  });
});
