import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { reloadOnce } from "./reloadOnce";

describe("reloadOnce", () => {
  const reload = vi.fn();

  beforeEach(() => {
    sessionStorage.clear();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-30T12:00:00Z"));
    vi.stubGlobal("location", { ...window.location, pathname: "/about", reload });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("doesn't reload the same path again within a minute, so a broken chunk can't loop", () => {
    expect(reloadOnce()).toBe(true);
    vi.advanceTimersByTime(5_000);
    expect(reloadOnce()).toBe(false);
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it("reloads the same path again after a later deploy", () => {
    expect(reloadOnce()).toBe(true);
    vi.advanceTimersByTime(10 * 60_000);
    expect(reloadOnce()).toBe(true);
    expect(reload).toHaveBeenCalledTimes(2);
  });

  it("doesn't reload when storage is blocked", () => {
    const blocked = () => {
      throw new DOMException("blocked", "SecurityError");
    };
    vi.stubGlobal("sessionStorage", { getItem: blocked, setItem: blocked });

    expect(reloadOnce()).toBe(false);
    expect(reload).not.toHaveBeenCalled();
  });
});
