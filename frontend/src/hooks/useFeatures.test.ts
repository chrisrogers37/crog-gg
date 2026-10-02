import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import site from "virtual:site-config";
import { NO_FEATURES } from "../config/features";
import { useUIStore } from "../store/uiStore";
import { fetchFeatures, useFeatures, useGithubOn, useRegenerateOn } from "./useFeatures";

const ANSWER = { regenerate: true, github: true };
const SERVED = { regenerate: true, github: true };

const INITIAL_UI = useUIStore.getState();
const SITE_FEATURES = site.features;
const SITE_GITHUB = site.github;
afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  useUIStore.setState(INITIAL_UI, true);
  site.features = SITE_FEATURES;
  site.github = SITE_GITHUB;
});

const answering = (response: () => Promise<Response>) => {
  const fetchMock = vi.fn(response);
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
};

describe("fetchFeatures", () => {
  it("asks GET /api/features, and gives up after 3 s", async () => {
    const timeout = vi.spyOn(AbortSignal, "timeout");
    const fetchMock = answering(async () => Response.json(ANSWER));
    expect(await fetchFeatures()).toEqual(SERVED);
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toMatch(/\/api\/features$/);
    expect(timeout).toHaveBeenCalledWith(3000);
    expect(init.signal).toBe(timeout.mock.results[0].value);
  });

  it.each([
    ["an error status", async () => Response.json(ANSWER, { status: 500 })],
    ["an HTML page (no API behind the site)", async () => new Response("<!doctype html>")],
    ["no network", async () => Promise.reject(new TypeError("Failed to fetch"))],
    ["no answer in time", async () => Promise.reject(new DOMException("timed out", "TimeoutError"))],
  ])("serves nothing for %s", async (_, response) => {
    answering(response);
    expect(await fetchFeatures()).toEqual(NO_FEATURES);
  });
});

describe("useFeatures", () => {
  it("stores the answer", async () => {
    answering(async () => Response.json(ANSWER));
    renderHook(() => useFeatures());
    await waitFor(() => expect(useUIStore.getState().features).toEqual(SERVED));
  });
});

describe("what shows, by site.yaml's mode and the API's answer", () => {
  /** `served`: what the API answered, or null before it has. */
  const set = (mode: "auto" | "on" | "off" | undefined, served: boolean | null) => {
    site.features = { regenerate: mode, github: mode };
    useUIStore.setState({ features: served === null ? null : served ? SERVED : NO_FEATURES });
  };

  it.each([
    ["on", false, true],
    ["on", true, true],
    ["off", true, false],
    ["auto", true, true],
    ["auto", false, false],
    [undefined, true, true],
    [undefined, false, false],
    // Before the answer: the buttons need a click first, by which time it's in.
    ["auto", null, false],
    ["on", null, true],
  ] as const)("SUMMON with %s, served %s: %s", (mode, served, shown) => {
    set(mode, served);
    expect(renderHook(() => useRegenerateOn()).result.current).toBe(shown);
  });

  // site.example's github.username is octocat.
  it.each([
    ["on", false, "octocat", true],
    ["on", true, "someone-else", false],
    ["off", true, "octocat", false],
    ["auto", true, "OctoCat", true],
    ["auto", true, "someone-else", false],
    ["auto", false, "octocat", false],
    // Before the answer they show, so a deep link doesn't shift when it lands.
    ["auto", null, "octocat", true],
    ["off", null, "octocat", false],
    ["auto", null, "someone-else", false],
  ] as const)("GitHub with %s, served %s, for %s: %s", (mode, served, owner, shown) => {
    set(mode, served);
    expect(renderHook(() => useGithubOn(owner)).result.current).toBe(shown);
  });

  it("reads site.yaml's owners as they are when asked, in any case", () => {
    set("auto", true);
    site.github = { username: "OctoCat", allowed_owners: ["Other-Org"] };
    expect(renderHook(() => useGithubOn("other-org")).result.current).toBe(true);
    expect(renderHook(() => useGithubOn("OCTOCAT")).result.current).toBe(true);
    expect(renderHook(() => useGithubOn("someone-else")).result.current).toBe(false);
  });

  it("shows no GitHub panels without a repo", () => {
    set("on", true);
    expect(renderHook(() => useGithubOn(undefined)).result.current).toBe(false);
  });
});
