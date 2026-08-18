import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useMediaQuery } from "./useMediaQuery";

/** Install a matchMedia whose match state can be flipped from the test, and
 *  hand back the listeners it registered so cleanup can be asserted. */
function stubMatchMedia(initial: boolean) {
  const listeners = new Set<(e: MediaQueryListEvent) => void>();
  let matches = initial;
  const mql = {
    get matches() {
      return matches;
    },
    media: "",
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn((_: string, cb: (e: MediaQueryListEvent) => void) =>
      listeners.add(cb),
    ),
    removeEventListener: vi.fn(
      (_: string, cb: (e: MediaQueryListEvent) => void) => listeners.delete(cb),
    ),
    dispatchEvent: vi.fn(),
  };
  window.matchMedia = vi
    .fn()
    .mockReturnValue(mql) as unknown as typeof window.matchMedia;
  return {
    listeners,
    set(next: boolean) {
      matches = next;
      listeners.forEach((cb) => cb({ matches: next } as MediaQueryListEvent));
    },
  };
}

// setup.ts installs a shared window.matchMedia for the whole suite. These
// tests replace it outright, and a direct assignment is not a spy, so
// restoreAllMocks cannot put it back -- other files would inherit this stub.
const realMatchMedia = window.matchMedia;

beforeEach(() => {
  window.matchMedia = realMatchMedia;
});

afterEach(() => {
  window.matchMedia = realMatchMedia;
  vi.restoreAllMocks();
});

describe("useMediaQuery", () => {
  it("reports the match state on the very first render", () => {
    stubMatchMedia(true);
    const { result } = renderHook(() => useMediaQuery("(max-width: 768px)"));
    // Not just "eventually true" -- a hook that started false and corrected on
    // mount would paint the wrong layout variant once.
    expect(result.current).toBe(true);
  });

  it("reports a non-match on the first render too", () => {
    stubMatchMedia(false);
    const { result } = renderHook(() => useMediaQuery("(max-width: 768px)"));
    expect(result.current).toBe(false);
  });

  it("updates when the query starts matching", () => {
    const mm = stubMatchMedia(false);
    const { result } = renderHook(() => useMediaQuery("(max-width: 768px)"));
    expect(result.current).toBe(false);
    act(() => mm.set(true));
    expect(result.current).toBe(true);
  });

  it("unsubscribes on unmount", () => {
    const mm = stubMatchMedia(false);
    const { unmount } = renderHook(() => useMediaQuery("(max-width: 768px)"));
    expect(mm.listeners.size).toBe(1);
    unmount();
    expect(mm.listeners.size).toBe(0);
  });
});
