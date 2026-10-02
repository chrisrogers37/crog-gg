import { afterEach, describe, expect, it, vi } from "vitest";
import { applyTheme, readStoredTheme, UI_STORAGE_KEY } from "./theme";

const root = document.documentElement;

afterEach(() => {
  vi.restoreAllMocks();
  localStorage.clear();
  applyTheme("light");
});

describe("readStoredTheme", () => {
  it("reads the theme uiStore persisted", () => {
    localStorage.setItem(
      UI_STORAGE_KEY,
      JSON.stringify({ state: { theme: "dark" }, version: 0 }),
    );
    expect(readStoredTheme()).toBe("dark");
  });

  it("falls back to light when nothing usable is stored", () => {
    expect(readStoredTheme()).toBe("light");
    localStorage.setItem(UI_STORAGE_KEY, "{not json");
    expect(readStoredTheme()).toBe("light");
    localStorage.setItem(
      UI_STORAGE_KEY,
      JSON.stringify({ state: { theme: "neon" } }),
    );
    expect(readStoredTheme()).toBe("light");
  });

  it("falls back to light when site data is blocked and reading throws", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new DOMException("The operation is insecure.", "SecurityError");
    });
    expect(readStoredTheme()).toBe("light");
  });
});

describe("applyTheme", () => {
  it("puts dark and light on the page", () => {
    applyTheme("dark");
    expect(root).toHaveClass("dark");
    applyTheme("light");
    expect(root).not.toHaveClass("dark");
  });

  it("follows the OS under system, live, until another theme is chosen", () => {
    let onChange: (() => void) | undefined;
    const query = {
      matches: false,
      addEventListener: vi.fn((_type: string, listener: () => void) => {
        onChange = listener;
      }),
      removeEventListener: vi.fn(),
    };
    vi.mocked(window.matchMedia).mockReturnValueOnce(
      query as unknown as MediaQueryList,
    );

    applyTheme("system");
    expect(root).not.toHaveClass("dark");

    // The OS switches to dark while the page is open.
    query.matches = true;
    onChange?.();
    expect(root).toHaveClass("dark");

    applyTheme("light");
    expect(query.removeEventListener).toHaveBeenCalledWith("change", onChange);
    expect(root).not.toHaveClass("dark");
  });
});
