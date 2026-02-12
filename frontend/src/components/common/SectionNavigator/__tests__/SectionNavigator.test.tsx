import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { SectionNavigator } from "../SectionNavigator";

describe("SectionNavigator", () => {
  it("renders next section label", () => {
    render(<SectionNavigator nextSection="journey" onNavigate={vi.fn()} />);
    expect(screen.getByText(/up next: journey/i)).toBeInTheDocument();
  });

  it("calls onNavigate when clicked", () => {
    const onNavigate = vi.fn();
    render(<SectionNavigator nextSection="journey" onNavigate={onNavigate} />);
    fireEvent.click(screen.getByRole("button"));
    expect(onNavigate).toHaveBeenCalledWith("journey");
  });

  it("returns null when nextSection is null", () => {
    const { container } = render(
      <SectionNavigator nextSection={null} onNavigate={vi.fn()} />,
    );
    expect(container.firstChild).toBeNull();
  });
});
