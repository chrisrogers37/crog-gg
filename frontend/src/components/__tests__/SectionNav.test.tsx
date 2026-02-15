import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import SectionNav from "../SectionNav";

describe("SectionNav", () => {
  it("renders all section buttons", () => {
    render(<SectionNav activeSection="" onSectionChange={vi.fn()} />);
    expect(screen.getByRole("tab", { name: "About" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Journey" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Projects" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Music" })).toBeInTheDocument();
  });

  it("marks active section button as selected", () => {
    render(<SectionNav activeSection="projects" onSectionChange={vi.fn()} />);
    const projectsBtn = screen.getByRole("tab", { name: "Projects" });
    expect(projectsBtn).toHaveAttribute("aria-selected", "true");
    expect(projectsBtn).toHaveClass("active");
  });

  it("calls onSectionChange when button clicked", () => {
    const onChange = vi.fn();
    render(<SectionNav activeSection="" onSectionChange={onChange} />);
    fireEvent.click(screen.getByRole("tab", { name: "Journey" }));
    expect(onChange).toHaveBeenCalledWith("journey");
  });

  it("calls onSectionChange with empty string when active section clicked", () => {
    const onChange = vi.fn();
    render(<SectionNav activeSection="journey" onSectionChange={onChange} />);
    fireEvent.click(screen.getByRole("tab", { name: "Journey" }));
    expect(onChange).toHaveBeenCalledWith("");
  });

  it("does not scroll on initial render", () => {
    render(<SectionNav activeSection="about" onSectionChange={vi.fn()} />);
    expect(Element.prototype.scrollIntoView).not.toHaveBeenCalled();
  });

  it("scrolls active button into view when activeSection changes", () => {
    const { rerender } = render(
      <SectionNav activeSection="about" onSectionChange={vi.fn()} />,
    );
    vi.mocked(Element.prototype.scrollIntoView).mockClear();

    rerender(<SectionNav activeSection="music" onSectionChange={vi.fn()} />);
    expect(Element.prototype.scrollIntoView).toHaveBeenCalledWith({
      behavior: "smooth",
      inline: "nearest",
      block: "nearest",
    });
  });

  it("supports keyboard navigation between tabs", () => {
    render(<SectionNav activeSection="about" onSectionChange={vi.fn()} />);
    const aboutBtn = screen.getByRole("tab", { name: "About" });
    aboutBtn.focus();

    fireEvent.keyDown(aboutBtn.parentElement!, { key: "ArrowRight" });
    expect(screen.getByRole("tab", { name: "Journey" })).toHaveFocus();
  });
});
