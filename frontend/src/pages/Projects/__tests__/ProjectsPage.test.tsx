import { afterEach, describe, expect, it, vi } from "vitest";
import site from "virtual:site-config";
import { useContentStore } from "../../../store";
import {
  fireEvent,
  renderWithProviders,
  screen,
  waitFor,
} from "../../../test/utils";
import { makeProject } from "../../../test/builders";
import { ProjectsPage } from "../ProjectsPage";

// Restored after each test, so a stubbed action can't leak into the next.
const INITIAL = useContentStore.getState();

describe("ProjectsPage when the content failed to load", () => {
  afterEach(() => {
    useContentStore.setState(INITIAL, true);
    // Helmet never clears the title, so a test reading it starts from none.
    document.title = "";
  });

  it("names the file that didn't load, and retries the projects alone (#190 M23)", () => {
    const reloadProjects = vi.fn();
    useContentStore.setState({
      projects: [],
      loads: { ...INITIAL.loads, projects: { error: "content/projects/index.yaml answered 500" } },
      reloadProjects,
    });
    renderWithProviders(<ProjectsPage />, { initialRoute: "/projects" });
    expect(screen.getByRole("alert")).toHaveTextContent(
      "the projects didn't load: content/projects/index.yaml answered 500.",
    );
    fireEvent.click(screen.getByRole("button", { name: /retry/i }));
    expect(reloadProjects).toHaveBeenCalled();
  });

  it("says when there's nothing to show, rather than loading forever (#190 M23)", () => {
    useContentStore.setState({ projects: [], loads: { ...INITIAL.loads, projects: "ready" } });
    renderWithProviders(<ProjectsPage />, { initialRoute: "/projects" });
    expect(screen.getByText("no projects yet.")).toBeInTheDocument();
    expect(screen.queryByRole("status", { name: /loading projects/i })).toBeNull();
  });

  it("holds the featured card's and the rows' places while it loads", () => {
    useContentStore.setState({ projects: [], loads: { ...INITIAL.loads, projects: "loading" } });
    const { container } = renderWithProviders(<ProjectsPage />, { initialRoute: "/projects" });
    expect(screen.getByRole("status", { name: /loading projects/i })).toBeInTheDocument();
    expect(container.querySelector(".skeleton-card.project-featured")).toBeInTheDocument();
    expect(container.querySelectorAll(".project-rows .skeleton-row").length).toBeGreaterThan(0);
  });

  it("shows the featured project first and larger, then every other one as a row", () => {
    const project = (id: string, featured = false) =>
      makeProject({ id, title: `Project ${id}`, url: `https://${id}.example`, icon: "x", featured });
    useContentStore.setState({
      projects: [project("a"), project("star", true), project("b"), project("c"), project("d")],
      loads: { ...INITIAL.loads, projects: "ready" },
    });
    renderWithProviders(<ProjectsPage />, { initialRoute: "/projects" });

    // Under the page's h1, the projects are h2s.
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(site.page_copy.projects.heading);
    expect(screen.getByText(site.page_copy.projects.eyebrow)).toBeInTheDocument();
    expect(
      screen.getAllByRole("heading", { level: 2 }).map((heading) => heading.textContent),
    ).toEqual(["x Project star", "x Project a", "x Project b", "x Project c", "x Project d"]);
    expect(screen.queryByRole("searchbox")).not.toBeInTheDocument();
  });

  it("ends with the rest on GitHub: site.yaml's link, in a new tab", () => {
    // In place of the GitHub card it once listed as a project.
    useContentStore.setState({
      projects: [makeProject({ id: "a", title: "Project a" })],
      loads: { ...INITIAL.loads, projects: "ready" },
    });
    renderWithProviders(<ProjectsPage />, { initialRoute: "/projects" });
    const github = site.socials.find((social) => social.icon === "github")!;
    const link = screen.getByRole("link", { name: site.page_copy.projects.github_link });
    expect(link).toHaveAttribute("href", github.url);
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("names the page in the tab while it loads, not only once it has", async () => {
    useContentStore.setState({ projects: [], loads: { ...INITIAL.loads, projects: "loading" } });
    renderWithProviders(<ProjectsPage />, { initialRoute: "/projects" });
    await waitFor(() => expect(document.title).toMatch(/^projects \|/));
  });
});
