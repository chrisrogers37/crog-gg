import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { reloadOnce } from "./reloadOnce";

describe("reloadOnce", () => {
  const reload = vi.fn();

  beforeEach(() => {
    sessionStorage.clear();
    vi.stubGlobal("location", { ...window.location, pathname: "/about", reload });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("reloads once per path, so a chunk that stays broken can't loop", () => {
    expect(reloadOnce()).toBe(true);
    expect(reloadOnce()).toBe(false);
    expect(reload).toHaveBeenCalledTimes(1);
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
