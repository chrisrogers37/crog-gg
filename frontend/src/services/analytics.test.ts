import { afterEach, describe, expect, it, vi } from "vitest";
import { keepCampaignParams, startAnalytics, track } from "./analytics";

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

    track({ name: "repo_click", location: "hero" });
    track({ name: "quickstart_click" });

    // Queued until the script loads, which consumes the queue.
    expect(window.vaq).toEqual([
      ["beforeSend", keepCampaignParams],
      ["event", { name: "repo_click", data: { location: "hero" } }],
      ["event", { name: "quickstart_click", data: {} }],
    ]);
  });

  it("reports a URL with its utm_* tags and nothing else from the query", () => {
    const event = {
      type: "pageview" as const,
      url: "https://www.crog.gg/?email=a%40b.example&utm_source=hn&ref=x&utm_medium=post#quickstart",
    };
    expect(keepCampaignParams(event)).toEqual({
      type: "pageview",
      url: "https://www.crog.gg/?utm_source=hn&utm_medium=post#quickstart",
    });
  });
});
