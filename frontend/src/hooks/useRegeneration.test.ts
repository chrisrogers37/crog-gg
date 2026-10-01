import { renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useContentStore } from "../store";
import { useRegeneration } from "./useRegeneration";

describe("useRegeneration", () => {
  const regenerateContent = vi.fn();

  beforeEach(() => {
    useContentStore.setState({ regenerateContent, cooldownEndsAt: null, cooldownTotal: 0 });
  });
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("presses through, but starts no cooldown of its own (#196 M44)", () => {
    const { result } = renderHook(() => useRegeneration());
    result.current.regenerate();
    expect(regenerateContent).toHaveBeenCalledWith(true);
    expect(useContentStore.getState().cooldownEndsAt).toBeNull();
  });

  it("doesn't press while the server's cooldown runs", () => {
    useContentStore.setState({ cooldownEndsAt: Date.now() + 10_000, cooldownTotal: 30 });
    const { result } = renderHook(() => useRegeneration());
    result.current.regenerate();
    expect(regenerateContent).not.toHaveBeenCalled();
    expect(result.current.cooldownRemaining).toBeGreaterThan(0);
  });
});
