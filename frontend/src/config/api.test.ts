import { afterEach, describe, expect, it, vi } from "vitest";
import { makeRepository } from "../test/builders";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.resetModules();
});

describe("same-origin API requests", () => {
  it("ignores a stale API origin for feature discovery and credentialed GitHub requests", async () => {
    vi.stubEnv("VITE_API_URL", "https://retired-api.example");
    vi.resetModules();
    const fetchMock = vi.fn(async (url: string) =>
      Response.json(url === "/api/features" ? { regenerate: false, github: true } : makeRepository()),
    );
    vi.stubGlobal("fetch", fetchMock);
    const { fetchFeatures } = await import("../hooks/useFeatures");
    const { githubService } = await import("../services/githubService");

    await fetchFeatures();
    await githubService.getRepository("octocat", "example");

    expect(fetchMock).toHaveBeenNthCalledWith(1, "/api/features", expect.objectContaining({ signal: expect.any(AbortSignal) }));
    expect(fetchMock).toHaveBeenNthCalledWith(2, "/api/v1/github/repo/octocat/example", { credentials: "include" });
  });
});
