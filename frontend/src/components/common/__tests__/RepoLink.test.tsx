import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HelmetProvider } from "react-helmet-async";
import { createMemoryRouter, MemoryRouter } from "react-router";
import { RouterProvider } from "react-router/dom";
import { routes } from "../../../router";
import { ClaudlobbyPage } from "../../sections/Claudlobby";
import { makeProject } from "../../../test/builders";
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
  it("counts each click on Claudlobby's page to the repo's front page once, with where the link sits", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <ClaudlobbyPage project={makeProject({ id: "claudlobby", title: "Claudlobby" })} />
      </MemoryRouter>,
    );

    // Every link into the repo. The deeper ones (issues, the setup guide, the
    // pinned README, the releases) aren't the repo's front page, so none may report a repo_click.
    const intoRepo = screen
      .getAllByRole("link")
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
    expect(repoClicks.sort()).toEqual(["hero", "quickstart"]);
    // The one other event is "Watch releases" reporting updates_click; the
    // feed and the deeper links report nothing.
    expect(
      vi
        .mocked(track)
        .mock.calls.map(([event]) => event)
        .filter((event) => event.name !== "repo_click"),
    ).toEqual([{ name: "updates_click" }]);
  });

  it("is Claudlobby's page's alone: the site's header, menu and footer link nowhere into it", async () => {
    // The layout loads the content on every route; nothing here needs it.
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    const user = userEvent.setup();
    render(
      <HelmetProvider>
        <RouterProvider router={createMemoryRouter(routes, { initialEntries: ["/"] })} />
      </HelmetProvider>,
    );
    await user.click(screen.getByRole("button", { name: "Open menu" }));

    const hrefs = (await screen.findAllByRole("link")).map((link) => link.getAttribute("href"));
    expect(hrefs.length).toBeGreaterThan(0);
    expect(hrefs.filter((href) => href?.startsWith(CLAUDLOBBY_REPO))).toEqual([]);
  });
});
