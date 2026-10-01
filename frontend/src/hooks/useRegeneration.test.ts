import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useContentStore } from "../store";
import { useRegeneration } from "./useRegeneration";

describe("useRegeneration", () => {
  const regenerateContent = vi.fn();

  beforeEach(() => {
    useContentStore.setState({ regenerateContent, cooldownEndsAt: null, cooldownTotal: 0 });
  });

  it("presses through, and starts no cooldown of its own (#196 M44)", () => {
    // Whether a press goes out is the store's call; see the press gate in
    // contentStore.regenerate.test.ts.
    const { result } = renderHook(() => useRegeneration());
    result.current.regenerate();
    expect(regenerateContent).toHaveBeenCalledWith(true);
    expect(useContentStore.getState().cooldownEndsAt).toBeNull();
  });
});
