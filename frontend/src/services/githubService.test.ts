import { describe, it, expect, beforeEach, vi } from "vitest";
import { makeRepository } from "../test/builders";
import { githubService, type ReadmeResponse } from "./githubService";

const REPO = makeRepository({
  name: "shuffify",
  full_name: "chrisrogers37/shuffify",
  stargazers_count: 42,
  forks_count: 5,
  language: "Python",
  topics: ["spotify"],
  license: { name: "MIT License", spdx_id: "MIT" },
});

/** What getRepository gives RepoStats from REPO: the fields it reads. */
const FIGURES = {
  stargazers_count: 42,
  forks_count: 5,
  watchers_count: 1,
  open_issues_count: 0,
  language: "Python",
  license: { spdx_id: "MIT" },
  pushed_at: "2026-09-01T00:00:00Z",
  topics: ["spotify"],
};

/** A /readme reply, GitHub's body passed through. */
const readmeReply = (content: string): ReadmeResponse => ({
  content,
  encoding: "base64",
  sha: "abc123",
  html_url: "https://github.com/chrisrogers37/shuffify/blob/main/README.md",
  download_url: "https://raw.githubusercontent.com/chrisrogers37/shuffify/main/README.md",
});

/** A fetch that answers every request with `json`. */
const answer = (json: unknown) => vi.fn(async () => Response.json(json));

describe("githubService", () => {
  beforeEach(() => {
    // Clear cache before each test
    githubService.clearCache();
    vi.clearAllMocks();
  });

  describe("getRepository", () => {
    it("fetches repository data", async () => {
      globalThis.fetch = answer(REPO);

      const result = await githubService.getRepository("owner", "shuffify");

      expect(result).toEqual(FIGURES);
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

    it("takes fields it doesn't read, and GitHub's nulls, as they come", async () => {
      globalThis.fetch = answer({ ...REPO, language: null, license: null, visibility: "public" });

      expect(await githubService.getRepository("owner", "shuffify")).toEqual({
        ...FIGURES,
        language: null,
        license: null,
      });
    });

    it("takes a null topics as none, as the proxy sends a field GitHub left out (#272)", async () => {
      globalThis.fetch = answer({ ...REPO, topics: null });

      expect(await githubService.getRepository("owner", "shuffify")).toEqual({
        ...FIGURES,
        topics: [],
      });
    });

    it("fails on a reply of another shape, as on a 5xx (#272)", async () => {
      // The panel reads topics.length and each count's toLocaleString().
      globalThis.fetch = answer({ ...REPO, topics: "spotify", stargazers_count: "42" });

      await expect(githubService.getRepository("owner", "shuffify")).rejects.toThrow(
        "The repository reply has 2 problem(s):\n" +
          "  - reply.stargazers_count: expected a whole number, 0 or more\n" +
          "  - reply.topics: expected a list",
      );
    });

    it("fails on a last push that isn't a date, which would render \"Invalid Date\" (#272)", async () => {
      globalThis.fetch = answer({ ...REPO, pushed_at: "soon" });

      await expect(githubService.getRepository("owner", "shuffify")).rejects.toThrow(
        "reply.pushed_at: expected a date",
      );
    });

    it("caches repository data", async () => {
      globalThis.fetch = answer(REPO);

      // First call
      await githubService.getRepository("owner", "test-repo");
      // Second call should use cache
      await githubService.getRepository("owner", "test-repo");

      expect(fetch).toHaveBeenCalledTimes(1);
    });

    it("asks by owner, and caches each owner's repo apart (#189)", async () => {
      globalThis.fetch = answer(REPO);

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
      const mockReadme = readmeReply(btoa("# Test README\n\nThis is a test."));
      globalThis.fetch = answer(mockReadme);

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
      // GitHub wraps its base64 at 60 columns.
      globalThis.fetch = answer(readmeReply(btoa(utf8).replace(/(.{60})/g, "$1\n")));

      expect((await githubService.getReadme("owner", "emoji-readme"))?.text).toBe(text);
    });

    it("fails on a reply without its content or https links, as on a 5xx (#272)", async () => {
      // The links are what the README's relative links resolve against.
      globalThis.fetch = answer({ ...readmeReply(""), content: undefined, html_url: "http://x" });

      await expect(githubService.getReadme("owner", "shuffify")).rejects.toThrow(
        "The README reply has 2 problem(s):\n" +
          "  - reply.content: missing\n" +
          "  - reply.html_url: expected an https URL",
      );
    });

    it("fails on a README that isn't base64, as GitHub sends one over 1 MB (#272)", async () => {
      // Encoding "none" with empty content, which would render as a blank README.
      globalThis.fetch = answer({ ...readmeReply(""), encoding: "none" });

      await expect(githubService.getReadme("owner", "big-readme")).rejects.toThrow(
        "reply.encoding: expected one of base64",
      );
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
      globalThis.fetch = answer(REPO);

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
