import { fireEvent, render, screen } from "@testing-library/react";
import { HelmetProvider } from "react-helmet-async";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useContentStore } from "../../../store";
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
