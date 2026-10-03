import { describe, it, expect, vi } from "vitest";
import { fireEvent, renderWithProviders, screen, within } from "../../../../test/utils";
import { CLAUDLOBBY_REPO } from "../../../../content/links";
import { track } from "../../../../services/analytics";
import { FeaturedProject } from "../FeaturedProject";
import { ProjectRow } from "../ProjectRow";
import type { Project } from "../../../../types";
import { makeProject } from "../../../../test/builders";

const mockProject = makeProject({
  id: "test",
  title: "Test Project",
  description: "A test project description",
  github: "https://github.com/someone/test",
  technologies: ["React", "TypeScript"],
  status: "active",
});

vi.mock("../../../../services/analytics", () => ({ track: vi.fn() }));

// The row is a router link in a list, so it renders inside the app's
// providers, in a list.
const renderRow = (project: Project, headingLevel?: 2 | 3) =>
  renderWithProviders(
    <ul>
      <ProjectRow project={project} headingLevel={headingLevel} />
    </ul>,
  );

describe("ProjectRow", () => {
  it("titles itself with a link to the project's page, named by the title alone", () => {
    renderRow(mockProject);
    const heading = screen.getByRole("heading", { level: 3, name: "Test Project" });
    const link = within(heading).getByRole("link", { name: "Test Project" });
    expect(link).toHaveAttribute("href", "/projects/test");
    expect(link).not.toHaveAttribute("target");
  });

  it("titles itself at the level the page asks for", () => {
    renderRow(mockProject, 2);
    expect(screen.getByRole("heading", { level: 2, name: "Test Project" })).toBeInTheDocument();
  });

  it("gives the whole description", () => {
    renderRow(mockProject);
    expect(screen.getByText("A test project description")).toBeInTheDocument();
  });

  it("says what it's built with, every technology, in one line", () => {
    const { container } = renderRow({
      ...mockProject,
      technologies: ["React", "TypeScript", "Node", "Python", "Go"],
    });
    expect(container.querySelector(".project-row-tech")).toHaveTextContent(
      "built with React · TypeScript · Node · Python · Go",
    );
  });

  it("says nothing of technologies when it lists none", () => {
    const { container } = renderRow({ ...mockProject, technologies: [] });
    expect(container.querySelector(".project-row-tech")).not.toBeInTheDocument();
  });

  it("names a status only when it isn't active", () => {
    renderRow(mockProject);
    expect(screen.queryByText("active")).not.toBeInTheDocument();
  });

  it("names an experimental or archived project's status, outside its title", () => {
    renderRow({ ...mockProject, status: "archived" });
    expect(screen.getByText("archived")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Test Project" })).toBeInTheDocument();
  });
});

describe("FeaturedProject", () => {
  const featured = { ...mockProject, featured: true };

  it("says it's featured, and titles itself", () => {
    renderWithProviders(<FeaturedProject project={featured} />);
    expect(screen.getByText("featured project")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 3, name: /Test Project/ })).toBeInTheDocument();
    expect(screen.getByRole("article", { name: /Test Project/ })).toBeInTheDocument();
  });

  it("names every technology, not three", () => {
    renderWithProviders(
      <FeaturedProject
        project={{ ...featured, technologies: ["A", "B", "C", "D", "E"] }}
      />,
    );
    const pills = screen.getByRole("list", { name: "Built with" });
    expect(within(pills).getAllByRole("listitem")).toHaveLength(5);
  });

  it("opens the project's page, and its repo in a new tab", () => {
    renderWithProviders(<FeaturedProject project={featured} />);
    expect(screen.getByRole("link", { name: "view project" })).toHaveAttribute(
      "href",
      "/projects/test",
    );
    const repo = screen.getByRole("link", { name: "GitHub" });
    expect(repo).toHaveAttribute("href", "https://github.com/someone/test");
    expect(repo).toHaveAttribute("target", "_blank");
    expect(repo).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("has no repo link when the project names no repo", () => {
    renderWithProviders(<FeaturedProject project={{ ...featured, github: undefined }} />);
    expect(screen.queryByRole("link", { name: "GitHub" })).not.toBeInTheDocument();
  });

  it("counts a click into Claudlobby's repo, from the featured card (#177)", () => {
    renderWithProviders(<FeaturedProject project={{ ...featured, github: CLAUDLOBBY_REPO }} />);
    const repo = screen.getByRole("link", { name: "GitHub" });
    expect(repo).toHaveAttribute("href", CLAUDLOBBY_REPO);
    expect(repo).toHaveAttribute("rel", "noopener noreferrer");
    fireEvent.click(repo);
    expect(vi.mocked(track).mock.calls).toEqual([[{ name: "repo_click", location: "featured" }]]);
  });

  it("counts no other repo: the events are Claudlobby's", () => {
    renderWithProviders(<FeaturedProject project={featured} />);
    fireEvent.click(screen.getByRole("link", { name: "GitHub" }));
    expect(track).not.toHaveBeenCalled();
  });
});
