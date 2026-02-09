import { describe, it, expect, beforeEach, vi } from "vitest";
import { githubService } from "./githubService";

describe("githubService", () => {
  beforeEach(() => {
    // Clear cache before each test
    githubService.clearCache();
    vi.clearAllMocks();
  });

  describe("getRepository", () => {
    it("fetches repository data", async () => {
      const mockRepo = {
        name: "shuffify",
        full_name: "chrisrogers37/shuffify",
        description: "A Spotify playlist shuffler",
        stargazers_count: 42,
        forks_count: 5,
      };

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockRepo),
      });

      const result = await githubService.getRepository("shuffify");

      expect(result).toEqual(mockRepo);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/v1/github/repo/shuffify"),
        expect.any(Object),
      );
    });

    it("throws error on failed fetch", async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
      });

      await expect(githubService.getRepository("nonexistent")).rejects.toThrow(
        "Failed to fetch repository: 404",
      );
    });

    it("caches repository data", async () => {
      const mockRepo = { name: "test-repo" };

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockRepo),
      });

      // First call
      await githubService.getRepository("test-repo");
      // Second call should use cache
      await githubService.getRepository("test-repo");

      expect(fetch).toHaveBeenCalledTimes(1);
    });
  });

  describe("getReadme", () => {
    it("fetches and decodes README content", async () => {
      const mockReadme = {
        content: btoa("# Test README\n\nThis is a test."),
        encoding: "base64",
        sha: "abc123",
      };

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockReadme),
      });

      const result = await githubService.getReadme("shuffify");

      expect(result).toBe("# Test README\n\nThis is a test.");
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/v1/github/readme/shuffify"),
        expect.any(Object),
      );
    });

    it("returns empty string when README not found", async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
      });

      const result = await githubService.getReadme("no-readme-repo");

      expect(result).toBe("");
    });

    it("throws error on other failures", async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
      });

      await expect(githubService.getReadme("error-repo")).rejects.toThrow(
        "Failed to fetch README: 500",
      );
    });
  });

  describe("getLanguages", () => {
    it("fetches language statistics for a repo", async () => {
      const mockLanguages = {
        TypeScript: 45000,
        JavaScript: 12000,
        CSS: 8000,
      };

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockLanguages),
      });

      const result = await githubService.getLanguages("shuffify");

      expect(result).toEqual(mockLanguages);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/v1/github/languages/shuffify"),
        expect.any(Object),
      );
    });
  });

  describe("getAllLanguages", () => {
    it("fetches aggregated language stats", async () => {
      const mockLanguages = {
        Python: 150000,
        TypeScript: 120000,
        JavaScript: 80000,
      };

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockLanguages),
      });

      const result = await githubService.getAllLanguages();

      expect(result).toEqual(mockLanguages);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/v1/github/languages"),
        expect.any(Object),
      );
    });
  });

  describe("getContributions", () => {
    it("fetches contribution data", async () => {
      const mockContributions = {
        total: 847,
        weeks: [
          [
            { date: "2025-01-26", count: 0, level: 0 },
            { date: "2025-01-27", count: 3, level: 1 },
          ],
        ],
      };

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockContributions),
      });

      const result = await githubService.getContributions();

      expect(result).toEqual(mockContributions);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/v1/github/contributions"),
        expect.any(Object),
      );
    });
  });

  describe("clearCache", () => {
    it("clears the cache", async () => {
      const mockRepo = { name: "test-repo" };

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockRepo),
      });

      // First call
      await githubService.getRepository("test-repo");

      // Clear cache
      githubService.clearCache();

      // Second call should fetch again
      await githubService.getRepository("test-repo");

      expect(fetch).toHaveBeenCalledTimes(2);
    });
  });
});
