import { API_URL } from "../config/api";

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
  async getRepository(owner: string, repoName: string): Promise<Repository> {
    return this.cachedFetch(`repo:${owner}/${repoName}`, async () => {
      const response = await fetch(`${this.baseUrl}/repo/${owner}/${repoName}`, {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch repository: ${response.status}`);
      }

      return response.json();
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

      if (!response.ok) {
        if (response.status === 404) {
          return null; // No README
        }
        throw new Error(`Failed to fetch README: ${response.status}`);
      }

      const data: ReadmeResponse = await response.json();
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
