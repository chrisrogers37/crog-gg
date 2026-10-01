import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HelmetProvider } from "react-helmet-async";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { routes } from "../../../router";
import { CLAUDLOBBY_REPO } from "../../../content/links";
import { track } from "../../../services/analytics";

vi.mock("../../../services/analytics", () => ({ track: vi.fn() }));

afterEach(() => {
  vi.unstubAllGlobals();
});

/**
 * The repo's front page, where the Star button is: with or without an anchor,
 * a trailing slash or a query like `?tab=readme-ov-file`, which GitHub serves
 * as the same page.
 */
const isFrontPage = (href: string) => {
  const url = new URL(href);
  return `${url.origin}${url.pathname.replace(/\/$/, "")}` === CLAUDLOBBY_REPO;
};

describe("RepoLink", () => {
  it("counts each click on / to the repo's front page once, with where the link sits", async () => {
    // The layout loads /about's content on every route; nothing here needs it.
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    const user = userEvent.setup();
    render(
      <HelmetProvider>
        <RouterProvider
          router={createMemoryRouter(routes, { initialEntries: ["/"] })}
        />
      </HelmetProvider>,
    );
    await user.click(screen.getByRole("button", { name: "Open menu" }));

    // Every link into the repo. The deeper ones (issues, the setup guide, the
    // pinned README, the releases) aren't the repo's front page, so none may report a repo_click.
    const intoRepo = (await screen.findAllByRole("link"))
      .map((link) => [link, link.getAttribute("href")!] as const)
      .filter(([, href]) => href.startsWith(CLAUDLOBBY_REPO));
    for (const [link] of intoRepo) await user.click(link);

    const frontPage = intoRepo.filter(([, href]) => isFrontPage(href));
    const repoClicks = vi
      .mocked(track)
      .mock.calls.flatMap(([event]) =>
        event.name === "repo_click" ? [event.location] : [],
      );
    expect(repoClicks).toHaveLength(frontPage.length);
    const locations = repoClicks;
    expect(locations.sort()).toEqual([
      "footer",
      "header",
      "hero",
      "menu",
      "quickstart",
    ]);
  });
});
