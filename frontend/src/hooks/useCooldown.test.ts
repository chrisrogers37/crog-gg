import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useContentStore } from "../store";
import { useCooldown } from "./useCooldown";

/**
 * The countdown comes from the store, which only a server response sets
 * (#196 M44). These pin what the hook adds: seconds left, the "ready" flash
 * when a running cooldown ends, and a countdown that survives a remount.
 */
describe("useCooldown", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // limitsRequested: the once-per-load /api/limits read is pinned in the
    // ActionButtons tests; these don't make it.
    useContentStore.setState({
      cooldownEndsAt: null,
      cooldownTotal: 0,
      dailyCapReached: false,
      limitsRequested: true,
    });
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("is idle with no cooldown: no flash on mount, and no timer running", () => {
    const { result } = renderHook(() => useCooldown());
    expect(result.current.remaining).toBe(0);
    expect(result.current.isOnCooldown).toBe(false);
    expect(result.current.isReady).toBe(false);
    expect(vi.getTimerCount()).toBe(0);
  });

  it("counts down the server's cooldown, then flashes ready", () => {
    useContentStore.setState({ cooldownEndsAt: Date.now() + 5_000, cooldownTotal: 30 });
    const { result } = renderHook(() => useCooldown());
    expect(result.current.remaining).toBe(5);
    expect(result.current.total).toBe(30);

    act(() => vi.advanceTimersByTime(2_000));
    expect(result.current.remaining).toBe(3);

    act(() => vi.advanceTimersByTime(3_000));
    expect(result.current.remaining).toBe(0);
    expect(result.current.isReady).toBe(true);

    act(() => vi.advanceTimersByTime(1_500));
    expect(result.current.isReady).toBe(false);
  });

  it("keeps counting across a remount, since the store holds the end", () => {
    useContentStore.setState({ cooldownEndsAt: Date.now() + 10_000, cooldownTotal: 30 });
    const first = renderHook(() => useCooldown());
    act(() => vi.advanceTimersByTime(4_000));
    first.unmount();

    const { result } = renderHook(() => useCooldown());
    expect(result.current.remaining).toBe(6);
  });

  it("reports the daily cap from the store", () => {
    useContentStore.setState({ dailyCapReached: true });
    const { result } = renderHook(() => useCooldown());
    expect(result.current.dailyCapReached).toBe(true);
    expect(result.current.isOnCooldown).toBe(false);
  });

  it("drops the ready flash if the cooldown is cleared during it", () => {
    useContentStore.setState({ cooldownEndsAt: Date.now() + 1_000, cooldownTotal: 30 });
    const { result } = renderHook(() => useCooldown());
    act(() => vi.advanceTimersByTime(1_000));
    expect(result.current.isReady).toBe(true);

    act(() => useContentStore.setState({ cooldownEndsAt: null }));
    expect(result.current.isReady).toBe(false);
  });
});
