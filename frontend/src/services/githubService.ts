const API_URL = import.meta.env.VITE_API_URL || 'https://api.crog.gg';

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
 * README content response
 */
export interface ReadmeResponse {
  content: string;
  encoding: string;
  sha: string;
}

/**
 * Language statistics
 */
export interface LanguageStats {
  [language: string]: number;
}

/**
 * Contribution data for heatmap
 */
export interface ContributionDay {
  date: string;
  count: number;
  level: 0 | 1 | 2 | 3 | 4;
}

export interface ContributionData {
  total: number;
  weeks: ContributionDay[][];
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
  private async cachedFetch<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
    const cached = this.cache.get(key);

    if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
      return cached.data as T;
    }

    const data = await fetcher();
    this.cache.set(key, { data, timestamp: Date.now() });
    return data;
  }

  /**
   * Fetch repository information
   */
  async getRepository(repoName: string): Promise<Repository> {
    return this.cachedFetch(`repo:${repoName}`, async () => {
      const response = await fetch(`${this.baseUrl}/repo/${repoName}`, {
        credentials: 'include',
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
  async getReadme(repoName: string): Promise<string> {
    return this.cachedFetch(`readme:${repoName}`, async () => {
      const response = await fetch(`${this.baseUrl}/readme/${repoName}`, {
        credentials: 'include',
      });

      if (!response.ok) {
        if (response.status === 404) {
          return ''; // No README
        }
        throw new Error(`Failed to fetch README: ${response.status}`);
      }

      const data = await response.json();
      // Decode base64 content
      return atob(data.content.replace(/\n/g, ''));
    });
  }

  /**
   * Fetch repository language statistics
   */
  async getLanguages(repoName: string): Promise<LanguageStats> {
    return this.cachedFetch(`languages:${repoName}`, async () => {
      const response = await fetch(`${this.baseUrl}/languages/${repoName}`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch languages: ${response.status}`);
      }

      return response.json();
    });
  }

  /**
   * Fetch aggregated language stats for all user repos
   */
  async getAllLanguages(): Promise<LanguageStats> {
    return this.cachedFetch('all-languages', async () => {
      const response = await fetch(`${this.baseUrl}/languages`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch all languages: ${response.status}`);
      }

      return response.json();
    });
  }

  /**
   * Fetch contribution data for heatmap
   */
  async getContributions(): Promise<ContributionData> {
    return this.cachedFetch('contributions', async () => {
      const response = await fetch(`${this.baseUrl}/contributions`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch contributions: ${response.status}`);
      }

      return response.json();
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
