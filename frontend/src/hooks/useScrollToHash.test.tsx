import { renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from "vitest";
import { useScrollToHash } from "./useScrollToHash";

describe("useScrollToHash", () => {
  let target: HTMLElement;
  let scrolled: Mock<Element["scrollIntoView"]>;

  const at = (hash: string, id: string) => {
    window.history.replaceState(null, "", `/${hash}`);
    target = document.createElement("section");
    target.id = id;
    scrolled = vi.fn<Element["scrollIntoView"]>();
    target.scrollIntoView = scrolled;
    document.body.append(target);
  };

  beforeEach(() => {
    window.history.replaceState(null, "", "/");
  });

  afterEach(() => {
    target?.remove();
    window.history.replaceState(null, "", "/");
  });

  it("scrolls to the section once the page is ready, not before", () => {
    at("#contact", "contact");
    const { rerender } = renderHook(({ ready }) => useScrollToHash(ready), {
      initialProps: { ready: false },
    });
    expect(scrolled).not.toHaveBeenCalled();
    rerender({ ready: true });
    expect(scrolled).toHaveBeenCalledTimes(1);
  });

  it("scrolls once per page: a part reloading later doesn't pull the visitor back", () => {
    at("#music", "music");
    const { rerender } = renderHook(({ ready }) => useScrollToHash(ready), {
      initialProps: { ready: true },
    });
    // A retry: the part loads again, and the page is ready again.
    rerender({ ready: false });
    rerender({ ready: true });
    expect(scrolled).toHaveBeenCalledTimes(1);
  });

  it("finds an id by its encoded name", () => {
    at("#caf%C3%A9", "café");
    renderHook(() => useScrollToHash(true));
    expect(scrolled).toHaveBeenCalledTimes(1);
  });

  it("takes a fragment that isn't percent-encoding as written, rather than throwing", () => {
    at("#50%", "50%");
    expect(() => renderHook(() => useScrollToHash(true))).not.toThrow();
    expect(scrolled).toHaveBeenCalledTimes(1);
  });
});
