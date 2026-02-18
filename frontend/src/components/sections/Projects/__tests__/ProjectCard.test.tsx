import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect } from "vitest";
import { ProjectCard } from "../ProjectCard";
import { Project } from "../../../../types";

const mockProject: Project = {
  id: "test",
  title: "Test Project",
  description: "A test project description",
  url: "https://example.com",
  icon: "fas fa-code",
  category: "web-app",
  technologies: ["React", "TypeScript"],
  featured: false,
  order: 1,
  status: "active",
  gradient: "linear-gradient(135deg, #000 0%, #333 100%)",
};

describe("ProjectCard", () => {
  it("renders project title and description", () => {
    render(<ProjectCard project={mockProject} />);
    expect(screen.getByText("Test Project")).toBeInTheDocument();
    expect(screen.getByText("A test project description")).toBeInTheDocument();
  });

  it("renders technology pills", () => {
    render(<ProjectCard project={mockProject} />);
    expect(screen.getByText("React")).toBeInTheDocument();
    expect(screen.getByText("TypeScript")).toBeInTheDocument();
  });

  it("limits tech pills to 3 with overflow indicator", () => {
    const manyTech = {
      ...mockProject,
      technologies: ["React", "TypeScript", "Node", "Python", "Go"],
    };
    render(<ProjectCard project={manyTech} />);
    expect(screen.getByText("React")).toBeInTheDocument();
    expect(screen.getByText("TypeScript")).toBeInTheDocument();
    expect(screen.getByText("Node")).toBeInTheDocument();
    expect(screen.queryByText("Python")).not.toBeInTheDocument();
    expect(screen.getByText("+2")).toBeInTheDocument();
  });

  it("does not render tech pills when technologies is empty", () => {
    const projectNoTech = { ...mockProject, technologies: [] };
    const { container } = render(<ProjectCard project={projectNoTech} />);
    expect(
      container.querySelector(".project-tile-tech"),
    ).not.toBeInTheDocument();
  });

  it("renders as external link by default", () => {
    render(<ProjectCard project={mockProject} />);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "https://example.com");
    expect(link).toHaveAttribute("target", "_blank");
  });

  it("renders as internal link when linkTo is provided", () => {
    render(
      <MemoryRouter>
        <ProjectCard project={mockProject} linkTo="/projects/test" />
      </MemoryRouter>,
    );
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/projects/test");
    expect(link).not.toHaveAttribute("target");
  });

  it("uses fallback gradient when gradient is undefined", () => {
    const projectNoGradient = { ...mockProject, gradient: undefined };
    const { container } = render(<ProjectCard project={projectNoGradient} />);
    const headerDiv = container.querySelector(".project-tile-header");
    expect(headerDiv).toHaveStyle({
      background: "linear-gradient(135deg, #6B7280 0%, #374151 100%)",
    });
  });

  it("renders tile with correct class structure", () => {
    const { container } = render(<ProjectCard project={mockProject} />);
    expect(container.firstChild).toHaveClass("project-tile");
    expect(container.querySelector(".project-tile-header")).toBeInTheDocument();
    expect(container.querySelector(".project-tile-body")).toBeInTheDocument();
    expect(container.querySelector(".project-tile-title")).toBeInTheDocument();
  });
});
