import { afterEach, describe, expect, it } from "vitest";
import site from "virtual:site-config";
import { socialsIn } from "../../../../config/socials";
import { CLAUDLOBBY_REPO } from "../../../../content/links";
import { renderWithProviders, screen } from "../../../../test/utils";
import { Footer } from "../Footer";

const REPO = "https://github.com/example/site";

describe("Footer", () => {
  const configured = site.footer.source_repo_url;
  const home = site.home;
  afterEach(() => {
    site.footer.source_repo_url = configured;
    site.home = home;
  });

  it("links Claudlobby and the personal page beside the landing page", () => {
    site.home = "landing";
    renderWithProviders(<Footer />);
    expect(screen.getByRole("link", { name: "claudlobby" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "about" })).toHaveAttribute("href", "/about");
  });

  it("drops both with home: profile, where the personal page is home (#188)", () => {
    site.home = "profile";
    renderWithProviders(<Footer />);
    expect(screen.queryByRole("link", { name: "claudlobby" })).toBeNull();
    expect(screen.queryByRole("link", { name: "about" })).toBeNull();
  });

  it("names the owner, then links Claudlobby, the personal page, exactly the footer socials in order, and the source", () => {
    site.home = "landing";
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
      ["view source", `${REPO}/tree/c0ffee`],
    ]);
  });

  it("links the source repo last, in a new tab, when site.yaml names it (#188)", () => {
    site.footer.source_repo_url = REPO;
    const { container } = renderWithProviders(<Footer />);

    const link = screen.getByRole("link", { name: "view source" });
    // At the commit the build is from (vitest.config.ts's).
    expect(link).toHaveAttribute("href", `${REPO}/tree/c0ffee`);
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
