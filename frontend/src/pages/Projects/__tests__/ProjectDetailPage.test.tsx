import { act, fireEvent, render, screen } from "@testing-library/react";
import { HelmetProvider } from "react-helmet-async";
import { createMemoryRouter } from "react-router";
import { RouterProvider } from "react-router/dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useContentStore } from "../../../store";
import { githubService, type Repository } from "../../../services/githubService";
import type { Project } from "../../../types";
import { ProjectDetailPage } from "../ProjectDetailPage";

// Restored after each test, so a stubbed action can't leak into the next.
const INITIAL = useContentStore.getState();
afterEach(() => {
  useContentStore.setState(INITIAL, true);
});

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
        url: `https://github.com/owner/${id}`,
      }) as Project;
    useContentStore.setState({
      projects: [project("alpha"), project("beta")],
      isLoading: false,
      error: null,
    });
    // alpha's answer can't be read at all, so its stats section crashes
    // however RepoStats lays the figures out; beta's answer is whole.
    const unreadable = new Proxy(
      {},
      {
        // Not a thenable, so the promise resolves to it.
        get: (_, field) =>
          field === "then"
            ? undefined
            : (() => {
                throw new Error("unreadable answer");
              })(),
      },
    ) as Repository;
    vi.spyOn(githubService, "getRepository").mockImplementation(async (name) =>
      name === "alpha"
        ? unreadable
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

    const router = renderAt(["/projects/alpha"]);
    expect(
      await screen.findByText(/something went wrong loading this section/i),
    ).toBeInTheDocument();

    await act(() => router.navigate("/projects/beta"));
    expect(await screen.findByText("222")).toBeInTheDocument();
    expect(
      screen.queryByText(/something went wrong loading this section/i),
    ).not.toBeInTheDocument();
    vi.restoreAllMocks();
  });
});
