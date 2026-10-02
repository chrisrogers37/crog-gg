import { afterEach, describe, expect, it, vi } from "vitest";
import { useContentStore } from "../../../../store";
import { fireEvent, renderWithProviders, screen } from "../../../../test/utils";
import type { Project } from "../../../../types";
import { Projects } from "../Projects";

/** The Projects tab shows its own load (#190 M23). */

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

  it("shows the projects once they're in", () => {
    const project = {
      id: "a",
      title: "A Project",
      description: "d",
      url: "https://a.example",
      icon: "x",
      category: "c",
      technologies: [],
    } as Project;
    useContentStore.setState({ projects: [project], loads: loads("ready") });
    renderWithProviders(<Projects />);
    expect(screen.getByText("A Project")).toBeInTheDocument();
  });
});
