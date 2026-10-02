import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import SectionNav from "../SectionNav";

describe("SectionNav", () => {
  it("renders all section buttons", () => {
    render(<SectionNav expanded={false} activeSection="" onSectionChange={vi.fn()} />);
    expect(screen.getByRole("tab", { name: "About" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Journey" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Projects" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Music" })).toBeInTheDocument();
  });

  it("points every tab at the one section panel", () => {
    render(<SectionNav expanded={false} activeSection="" onSectionChange={() => {}} />);
    for (const tab of screen.getAllByRole("tab")) {
      expect(tab).toHaveAttribute("aria-controls", "section-panel");
      expect(tab.id).toMatch(/^section-tab-/);
    }
  });

  it("marks active section button as selected", () => {
    render(<SectionNav expanded={false} activeSection="projects" onSectionChange={vi.fn()} />);
    const projectsBtn = screen.getByRole("tab", { name: "Projects" });
    expect(projectsBtn).toHaveAttribute("aria-selected", "true");
    expect(projectsBtn).toHaveClass("active");
  });

  it("calls onSectionChange when button clicked", () => {
    const onChange = vi.fn();
    render(<SectionNav expanded={false} activeSection="" onSectionChange={onChange} />);
    fireEvent.click(screen.getByRole("tab", { name: "Journey" }));
    expect(onChange).toHaveBeenCalledWith("journey");
  });

  it("collapses the open section when its tab is clicked again", () => {
    const onChange = vi.fn();
    render(
      <SectionNav expanded activeSection="journey" onSectionChange={onChange} />,
    );
    fireEvent.click(screen.getByRole("tab", { name: "Journey" }));
    expect(onChange).toHaveBeenCalledWith("");
  });

  it("opens the highlighted tab when it is only previewed (#196 M66)", () => {
    const onChange = vi.fn();
    render(
      <SectionNav
        expanded={false}
        activeSection="about"
        onSectionChange={onChange}
      />,
    );
    fireEvent.click(screen.getByRole("tab", { name: "About" }));
    expect(onChange).toHaveBeenCalledWith("about");
  });

  it("does not scroll on initial render", () => {
    render(<SectionNav expanded={false} activeSection="about" onSectionChange={vi.fn()} />);
    expect(Element.prototype.scrollIntoView).not.toHaveBeenCalled();
  });

  it("scrolls active button into view when activeSection changes", () => {
    const { rerender } = render(
      <SectionNav expanded={false} activeSection="about" onSectionChange={vi.fn()} />,
    );
    vi.mocked(Element.prototype.scrollIntoView).mockClear();

    rerender(<SectionNav expanded={false} activeSection="music" onSectionChange={vi.fn()} />);
    expect(Element.prototype.scrollIntoView).toHaveBeenCalledWith({
      behavior: "smooth",
      inline: "nearest",
      block: "nearest",
    });
  });

  it("supports keyboard navigation between tabs", () => {
    render(<SectionNav expanded={false} activeSection="about" onSectionChange={vi.fn()} />);
    const aboutBtn = screen.getByRole("tab", { name: "About" });
    aboutBtn.focus();

    fireEvent.keyDown(aboutBtn.parentElement!, { key: "ArrowRight" });
    expect(screen.getByRole("tab", { name: "Journey" })).toHaveFocus();
  });
});
