import { describe, it, expect } from "vitest";
import { renderWithProviders, screen, within } from "../../../../test/utils";
import { FeaturedProject } from "../FeaturedProject";
import { ProjectCard } from "../ProjectCard";
import { Project } from "../../../../types";

const mockProject: Project = {
  id: "test",
  title: "Test Project",
  description: "A test project description",
  url: "https://example.com",
  github: "https://github.com/someone/test",
  icon: "\u{1F680}",
  category: "web-app",
  technologies: ["React", "TypeScript"],
  status: "active",
  featured: false,
};

// The card is a router link, so it renders inside the app's providers.
const renderCard = (project: Project, headingLevel?: 2 | 3) =>
  renderWithProviders(<ProjectCard project={project} headingLevel={headingLevel} />);

describe("ProjectCard", () => {
  it("renders project title and description", () => {
    renderCard(mockProject);
    expect(screen.getByRole("heading", { level: 3, name: "Test Project" })).toBeInTheDocument();
    expect(screen.getByText("A test project description")).toBeInTheDocument();
  });

  it("titles itself at the level the page asks for", () => {
    renderCard(mockProject, 2);
    expect(screen.getByRole("heading", { level: 2, name: "Test Project" })).toBeInTheDocument();
  });

  it("renders the icon as the emoji it is, hidden from screen readers", () => {
    const { container } = renderCard(mockProject);
    const icon = container.querySelector(".project-card-icon");
    expect(icon).toHaveTextContent("\u{1F680}");
    expect(icon).toHaveAttribute("aria-hidden", "true");
  });

  it("sets the icon on the project's own colour, or the site's grey without one", () => {
    const gradient = "linear-gradient(135deg, #000 0%, #333 100%)";
    const { container, unmount } = renderCard({ ...mockProject, gradient });
    expect(container.querySelector(".project-card-icon")).toHaveStyle({ background: gradient });
    unmount();

    const plain = renderCard(mockProject).container.querySelector(".project-card-icon");
    expect(plain).not.toHaveAttribute("style", expect.stringContaining("gradient"));
  });

  it("renders technology pills", () => {
    renderCard(mockProject);
    const pills = screen.getByRole("list", { name: "Built with" });
    expect(within(pills).getAllByRole("listitem").map((item) => item.textContent)).toEqual([
      "React",
      "TypeScript",
    ]);
  });

  it("limits tech pills to 3 with overflow indicator", () => {
    renderCard({
      ...mockProject,
      technologies: ["React", "TypeScript", "Node", "Python", "Go"],
    });
    const pills = screen.getByRole("list", { name: "Built with" });
    expect(within(pills).getAllByRole("listitem").map((item) => item.textContent)).toEqual([
      "React",
      "TypeScript",
      "Node",
      "+2",
    ]);
  });

  it("does not render tech pills when technologies is empty", () => {
    renderCard({ ...mockProject, technologies: [] });
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
  });

  it("names a status only when it isn't active", () => {
    renderCard(mockProject);
    expect(screen.queryByText("active")).not.toBeInTheDocument();
  });

  it("names an experimental or archived project's status", () => {
    renderCard({ ...mockProject, status: "archived" });
    expect(screen.getByText("archived")).toBeInTheDocument();
  });

  it("opens the project's page on the site", () => {
    renderCard(mockProject);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/projects/test");
    expect(link).not.toHaveAttribute("target");
  });
});

describe("FeaturedProject", () => {
  const featured = { ...mockProject, featured: true };

  it("says it's featured, and titles itself", () => {
    renderWithProviders(<FeaturedProject project={featured} />);
    expect(screen.getByText("Featured project")).toBeInTheDocument();
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
    expect(screen.getByRole("link", { name: "View project" })).toHaveAttribute(
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
});
