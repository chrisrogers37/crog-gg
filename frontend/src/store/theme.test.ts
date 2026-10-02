import { afterEach, describe, expect, it, vi } from "vitest";
import { applyTheme } from "./theme";

const root = document.documentElement;

afterEach(() => {
  root.classList.remove("dark");
});

describe("applyTheme", () => {
  it("puts dark and light on the page", () => {
    applyTheme("dark");
    expect(root).toHaveClass("dark");
    applyTheme("light");
    expect(root).not.toHaveClass("dark");
  });

  it("takes the OS setting under system, as it is when applied", () => {
    vi.mocked(window.matchMedia).mockReturnValueOnce({
      matches: true,
    } as MediaQueryList);
    applyTheme("system");
    expect(root).toHaveClass("dark");

    vi.mocked(window.matchMedia).mockReturnValueOnce({
      matches: false,
    } as MediaQueryList);
    applyTheme("system");
    expect(root).not.toHaveClass("dark");
  });
});
