import { afterEach, describe, expect, it, vi } from "vitest";
import { startAnalytics, track } from "./analytics";

const script = () =>
  document.head.querySelector("script[src]")?.getAttribute("src");

afterEach(() => {
  vi.unstubAllEnvs();
  document.head.querySelectorAll("script").forEach((element) => element.remove());
  delete window.va;
  delete window.vaq;
});

describe("analytics", () => {
  it("sends nothing outside a production build", () => {
    startAnalytics();
    track({ name: "quickstart_click" });
    expect(script()).toBeUndefined();
    expect(window.va).toBeUndefined();
  });

  it("in production, loads the script from this origin and passes each event on once", () => {
    vi.stubEnv("PROD", true);
    startAnalytics();
    // The CSP allows scripts and beacons from 'self' only.
    expect(script()).toBe("/_vercel/insights/script.js");

    track({ name: "star_click", location: "hero" });
    track({ name: "quickstart_click" });

    // Queued until the script loads, which consumes the queue.
    expect(window.vaq).toEqual([
      ["event", { name: "star_click", data: { location: "hero" } }],
      ["event", { name: "quickstart_click", data: {} }],
    ]);
  });
});
