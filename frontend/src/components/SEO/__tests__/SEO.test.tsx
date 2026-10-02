import { afterEach, describe, it, expect } from "vitest";
import { renderWithProviders, waitFor } from "../../../test/utils";
import { SEO } from "../SEO";
import { renderHead } from "../../../seo/prerender";
import {
  HOME_META,
  PROJECTS_META,
  SITE_URL,
  pageTitle,
  type PageMeta,
} from "../../../seo/site";

/**
 * The page arrives with its head already in the HTML, and SEO renders the same
 * tags again once React mounts (seo/site.ts). These pin that the two merge into
 * one set, and that another page's SEO replaces the entry page's tags.
 */

const serveHead = (meta: PageMeta) => {
  document.head.innerHTML = renderHead(meta);
  return Array.from(document.head.querySelectorAll("[data-rh]"));
};

afterEach(() => {
  document.head.innerHTML = "";
  document.title = "";
});

describe("SEO", () => {
  it("adopts the prerendered tags as its own instead of adding a second set", async () => {
    const served = serveHead(PROJECTS_META);
    // Helmet commits on a later animation frame, and the served head already
    // has the right title, so nothing observable says the commit happened.
    // Withhold one tag: Helmet putting it back is that signal.
    const probe = document.head.querySelector('meta[name="twitter:image:alt"]')!;
    probe.remove();
    renderWithProviders(<SEO {...PROJECTS_META} />);

    await waitFor(() =>
      expect(
        document.head.querySelector('meta[name="twitter:image:alt"]'),
      ).not.toBeNull(),
    );
    expect(document.title).toBe(pageTitle(PROJECTS_META));
    // Helmet keeps a marked tag only when its own would be identical and
    // replaces it otherwise, so every served node still being attached is the
    // proof that the build and the component render the same tags.
    const kept = served.filter((node) => node !== probe);
    expect(kept.filter((node) => !node.isConnected)).toEqual([]);
    expect(document.head.querySelectorAll("[data-rh]")).toHaveLength(
      served.length,
    );
  });

  it("replaces the entry page's tags when another page renders", async () => {
    serveHead(HOME_META);
    renderWithProviders(<SEO {...PROJECTS_META} />);

    await waitFor(() =>
      expect(
        document.head.querySelector('link[rel="canonical"]')?.getAttribute("href"),
      ).toBe(`${SITE_URL}/projects`),
    );
    expect(document.head.querySelectorAll('meta[property="og:url"]')).toHaveLength(1);
    // The home page's JSON-LD belongs to the home page only.
    expect(
      document.head.querySelectorAll('script[type="application/ld+json"]'),
    ).toHaveLength(0);
  });
});
