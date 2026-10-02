import { act, fireEvent, render, screen } from "@testing-library/react";
import { HelmetProvider } from "react-helmet-async";
import { createMemoryRouter } from "react-router";
import { RouterProvider } from "react-router/dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import site from "virtual:site-config";
import { useContentStore, useUIStore } from "../../../store";
import { githubService, type Repository } from "../../../services/githubService";
import type { Project } from "../../../types";
import { ProjectDetailPage } from "../ProjectDetailPage";

// Restored after each test, so a stubbed action can't leak into the next.
const INITIAL = useContentStore.getState();
const INITIAL_UI = useUIStore.getState();
const SITE_FEATURES = site.features;
afterEach(() => {
  useContentStore.setState(INITIAL, true);
  useUIStore.setState(INITIAL_UI, true);
  site.features = SITE_FEATURES;
});

/** What GET /api/features answers where the API serves GitHub. */
const githubServed = () => useUIStore.setState({ features: { regenerate: false, github: true } });

/** The tests' site's GitHub owner (site.example's github.username). */
const OWNER = site.github.username;

const BENZO = {
  id: "benzo",
  title: "Benzo",
  description: "A project",
} as Project;

const renderAt = (entries: string[]) => {
  const router = createMemoryRouter(
    [
      { path: "/projects/:slug", element: <ProjectDetailPage /> },
      { path: "*", element: <p>elsewhere</p> },
    ],
    { initialEntries: entries, initialIndex: entries.length - 1 },
  );
  render(
    <HelmetProvider>
      <RouterProvider router={router} />
    </HelmetProvider>,
  );
  return router;
};

/**
 * A deep link renders before the content has loaded, so "no such project
 * yet" isn't "no such project" (#196 M41).
 */
describe("ProjectDetailPage before its project is found", () => {
  it("shows a skeleton while the content loads, not 'Project Not Found'", () => {
    // The store's own starting state: nothing loaded yet, a load pending.
    renderAt(["/projects/benzo"]);
    expect(screen.getByRole("status", { name: /loading project/i })).toBeInTheDocument();
    expect(screen.queryByText(/project not found/i)).not.toBeInTheDocument();
  });

  it("offers a retry when the content failed to load", () => {
    const loadContent = vi.fn();
    useContentStore.setState({
      projects: [],
      isLoading: false,
      error: "Failed to load content.",
      loadContent,
    });
    renderAt(["/projects/benzo"]);
    expect(screen.getByRole("alert")).toHaveTextContent(/failed to load/i);
    fireEvent.click(screen.getByRole("button", { name: /retry/i }));
    expect(loadContent).toHaveBeenCalled();
    expect(screen.queryByText(/project not found/i)).not.toBeInTheDocument();
  });

  it("says 'Project Not Found' only for a loaded list without the slug", () => {
    useContentStore.setState({ projects: [BENZO], isLoading: false, error: null });
    renderAt(["/projects/nope"]);
    expect(screen.getByRole("heading", { name: /project not found/i })).toBeInTheDocument();
  });
});

/**
 * "Go Back" went back in browser history, which leaves the site when the page
 * was opened directly (#196 M67).
 */
describe("ProjectDetailPage's Go Back", () => {
  beforeEach(() => {
    useContentStore.setState({ projects: [BENZO], isLoading: false, error: null });
  });

  it("goes to /projects when the page was opened directly", () => {
    const router = renderAt(["/projects/benzo"]);
    fireEvent.click(screen.getByRole("button", { name: /go back/i }));
    expect(router.state.location.pathname).toBe("/projects");
  });

  it("goes back when there's a page of ours to go back to", () => {
    const router = renderAt(["/about", "/projects/benzo"]);
    fireEvent.click(screen.getByRole("button", { name: /go back/i }));
    expect(router.state.location.pathname).toBe("/about");
  });
});

/**
 * Each project's page starts fresh: the page is keyed by project, so a crashed
 * section (or another project's figures) doesn't carry over (#196 M68).
 */
describe("ProjectDetailPage across projects", () => {
  it("doesn't carry a crashed section over to the next project", async () => {
    const project = (id: string): Project =>
      ({
        id,
        title: id,
        description: "A project",
        url: `https://github.com/${OWNER}/${id}`,
      }) as Project;
    useContentStore.setState({
      projects: [project("alpha"), project("beta")],
      isLoading: false,
      error: null,
    });
    // alpha's stats can't render (no figures in the answer), so its section
    // crashes; beta's answer is whole.
    vi.spyOn(githubService, "getRepository").mockImplementation(async (_owner, name) =>
      name === "alpha"
        ? ({} as Repository)
        : ({
            name,
            stargazers_count: 222,
            forks_count: 1,
            watchers_count: 1,
            open_issues_count: 0,
            pushed_at: "2026-09-01T00:00:00Z",
            language: null,
            license: null,
          } as Repository),
    );
    vi.spyOn(githubService, "getReadme").mockRejectedValue(new Error("offline"));
    vi.spyOn(console, "error").mockImplementation(() => {});
    githubServed();

    const router = renderAt(["/projects/alpha"]);
    expect(
      await screen.findByText(/something went wrong loading this section/i),
    ).toBeInTheDocument();
    // By the owner in the project's own URL (#189).
    expect(githubService.getRepository).toHaveBeenCalledWith(OWNER, "alpha");
    expect(githubService.getReadme).toHaveBeenCalledWith(OWNER, "alpha");

    await act(() => router.navigate("/projects/beta"));
    expect(await screen.findByText("222")).toBeInTheDocument();
    expect(
      screen.queryByText(/something went wrong loading this section/i),
    ).not.toBeInTheDocument();
    vi.restoreAllMocks();
  });
});

/**
 * The repo's stats and README show only where the API serves them (#189
 * M21): site.yaml's features.github decides, or, left at auto, the API's
 * answer, and then only for an owner it serves.
 */
describe("ProjectDetailPage's GitHub panels", () => {
  const LINKED = { ...BENZO, github: `https://github.com/${OWNER.toUpperCase()}/benzo` } as Project;
  const panels = () => [
    screen.queryByRole("heading", { name: /repository stats/i }),
    screen.queryByRole("heading", { name: /documentation/i }),
  ];

  beforeEach(() => {
    useContentStore.setState({ projects: [LINKED], isLoading: false, error: null });
    vi.spyOn(githubService, "getRepository").mockReturnValue(new Promise(() => {}));
    vi.spyOn(githubService, "getReadme").mockReturnValue(new Promise(() => {}));
  });
  afterEach(() => vi.restoreAllMocks());

  it.each([
    ["the API hasn't answered, or couldn't", () => {}, false],
    ["the API serves GitHub (the owner in any case)", githubServed, true],
    [
      "site.yaml turns GitHub off",
      () => {
        githubServed();
        site.features = { regenerate: undefined, github: "off" };
      },
      false,
    ],
    ["site.yaml turns GitHub on", () => (site.features = { regenerate: undefined, github: "on" }), true],
  ])("when %s: shown is %s", (_, arrange, shown) => {
    arrange();
    renderAt(["/projects/benzo"]);
    for (const panel of panels()) {
      if (shown) expect(panel).toBeInTheDocument();
      else expect(panel).not.toBeInTheDocument();
    }
  });

  it("hides them for an owner the API doesn't serve", () => {
    githubServed();
    useContentStore.setState({
      projects: [{ ...BENZO, github: "https://github.com/someone-else/benzo" } as Project],
    });
    renderAt(["/projects/benzo"]);
    for (const panel of panels()) expect(panel).not.toBeInTheDocument();
  });
});
