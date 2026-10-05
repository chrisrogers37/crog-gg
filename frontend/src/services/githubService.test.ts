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

      const result = await githubService.getRepository("owner", "shuffify");

      expect(result).toEqual(mockRepo);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/v1/github/repo/owner/shuffify"),
        expect.any(Object),
      );
    });

    it("throws error on failed fetch", async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
      });

      await expect(githubService.getRepository("owner", "nonexistent")).rejects.toThrow(
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
      await githubService.getRepository("owner", "test-repo");
      // Second call should use cache
      await githubService.getRepository("owner", "test-repo");

      expect(fetch).toHaveBeenCalledTimes(1);
    });

    it("asks by owner, and caches each owner's repo apart (#189)", async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ name: "same-name" }),
      });

      await githubService.getRepository("ada", "same-name");
      await githubService.getRepository("octocat", "same-name");

      expect(vi.mocked(fetch).mock.calls.map(([url]) => url)).toEqual([
        "/api/v1/github/repo/ada/same-name",
        "/api/v1/github/repo/octocat/same-name",
      ]);
    });
  });

  describe("getReadme", () => {
    it("fetches and decodes README content", async () => {
      const mockReadme = {
        content: btoa("# Test README\n\nThis is a test."),
        encoding: "base64",
        sha: "abc123",
        html_url: "https://github.com/chrisrogers37/shuffify/blob/main/README.md",
        download_url:
          "https://raw.githubusercontent.com/chrisrogers37/shuffify/main/README.md",
      };

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockReadme),
      });

      const result = await githubService.getReadme("owner", "shuffify");

      expect(result).toEqual({
        text: "# Test README\n\nThis is a test.",
        htmlUrl: mockReadme.html_url,
        downloadUrl: mockReadme.download_url,
      });
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/v1/github/readme/owner/shuffify"),
        expect.any(Object),
      );
    });

    it("decodes the README as UTF-8, so emoji and symbols survive", async () => {
      // Headings from two project READMEs, which rendered
      // as "ð The Story", "â ï¸ Disclaimer" and "Â·" before #178.
      const text = "## 📖 The Story\n## 🎯 Overview\n## ⚠️ Disclaimer\na — b · c";
      const utf8 = String.fromCharCode(...new TextEncoder().encode(text));
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        // GitHub wraps its base64 at 60 columns.
        json: () => Promise.resolve({ content: btoa(utf8).replace(/(.{60})/g, "$1\n") }),
      });

      expect((await githubService.getReadme("owner", "emoji-readme"))?.text).toBe(text);
    });

    it("asks by owner, and caches each owner's README apart (#189)", async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({ ok: false, status: 404 });

      await githubService.getReadme("ada", "same-name");
      await githubService.getReadme("octocat", "same-name");

      expect(vi.mocked(fetch).mock.calls.map(([url]) => url)).toEqual([
        "/api/v1/github/readme/ada/same-name",
        "/api/v1/github/readme/octocat/same-name",
      ]);
    });

    it("returns null when the repo has no README", async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
      });

      const result = await githubService.getReadme("owner", "no-readme-repo");

      expect(result).toBeNull();
    });

    it("throws error on other failures", async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
      });

      await expect(githubService.getReadme("owner", "error-repo")).rejects.toThrow(
        "Failed to fetch README: 500",
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
      await githubService.getRepository("owner", "test-repo");

      // Clear cache
      githubService.clearCache();

      // Second call should fetch again
      await githubService.getRepository("owner", "test-repo");

      expect(fetch).toHaveBeenCalledTimes(2);
    });
  });
});
