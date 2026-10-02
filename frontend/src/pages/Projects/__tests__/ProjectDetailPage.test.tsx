import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { HelmetProvider } from "react-helmet-async";
import { createMemoryRouter } from "react-router";
import { RouterProvider } from "react-router/dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import site from "virtual:site-config";
import { useContentStore, useUIStore } from "../../../store";
import { githubService, type Repository } from "../../../services/githubService";
import type { Project } from "../../../types";
import { makeProject } from "../../../test/builders";
import { claudlobby } from "../../../content/claudlobby";
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

const BENZO = makeProject({ id: "benzo", title: "Benzo", url: "https://benzo.example" });

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
    const loading = screen.getByRole("status", { name: /loading project/i });
    expect(screen.queryByText(/project not found/i)).not.toBeInTheDocument();
    // The breadcrumbs' row held, so the hero lands where its stand-in stood,
    // and the standard hero's lines.
    expect(loading.querySelector(":scope > .breadcrumbs")).not.toBeNull();
    expect(loading.querySelector(".page-skeleton--headline")).not.toBeNull();
    expect(loading.querySelector(".cl-hero--loading")).toBeNull();
  });

  it("stands a page of its own's hero in its own look while it loads", () => {
    // Claudlobby's: its charcoal panel and mark already, around the same
    // lines, so a direct visit doesn't flash from the light bars to it.
    renderAt(["/projects/claudlobby"]);
    const loading = screen.getByRole("status", { name: /loading project/i });
    const hero = loading.querySelector(".cl-hero--loading");
    expect(hero).not.toBeNull();
    expect(hero!.querySelector(".page-skeleton--headline")).not.toBeNull();
    expect(hero!.querySelector("img.cl-mark")).not.toBeNull();
  });

  it("offers a retry when the projects failed to load, naming the file (#190 M23)", () => {
    const reloadProjects = vi.fn();
    useContentStore.setState({
      projects: [],
      loads: { ...INITIAL.loads, projects: { error: "content/projects/benzo.yaml has 1 problem(s)" } },
      reloadProjects,
    });
    renderAt(["/projects/benzo"]);
    expect(screen.getByRole("alert")).toHaveTextContent(
      "The projects didn't load: content/projects/benzo.yaml has 1 problem(s).",
    );
    fireEvent.click(screen.getByRole("button", { name: /retry/i }));
    expect(reloadProjects).toHaveBeenCalled();
    expect(screen.queryByText(/project not found/i)).not.toBeInTheDocument();
  });

  it("says 'Project Not Found' only for a loaded list without the slug", () => {
    useContentStore.setState({ projects: [BENZO], loads: { ...INITIAL.loads, projects: "ready" } });
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
    useContentStore.setState({ projects: [BENZO], loads: { ...INITIAL.loads, projects: "ready" } });
  });

  it("goes to /projects when the page was opened directly", () => {
    const router = renderAt(["/projects/benzo"]);
    fireEvent.click(screen.getByRole("button", { name: /go back/i }));
    expect(router.state.location.pathname).toBe("/projects");
  });

  it("goes back when there's a page of ours to go back to", () => {
    const router = renderAt(["/", "/projects/benzo"]);
    fireEvent.click(screen.getByRole("button", { name: /go back/i }));
    expect(router.state.location.pathname).toBe("/");
  });
});

/**
 * A project content/ownPages.ts lists gets its own page in place of the
 * standard one. site:check lets its repo be any owner's because that page
 * shows no GitHub panels, so this holds it to that.
 */
describe("A project with a page of its own", () => {
  it("renders that page under the breadcrumbs, and asks GitHub for nothing", () => {
    useContentStore.setState({
      projects: [
        makeProject({
          id: "claudlobby",
          title: "Claudlobby",
          github: "https://github.com/Claudfather/Claudlobby",
          featured: true,
        }),
      ],
      loads: { ...INITIAL.loads, projects: "ready" },
    });
    githubServed();
    const getRepository = vi
      .spyOn(githubService, "getRepository")
      .mockRejectedValue(new Error("offline"));
    const getReadme = vi.spyOn(githubService, "getReadme").mockRejectedValue(new Error("offline"));
    renderAt(["/projects/claudlobby"]);

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(claudlobby.hero.headline);
    expect(screen.getByRole("navigation", { name: "Breadcrumb" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /^(repository|readme)$/i })).toBeNull();
    expect(getRepository).not.toHaveBeenCalled();
    expect(getReadme).not.toHaveBeenCalled();
  });
});

/**
 * Each project's page starts fresh: the page is keyed by project, so a crashed
 * section (or another project's figures) doesn't carry over (#196 M68).
 */
describe("ProjectDetailPage across projects", () => {
  it("doesn't carry a crashed section over to the next project", async () => {
    const project = (id: string): Project => ({
      ...BENZO,
      id,
      title: id,
      url: `https://github.com/${OWNER}/${id}`,
    });
    useContentStore.setState({
      projects: [project("alpha"), project("beta")],
      loads: { ...INITIAL.loads, projects: "ready" },
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
    // The README's chunk loads on its own, so its fetch follows.
    await waitFor(() => expect(githubService.getReadme).toHaveBeenCalledWith(OWNER, "alpha"));

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
  const LINKED: Project = { ...BENZO, github: `https://github.com/${OWNER.toUpperCase()}/benzo` };
  const panels = () => [
    screen.queryByRole("heading", { name: /^repository$/i }),
    screen.queryByRole("heading", { name: /^readme$/i }),
  ];

  beforeEach(() => {
    useContentStore.setState({ projects: [LINKED], loads: { ...INITIAL.loads, projects: "ready" } });
    vi.spyOn(githubService, "getRepository").mockReturnValue(new Promise(() => {}));
    vi.spyOn(githubService, "getReadme").mockReturnValue(new Promise(() => {}));
  });
  afterEach(() => vi.restoreAllMocks());

  it.each([
    // As on a deployment that serves them, so a deep link doesn't shift.
    ["the API hasn't answered yet", () => {}, true],
    [
      "the API couldn't answer",
      () => useUIStore.setState({ features: { regenerate: false, github: false } }),
      false,
    ],
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
      projects: [{ ...BENZO, github: "https://github.com/someone-else/benzo" }],
    });
    renderAt(["/projects/benzo"]);
    for (const panel of panels()) expect(panel).not.toBeInTheDocument();
  });
});
