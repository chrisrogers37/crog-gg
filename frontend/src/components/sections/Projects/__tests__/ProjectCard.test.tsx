import { describe, it, expect } from "vitest";
import { renderWithProviders, screen } from "../../../../test/utils";
import { ProjectCard } from "../ProjectCard";
import { Project } from "../../../../types";

const mockProject: Project = {
  id: "test",
  title: "Test Project",
  description: "A test project description",
  url: "https://example.com",
  icon: "\u{1F680}",
  category: "web-app",
  technologies: ["React", "TypeScript"],
  status: "active",
  gradient: "linear-gradient(135deg, #000 0%, #333 100%)",
};

// The card is a router link, so it renders inside the app's providers.
const renderCard = (project: Project) =>
  renderWithProviders(<ProjectCard project={project} />);

describe("ProjectCard", () => {
  it("renders project title and description", () => {
    renderCard(mockProject);
    expect(screen.getByText("Test Project")).toBeInTheDocument();
    expect(screen.getByText("A test project description")).toBeInTheDocument();
  });

  it("renders the icon as the emoji it is", () => {
    const { container } = renderCard(mockProject);
    expect(container.querySelector(".project-tile-icon")).toHaveTextContent(
      "\u{1F680}",
    );
  });

  it("renders technology pills", () => {
    renderCard(mockProject);
    expect(screen.getByText("React")).toBeInTheDocument();
    expect(screen.getByText("TypeScript")).toBeInTheDocument();
  });

  it("limits tech pills to 3 with overflow indicator", () => {
    const manyTech = {
      ...mockProject,
      technologies: ["React", "TypeScript", "Node", "Python", "Go"],
    };
    renderCard(manyTech);
    expect(screen.getByText("React")).toBeInTheDocument();
    expect(screen.getByText("TypeScript")).toBeInTheDocument();
    expect(screen.getByText("Node")).toBeInTheDocument();
    expect(screen.queryByText("Python")).not.toBeInTheDocument();
    expect(screen.getByText("+2")).toBeInTheDocument();
  });

  it("does not render tech pills when technologies is empty", () => {
    const projectNoTech = { ...mockProject, technologies: [] };
    const { container } = renderCard(projectNoTech);
    expect(
      container.querySelector(".project-tile-tech"),
    ).not.toBeInTheDocument();
  });

  it("opens the project's page on the site", () => {
    renderCard(mockProject);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/projects/test");
    expect(link).not.toHaveAttribute("target");
  });

  it("uses fallback gradient when gradient is undefined", () => {
    const projectNoGradient = { ...mockProject, gradient: undefined };
    const { container } = renderCard(projectNoGradient);
    const headerDiv = container.querySelector(".project-tile-header");
    expect(headerDiv).toHaveStyle({
      background: "linear-gradient(135deg, #6B7280 0%, #374151 100%)",
    });
  });

  it("renders tile with correct class structure", () => {
    const { container } = renderCard(mockProject);
    expect(container.firstChild).toHaveClass("project-tile");
    expect(container.querySelector(".project-tile-header")).toBeInTheDocument();
    expect(container.querySelector(".project-tile-body")).toBeInTheDocument();
    expect(container.querySelector(".project-tile-title")).toBeInTheDocument();
  });
});
