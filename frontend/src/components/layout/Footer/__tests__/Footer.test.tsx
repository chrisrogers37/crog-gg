import { afterEach, describe, expect, it } from "vitest";
import site from "virtual:site-config";
import { socialsIn } from "../../../../config/socials";
import { CLAUDLOBBY_REPO } from "../../../../content/links";
import { renderWithProviders, screen } from "../../../../test/utils";
import { Footer } from "../Footer";

const REPO = "https://github.com/example/site";

describe("Footer", () => {
  const configured = site.footer.source_repo_url;
  afterEach(() => {
    site.footer.source_repo_url = configured;
  });

  it("names the owner, then links Claudlobby, the personal page, exactly the footer socials in order, and the source", () => {
    site.footer.source_repo_url = REPO;
    const { container } = renderWithProviders(<Footer />);

    expect(screen.getByRole("contentinfo")).toHaveTextContent(site.owner.name);
    const footerSocials = socialsIn(site, "footer");
    expect(footerSocials).not.toHaveLength(0);
    const links = [...container.querySelectorAll(".footer-links a")].map((link) => [
      link.textContent,
      link.getAttribute("href"),
    ]);
    expect(links).toEqual([
      ["claudlobby", CLAUDLOBBY_REPO],
      ["about", "/about"],
      ...footerSocials.map((social) => [social.label, social.url]),
      ["view source", REPO],
    ]);
  });

  it("links the source repo last, in a new tab, when site.yaml names it (#188)", () => {
    site.footer.source_repo_url = REPO;
    const { container } = renderWithProviders(<Footer />);

    const link = screen.getByRole("link", { name: "view source" });
    expect(link).toHaveAttribute("href", REPO);
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
    expect(container.querySelector(".footer-links a:last-child")).toBe(link);
  });

  // site.yaml's empty value arrives as undefined (config/schema.ts).
  it("shows no source link when site.yaml leaves it empty", () => {
    site.footer.source_repo_url = undefined;
    renderWithProviders(<Footer />);

    expect(screen.queryByText(/view source/i)).toBeNull();
  });

  it("claims no rights over the code beside the source link", () => {
    site.footer.source_repo_url = REPO;
    renderWithProviders(<Footer />);

    expect(screen.getByRole("contentinfo")).not.toHaveTextContent(
      /all rights reserved/i,
    );
  });
});
