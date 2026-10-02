import { afterEach, describe, expect, it, vi } from "vitest";
import { useContentStore } from "../../../../store";
import { fireEvent, renderWithProviders, screen } from "../../../../test/utils";
import type { Project } from "../../../../types";
import { Projects } from "../Projects";

/** The home page's projects section shows its own load (#190 M23). */

const INITIAL = useContentStore.getState();
afterEach(() => useContentStore.setState(INITIAL, true));

const loads = (projects: (typeof INITIAL.loads)["projects"]) => ({
  ...INITIAL.loads,
  projects,
});

describe("Projects", () => {
  it("shows a skeleton only while the projects load", () => {
    useContentStore.setState({ projects: [], loads: loads("loading") });
    renderWithProviders(<Projects />);
    expect(screen.getByRole("status", { name: /loading projects/i })).toBeInTheDocument();
  });

  it("names the file that failed, and retries the projects alone", () => {
    const reloadProjects = vi.fn();
    useContentStore.setState({
      projects: [],
      loads: loads({ error: "content/projects/a.yaml has 1 problem(s)" }),
      reloadProjects,
    });
    renderWithProviders(<Projects />);
    expect(screen.getByRole("alert")).toHaveTextContent(
      "The projects didn't load: content/projects/a.yaml has 1 problem(s).",
    );
    fireEvent.click(screen.getByRole("button", { name: /retry/i }));
    expect(reloadProjects).toHaveBeenCalled();
  });

  it("says when there are none, rather than loading forever", () => {
    useContentStore.setState({ projects: [], loads: loads("ready") });
    renderWithProviders(<Projects />);
    expect(screen.getByText("No projects yet.")).toBeInTheDocument();
    expect(screen.queryByRole("status")).toBeNull();
  });

  it("shows the featured project, the next three in order, and a link to them all", () => {
    const project = (id: string, featured = false) =>
      ({
        id,
        title: `Project ${id}`,
        description: "d",
        url: `https://${id}.example`,
        icon: "x",
        category: "c",
        technologies: [],
        featured,
      }) as Project;
    useContentStore.setState({
      projects: [project("a"), project("b"), project("star", true), project("c"), project("d")],
      loads: loads("ready"),
    });
    renderWithProviders(<Projects />);

    expect(screen.getByRole("article", { name: /Project star/ })).toBeInTheDocument();
    const cards = screen
      .getAllByRole("link")
      .filter((link) => link.classList.contains("project-card"))
      .map((link) => link.getAttribute("href"));
    expect(cards).toEqual(["/projects/a", "/projects/b", "/projects/c"]);
    expect(screen.getByRole("link", { name: "All projects" })).toHaveAttribute(
      "href",
      "/projects",
    );
  });
});
