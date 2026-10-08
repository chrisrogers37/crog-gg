import { act, renderHook } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { useMotionPreference } from "../useMotionPreference";

it("follows preference changes during a visit and removes the listener", () => {
  let listener: (() => void) | undefined;
  const media = {
    matches: false,
    addEventListener: vi.fn((_event: string, callback: () => void) => { listener = callback; }),
    removeEventListener: vi.fn(),
  };
  const matchMedia = vi.spyOn(window, "matchMedia").mockReturnValue(media as unknown as MediaQueryList);
  const { result, unmount } = renderHook(() => useMotionPreference());
  expect(result.current).toBe(false);
  act(() => {
    media.matches = true;
    listener?.();
  });
  expect(result.current).toBe(true);
  unmount();
  expect(media.removeEventListener).toHaveBeenCalledWith("change", listener);
  matchMedia.mockRestore();
});
