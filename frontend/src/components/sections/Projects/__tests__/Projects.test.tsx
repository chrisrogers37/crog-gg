import { afterEach, describe, expect, it, vi } from "vitest";
import { useContentStore } from "../../../../store";
import { fireEvent, renderWithProviders, screen } from "../../../../test/utils";
import { makeProject } from "../../../../test/builders";
import { ProjectList } from "../Projects";

/** The home page's projects section shows its own load (#190 M23). */

const INITIAL = useContentStore.getState();
afterEach(() => useContentStore.setState(INITIAL, true));

const loads = (projects: (typeof INITIAL.loads)["projects"]) => ({
  ...INITIAL.loads,
  projects,
});

describe("ProjectList, as the home page's section", () => {
  it("shows a skeleton only while the projects load", () => {
    useContentStore.setState({ projects: [], loads: loads("loading") });
    renderWithProviders(<ProjectList limit={3} compact />);
    expect(screen.getByRole("status", { name: /loading projects/i })).toBeInTheDocument();
  });

  it("names the file that failed, and retries the projects alone", () => {
    const reloadProjects = vi.fn();
    useContentStore.setState({
      projects: [],
      loads: loads({ error: "content/projects/a.yaml has 1 problem(s)" }),
      reloadProjects,
    });
    renderWithProviders(<ProjectList limit={3} compact />);
    expect(screen.getByRole("alert")).toHaveTextContent(
      "the projects didn't load: content/projects/a.yaml has 1 problem(s).",
    );
    fireEvent.click(screen.getByRole("button", { name: /retry/i }));
    expect(reloadProjects).toHaveBeenCalled();
  });

  it("says when there are none, rather than loading forever", () => {
    useContentStore.setState({ projects: [], loads: loads("ready") });
    renderWithProviders(<ProjectList limit={3} compact />);
    expect(screen.getByText("no projects yet.")).toBeInTheDocument();
    expect(screen.queryByRole("status")).toBeNull();
  });

  it("shows the featured project, the next three in order, and a link to them all", () => {
    const project = (id: string, featured = false) =>
      makeProject({ id, title: `Project ${id}`, url: `https://${id}.example`, featured });
    useContentStore.setState({
      projects: [project("a"), project("b"), project("star", true), project("c"), project("d")],
      loads: loads("ready"),
    });
    renderWithProviders(<ProjectList limit={3} compact />);

    expect(screen.getByRole("article", { name: /Project star/ })).toBeInTheDocument();
    const cards = screen
      .getAllByRole("link")
      .filter((link) => link.classList.contains("project-row-link"))
      .map((link) => link.getAttribute("href"));
    expect(cards).toEqual(["/projects/a", "/projects/b", "/projects/c"]);
    expect(screen.getByRole("link", { name: "all projects" })).toHaveAttribute(
      "href",
      "/projects",
    );
  });
});
