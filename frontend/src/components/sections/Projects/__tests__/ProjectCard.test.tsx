import { render, screen } from "@testing-library/react";
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

  it("applies featured class when featured prop is true", () => {
    const { container } = render(
      <ProjectCard project={mockProject} featured />,
    );
    expect(container.firstChild).toHaveClass("project-card-featured");
  });

  it("does not apply featured class by default", () => {
    const { container } = render(<ProjectCard project={mockProject} />);
    expect(container.firstChild).not.toHaveClass("project-card-featured");
  });

  it("renders status badge", () => {
    render(<ProjectCard project={mockProject} />);
    expect(screen.getByText("active")).toBeInTheDocument();
  });

  it("does not render status badge when status is undefined", () => {
    const projectWithoutStatus = { ...mockProject, status: undefined };
    render(<ProjectCard project={projectWithoutStatus} />);
    expect(screen.queryByText("active")).not.toBeInTheDocument();
  });

  it("does not render tech pills when technologies is empty", () => {
    const projectNoTech = { ...mockProject, technologies: [] };
    const { container } = render(<ProjectCard project={projectNoTech} />);
    expect(
      container.querySelector(".project-card-tech"),
    ).not.toBeInTheDocument();
  });

  it("renders as a link to the project url", () => {
    render(<ProjectCard project={mockProject} />);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "https://example.com");
    expect(link).toHaveAttribute("target", "_blank");
  });

  it("uses fallback gradient when gradient is undefined", () => {
    const projectNoGradient = { ...mockProject, gradient: undefined };
    const { container } = render(<ProjectCard project={projectNoGradient} />);
    const imageDiv = container.querySelector(".project-card-image");
    expect(imageDiv).toHaveStyle({
      background: "linear-gradient(135deg, #6B7280 0%, #374151 100%)",
    });
  });
});
