import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import SectionNav from "../SectionNav";

describe("SectionNav", () => {
  it("renders all section buttons", () => {
    render(<SectionNav activeSection="about" onSelect={vi.fn()} />);
    expect(screen.getByRole("tab", { name: "About" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Journey" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Projects" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Music" })).toBeInTheDocument();
  });

  it("points every tab at the one section panel", () => {
    render(<SectionNav activeSection="about" onSelect={() => {}} />);
    for (const tab of screen.getAllByRole("tab")) {
      expect(tab).toHaveAttribute("aria-controls", "section-panel");
      expect(tab.id).toMatch(/^section-tab-/);
    }
  });

  it("marks active section button as selected", () => {
    render(<SectionNav activeSection="projects" onSelect={vi.fn()} />);
    const projectsBtn = screen.getByRole("tab", { name: "Projects" });
    expect(projectsBtn).toHaveAttribute("aria-selected", "true");
    expect(projectsBtn).toHaveClass("active");
  });

  it("reports the clicked tab, highlighted or not, and leaves the rest to the page", () => {
    const onSelect = vi.fn();
    render(<SectionNav activeSection="about" onSelect={onSelect} />);
    fireEvent.click(screen.getByRole("tab", { name: "Journey" }));
    fireEvent.click(screen.getByRole("tab", { name: "About" }));
    expect(onSelect.mock.calls).toEqual([["journey"], ["about"]]);
  });

  it("does not scroll on initial render", () => {
    render(<SectionNav activeSection="about" onSelect={vi.fn()} />);
    expect(Element.prototype.scrollIntoView).not.toHaveBeenCalled();
  });

  it("scrolls active button into view when activeSection changes", () => {
    const { rerender } = render(
      <SectionNav activeSection="about" onSelect={vi.fn()} />,
    );
    vi.mocked(Element.prototype.scrollIntoView).mockClear();

    rerender(<SectionNav activeSection="music" onSelect={vi.fn()} />);
    expect(Element.prototype.scrollIntoView).toHaveBeenCalledWith({
      behavior: "smooth",
      inline: "nearest",
      block: "nearest",
    });
  });

  it("supports keyboard navigation between tabs", () => {
    render(<SectionNav activeSection="about" onSelect={vi.fn()} />);
    const aboutBtn = screen.getByRole("tab", { name: "About" });
    aboutBtn.focus();

    fireEvent.keyDown(aboutBtn.parentElement!, { key: "ArrowRight" });
    expect(screen.getByRole("tab", { name: "Journey" })).toHaveFocus();
  });
});
