import { API_URL } from "../config/api";
import {
  type Check,
  count,
  describeProblems,
  fail,
  httpsUrl,
  list,
  nullable,
  object,
  oneOf,
  text,
  withDefault,
} from "../config/check";

/**
 * Repository information from GitHub API
 */
export interface Repository {
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  homepage: string | null;
  stargazers_count: number;
  forks_count: number;
  watchers_count: number;
  open_issues_count: number;
  language: string | null;
  topics: string[];
  created_at: string;
  updated_at: string;
  pushed_at: string;
  license: {
    name: string;
    spdx_id: string;
  } | null;
  default_branch: string;
}

/**
 * README content response (GitHub's contents API, passed through by the proxy)
 */
export interface ReadmeResponse {
  content: string;
  encoding: string;
  sha: string;
  html_url: string;
  download_url: string;
}

/**
 * A decoded README and where it lives on GitHub, which its relative links and
 * images resolve against (utils/readmeLinks.ts).
 */
export type Readme = {
  text: string;
  htmlUrl: string;
  downloadUrl: string;
};

/*
 * The proxy's replies are held to what the panels read (#272), so a reply of
 * another shape fails as a 5xx does, into the panel's error state, rather than
 * reaching a render that reads a field it doesn't have. Keys a check doesn't
 * name pass unread: GitHub adds fields, and the README reply is its own body.
 */
const lenient = { unknownKeys: "ignore" } as const;

/**
 * A timestamp Date.parse reads. RepoStats shows pushed_at as a date, and
 * anything else would render "Invalid Date".
 */
const date: Check<string> = (value, path, issues) =>
  typeof value === "string" && !Number.isNaN(Date.parse(value))
    ? value
    : fail(issues, path, value, "a date");

const repoFigures = object(
  {
    stargazers_count: count,
    forks_count: count,
    watchers_count: count,
    open_issues_count: count,
    language: nullable(text),
    license: nullable(object({ spdx_id: nullable(text) }, lenient)),
    pushed_at: date,
    topics: withDefault(list(text), () => []),
  },
  lenient,
);

/**
 * What RepoStats reads from a /repo reply, and all the client takes from it.
 * Repository, above, is the proxy's whole reply, kept in step with the proxy's
 * _REPO_FIELDS by tests/test_github_proxy.py, and the RepoStats tests answer
 * getRepository with it, so the type checker fails if it drifts from this check.
 */
export type RepoFigures = ReturnType<typeof repoFigures>;

/** The content may be empty: an empty README. */
const base64: Check<string> = (value, path, issues) =>
  typeof value === "string" ? value : fail(issues, path, value, "base64 text");

const readmeReply = object(
  {
    content: base64,
    encoding: oneOf(["base64"]),
    html_url: httpsUrl,
    download_url: httpsUrl,
  },
  lenient,
);

/** `reply` held to `check`, or the same failure as a 5xx. */
function parseReply<T>(source: string, reply: unknown, check: Check<T>): T {
  const issues: string[] = [];
  const parsed = check(reply, "reply", issues);
  if (issues.length > 0) {
    throw new Error(describeProblems(source, issues));
  }
  return parsed;
}

/**
 * GitHub Service
 *
 * Handles all GitHub API interactions via the backend proxy.
 * Using the backend avoids exposing API tokens and handles rate limiting.
 */
class GitHubService {
  private baseUrl: string;
  private cache: Map<string, { data: unknown; timestamp: number }>;
  private cacheTTL: number = 5 * 60 * 1000; // 5 minutes

  constructor() {
    this.baseUrl = `${API_URL}/api/v1/github`;
    this.cache = new Map();
  }

  /**
   * Get cached data or fetch fresh
   */
  private async cachedFetch<T>(
    key: string,
    fetcher: () => Promise<T>,
  ): Promise<T> {
    const cached = this.cache.get(key);

    if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
      return cached.data as T;
    }

    const data = await fetcher();
    this.cache.set(key, { data, timestamp: Date.now() });
    return data;
  }

  /**
   * Fetch repository information. By owner, which the API serves only when
   * site.yaml allows it (#189).
   */
  async getRepository(owner: string, repoName: string): Promise<RepoFigures> {
    return this.cachedFetch(`repo:${owner}/${repoName}`, async () => {
      const response = await fetch(`${this.baseUrl}/repo/${owner}/${repoName}`, {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch repository: ${response.status}`);
      }

      return parseReply("The repository reply", await response.json(), repoFigures);
    });
  }

  /**
   * Fetch repository README content
   */
  async getReadme(owner: string, repoName: string): Promise<Readme | null> {
    return this.cachedFetch(`readme:${owner}/${repoName}`, async () => {
      const response = await fetch(`${this.baseUrl}/readme/${owner}/${repoName}`, {
        credentials: "include",
      });

      // The proxy answers 204, with no body, for a repo with no README.
      if (response.status === 204) return null;

      if (!response.ok) {
        throw new Error(`Failed to fetch README: ${response.status}`);
      }

      const data = parseReply("The README reply", await response.json(), readmeReply);
      // GitHub sends the file's UTF-8 bytes as base64. atob() alone turns each
      // byte into its own character, so every emoji and non-ASCII symbol came
      // out as Latin-1 mojibake ("ð¯ Overview", #178). Decode the bytes as
      // UTF-8 instead.
      const bytes = Uint8Array.from(atob(data.content.replace(/\n/g, "")), (c) =>
        c.charCodeAt(0),
      );
      return {
        text: new TextDecoder().decode(bytes),
        htmlUrl: data.html_url,
        downloadUrl: data.download_url,
      };
    });
  }

  /**
   * Clear the cache (useful after mutations or on demand)
   */
  clearCache(): void {
    this.cache.clear();
  }
}

export const githubService = new GitHubService();
