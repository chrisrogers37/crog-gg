import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { ProjectDemo } from "../ProjectDemo";

describe("ProjectDemo", () => {
  it("expands the existing iframe into a modal and restores focus when cancelled", async () => {
    const user = userEvent.setup();
    render(<ProjectDemo url="https://demo.example.org" title="Example project" />);
    const iframe = screen.getByTitle("Example project");
    const toggle = screen.getByRole("button", { name: "fullscreen" });
    expect(toggle).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByRole("dialog")).toHaveAttribute("aria-modal", "false");
    expect(screen.queryByRole("heading")).toBeNull();

    await user.click(toggle);
    const dialog = screen.getByRole("dialog", { name: "Example project demo" });
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(toggle).toHaveFocus();
    expect(toggle).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByTitle("Example project")).toBe(iframe);

    fireEvent(dialog, new Event("cancel", { cancelable: true }));
    expect(dialog).toHaveAttribute("aria-modal", "false");
    expect(toggle).toHaveAttribute("aria-pressed", "false");
    expect(toggle).toHaveFocus();
    expect(screen.getByTitle("Example project")).toBe(iframe);
    expect(document.body.style.overflow).toBe("");
  });
});
