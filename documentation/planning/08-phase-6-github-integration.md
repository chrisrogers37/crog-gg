# 08 - Phase 6: GitHub Integration

## Overview

**Goal**: Enable the portfolio to showcase GitHub projects with live README rendering, repository statistics, and embedded demos.

**Estimated Effort**: 21 story points

**Prerequisites**:
- Phase 3 completed (project pages exist)
- Phase 5 completed (SEO for project pages)

**Deliverables**:
1. GitHub README fetching and rendering
2. Repository statistics display
3. Contribution graph
4. Live demo embedding
5. Backend API enhancements
6. Caching layer for GitHub data

---

## Table of Contents
1. [Task 6.1: Install Markdown Dependencies](#task-61-install-markdown-dependencies)
2. [Task 6.2: Create GitHub Service](#task-62-create-github-service)
3. [Task 6.3: Add Backend Endpoints](#task-63-add-backend-endpoints)
4. [Task 6.4: Create README Component](#task-64-create-readme-component)
5. [Task 6.5: Repository Stats Component](#task-65-repository-stats-component)
6. [Task 6.6: Contribution Graph](#task-66-contribution-graph)
7. [Task 6.7: Live Demo Embedding](#task-67-live-demo-embedding)
8. [Task 6.8: Update Project Detail Page](#task-68-update-project-detail-page)
9. [Verification Checklist](#verification-checklist)

---

## Task 6.1: Install Markdown Dependencies

### What We're Doing
Adding libraries to render GitHub-flavored Markdown with syntax highlighting.

### Installation

```bash
cd frontend

npm install react-markdown remark-gfm rehype-highlight rehype-raw
npm install -D @types/hast
```

### Package Purposes

| Package | Purpose |
|---------|---------|
| `react-markdown` | Render Markdown as React components |
| `remark-gfm` | GitHub-flavored Markdown support (tables, task lists, etc.) |
| `rehype-highlight` | Syntax highlighting for code blocks |
| `rehype-raw` | Allow raw HTML in Markdown (for badges, etc.) |

---

## Task 6.2: Create GitHub Service

### What We're Doing
Creating a service layer to interact with GitHub API via our backend.

### Create File: `frontend/src/services/githubService.ts`

```typescript
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
```

---

## Task 6.3: Add Backend Endpoints

### What We're Doing
Adding new Flask endpoints to proxy GitHub API requests.

### Update File: `backend/app.py`

Add these new endpoints:

```python
import os
import requests
from functools import lru_cache
from datetime import datetime, timedelta

GITHUB_TOKEN = os.environ.get('GITHUB_TOKEN')
GITHUB_USERNAME = 'chrisrogers37'
GITHUB_API = 'https://api.github.com'

def github_headers():
    """Headers for GitHub API requests."""
    headers = {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'CYOC-Portfolio'
    }
    if GITHUB_TOKEN:
        headers['Authorization'] = f'token {GITHUB_TOKEN}'
    return headers


@app.route('/api/v1/github/repo/<repo_name>')
@limiter.limit("30 per minute")
def get_repository(repo_name):
    """
    Get repository information.

    GET /api/v1/github/repo/shuffify
    """
    try:
        response = requests.get(
            f'{GITHUB_API}/repos/{GITHUB_USERNAME}/{repo_name}',
            headers=github_headers()
        )
        response.raise_for_status()
        return jsonify(response.json())
    except requests.RequestException as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/v1/github/readme/<repo_name>')
@limiter.limit("30 per minute")
def get_readme(repo_name):
    """
    Get repository README content.

    GET /api/v1/github/readme/shuffify
    """
    try:
        response = requests.get(
            f'{GITHUB_API}/repos/{GITHUB_USERNAME}/{repo_name}/readme',
            headers=github_headers()
        )

        if response.status_code == 404:
            return jsonify({'error': 'README not found'}), 404

        response.raise_for_status()
        return jsonify(response.json())
    except requests.RequestException as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/v1/github/languages/<repo_name>')
@limiter.limit("30 per minute")
def get_repo_languages(repo_name):
    """
    Get repository language statistics.

    GET /api/v1/github/languages/shuffify
    """
    try:
        response = requests.get(
            f'{GITHUB_API}/repos/{GITHUB_USERNAME}/{repo_name}/languages',
            headers=github_headers()
        )
        response.raise_for_status()
        return jsonify(response.json())
    except requests.RequestException as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/v1/github/languages')
@limiter.limit("10 per minute")
def get_all_languages():
    """
    Get aggregated language statistics for all public repos.
    This is the existing endpoint, updated with versioned path.

    GET /api/v1/github/languages
    """
    try:
        # Get all repos
        repos_response = requests.get(
            f'{GITHUB_API}/users/{GITHUB_USERNAME}/repos?per_page=100',
            headers=github_headers()
        )
        repos_response.raise_for_status()
        repos = repos_response.json()

        # Aggregate languages
        all_languages = {}
        for repo in repos:
            if repo.get('fork'):
                continue  # Skip forks

            lang_response = requests.get(
                f"{GITHUB_API}/repos/{GITHUB_USERNAME}/{repo['name']}/languages",
                headers=github_headers()
            )
            if lang_response.ok:
                languages = lang_response.json()
                for lang, bytes_count in languages.items():
                    all_languages[lang] = all_languages.get(lang, 0) + bytes_count

        return jsonify(all_languages)
    except requests.RequestException as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/v1/github/contributions')
@limiter.limit("5 per minute")
def get_contributions():
    """
    Get contribution data for heatmap visualization.
    Uses GitHub's GraphQL API for contribution calendar.

    GET /api/v1/github/contributions
    """
    if not GITHUB_TOKEN:
        return jsonify({'error': 'GitHub token required'}), 500

    query = """
    query($username: String!) {
        user(login: $username) {
            contributionsCollection {
                contributionCalendar {
                    totalContributions
                    weeks {
                        contributionDays {
                            date
                            contributionCount
                            contributionLevel
                        }
                    }
                }
            }
        }
    }
    """

    try:
        response = requests.post(
            'https://api.github.com/graphql',
            headers={
                'Authorization': f'bearer {GITHUB_TOKEN}',
                'Content-Type': 'application/json',
            },
            json={
                'query': query,
                'variables': {'username': GITHUB_USERNAME}
            }
        )
        response.raise_for_status()
        data = response.json()

        calendar = data['data']['user']['contributionsCollection']['contributionCalendar']

        # Transform to simpler format
        weeks = []
        for week in calendar['weeks']:
            days = []
            for day in week['contributionDays']:
                level_map = {
                    'NONE': 0,
                    'FIRST_QUARTILE': 1,
                    'SECOND_QUARTILE': 2,
                    'THIRD_QUARTILE': 3,
                    'FOURTH_QUARTILE': 4
                }
                days.append({
                    'date': day['date'],
                    'count': day['contributionCount'],
                    'level': level_map.get(day['contributionLevel'], 0)
                })
            weeks.append(days)

        return jsonify({
            'total': calendar['totalContributions'],
            'weeks': weeks
        })
    except requests.RequestException as e:
        return jsonify({'error': str(e)}), 500


# Maintain backwards compatibility with old endpoint
@app.route('/api/github/languages')
def get_languages_legacy():
    """Legacy endpoint - redirects to v1."""
    return get_all_languages()
```

### Environment Setup

Add to `.env`:

```
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Note**: Create a GitHub Personal Access Token with `public_repo` scope.

---

## Task 6.4: Create README Component

### What We're Doing
Creating a component to render GitHub README files with proper styling.

### Create File: `frontend/src/components/features/GitHubReadme/GitHubReadme.tsx`

```typescript
import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import rehypeRaw from 'rehype-raw';
import { githubService } from '../../../services/githubService';
import './GitHubReadme.css';

// Import highlight.js theme
import 'highlight.js/styles/github-dark.css';

interface GitHubReadmeProps {
  repoName: string;
  className?: string;
}

/**
 * GitHubReadme
 *
 * Fetches and renders a GitHub repository README with:
 * - GitHub-flavored Markdown support
 * - Syntax highlighting for code blocks
 * - Responsive images
 * - Task lists and tables
 */
export function GitHubReadme({ repoName, className = '' }: GitHubReadmeProps) {
  const [readme, setReadme] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchReadme() {
      try {
        setIsLoading(true);
        setError(null);
        const content = await githubService.getReadme(repoName);
        setReadme(content);
      } catch (err) {
        console.error('Failed to fetch README:', err);
        setError('Unable to load README');
      } finally {
        setIsLoading(false);
      }
    }

    fetchReadme();
  }, [repoName]);

  if (isLoading) {
    return (
      <div className={`github-readme loading ${className}`}>
        <div className="readme-skeleton">
          <div className="skeleton-line w-3/4" />
          <div className="skeleton-line w-full" />
          <div className="skeleton-line w-5/6" />
          <div className="skeleton-line w-2/3" />
        </div>
      </div>
    );
  }

  if (error || !readme) {
    return (
      <div className={`github-readme empty ${className}`}>
        <p className="readme-empty-message">
          {error || 'No README available for this repository.'}
        </p>
        <a
          href={`https://github.com/chrisrogers37/${repoName}`}
          target="_blank"
          rel="noopener noreferrer"
          className="readme-github-link"
        >
          View on GitHub →
        </a>
      </div>
    );
  }

  return (
    <div className={`github-readme ${className}`}>
      <article className="readme-content prose dark:prose-invert max-w-none">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeHighlight, rehypeRaw]}
          components={{
            // Custom component rendering
            a: ({ href, children }) => (
              <a
                href={href}
                target={href?.startsWith('http') ? '_blank' : undefined}
                rel={href?.startsWith('http') ? 'noopener noreferrer' : undefined}
              >
                {children}
              </a>
            ),
            img: ({ src, alt }) => {
              // Handle relative GitHub URLs
              const imageSrc = src?.startsWith('http')
                ? src
                : `https://raw.githubusercontent.com/chrisrogers37/${repoName}/main/${src}`;

              return (
                <img
                  src={imageSrc}
                  alt={alt || ''}
                  loading="lazy"
                  className="readme-image"
                />
              );
            },
            pre: ({ children }) => (
              <pre className="readme-code-block">
                {children}
              </pre>
            ),
          }}
        >
          {readme}
        </ReactMarkdown>
      </article>
    </div>
  );
}
```

### Create File: `frontend/src/components/features/GitHubReadme/GitHubReadme.css`

```css
.github-readme {
  @apply rounded-xl overflow-hidden;
  @apply bg-white dark:bg-slate-800;
  @apply border border-slate-200 dark:border-slate-700;
}

.github-readme.loading,
.github-readme.empty {
  @apply p-8 text-center;
}

/* Skeleton loading */
.readme-skeleton {
  @apply space-y-3;
}

.skeleton-line {
  @apply h-4 bg-slate-200 dark:bg-slate-700 rounded;
  @apply animate-pulse;
}

/* Empty state */
.readme-empty-message {
  @apply text-slate-500 dark:text-slate-400 mb-4;
}

.readme-github-link {
  @apply text-primary-600 dark:text-primary-400;
  @apply hover:underline;
}

/* Content styling */
.readme-content {
  @apply p-6 md:p-8;
}

/* Override prose styles for README */
.readme-content.prose {
  @apply text-slate-700 dark:text-slate-300;
}

.readme-content h1 {
  @apply text-2xl font-bold text-slate-900 dark:text-white;
  @apply pb-2 border-b border-slate-200 dark:border-slate-700;
  @apply mb-4;
}

.readme-content h2 {
  @apply text-xl font-semibold text-slate-800 dark:text-slate-100;
  @apply mt-6 mb-3;
}

.readme-content h3 {
  @apply text-lg font-medium text-slate-800 dark:text-slate-100;
  @apply mt-4 mb-2;
}

.readme-content p {
  @apply mb-4 leading-relaxed;
}

.readme-content ul,
.readme-content ol {
  @apply mb-4 pl-6;
}

.readme-content li {
  @apply mb-1;
}

.readme-content a {
  @apply text-primary-600 dark:text-primary-400;
  @apply hover:underline;
}

/* Code blocks */
.readme-code-block {
  @apply rounded-lg overflow-x-auto;
  @apply bg-slate-900 dark:bg-slate-950;
  @apply text-sm;
}

.readme-content code:not(pre code) {
  @apply px-1.5 py-0.5 rounded;
  @apply bg-slate-100 dark:bg-slate-700;
  @apply text-sm font-mono;
  @apply text-slate-800 dark:text-slate-200;
}

/* Tables */
.readme-content table {
  @apply w-full border-collapse mb-4;
}

.readme-content th,
.readme-content td {
  @apply border border-slate-200 dark:border-slate-700;
  @apply px-3 py-2 text-left;
}

.readme-content th {
  @apply bg-slate-100 dark:bg-slate-800;
  @apply font-semibold;
}

/* Images */
.readme-image {
  @apply max-w-full h-auto rounded-lg;
  @apply my-4;
}

/* Task lists */
.readme-content input[type="checkbox"] {
  @apply mr-2;
}

/* Blockquotes */
.readme-content blockquote {
  @apply border-l-4 border-slate-300 dark:border-slate-600;
  @apply pl-4 italic;
  @apply text-slate-600 dark:text-slate-400;
}
```

---

## Task 6.5: Repository Stats Component

### What We're Doing
Creating a component to display repository statistics.

### Create File: `frontend/src/components/features/RepoStats/RepoStats.tsx`

```typescript
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { githubService, Repository } from '../../../services/githubService';
import './RepoStats.css';

interface RepoStatsProps {
  repoName: string;
}

/**
 * RepoStats
 *
 * Displays GitHub repository statistics including:
 * - Stars, forks, watchers
 * - Primary language
 * - Last updated date
 * - License
 */
export function RepoStats({ repoName }: RepoStatsProps) {
  const [repo, setRepo] = useState<Repository | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchRepo() {
      try {
        const data = await githubService.getRepository(repoName);
        setRepo(data);
      } catch (err) {
        console.error('Failed to fetch repo:', err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchRepo();
  }, [repoName]);

  if (isLoading) {
    return (
      <div className="repo-stats loading">
        <div className="stats-skeleton" />
      </div>
    );
  }

  if (!repo) {
    return null;
  }

  const stats = [
    { label: 'Stars', value: repo.stargazers_count, icon: '⭐' },
    { label: 'Forks', value: repo.forks_count, icon: '🍴' },
    { label: 'Watchers', value: repo.watchers_count, icon: '👀' },
    { label: 'Issues', value: repo.open_issues_count, icon: '🐛' },
  ];

  const lastUpdated = new Date(repo.pushed_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return (
    <div className="repo-stats">
      {/* Main stats */}
      <div className="stats-grid">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            className="stat-item"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <span className="stat-icon">{stat.icon}</span>
            <span className="stat-value">{stat.value.toLocaleString()}</span>
            <span className="stat-label">{stat.label}</span>
          </motion.div>
        ))}
      </div>

      {/* Meta info */}
      <div className="repo-meta">
        {repo.language && (
          <span className="meta-item">
            <span className="meta-dot" style={{ background: getLanguageColor(repo.language) }} />
            {repo.language}
          </span>
        )}
        {repo.license && (
          <span className="meta-item">
            📜 {repo.license.spdx_id}
          </span>
        )}
        <span className="meta-item">
          🕐 Updated {lastUpdated}
        </span>
      </div>

      {/* Topics */}
      {repo.topics && repo.topics.length > 0 && (
        <div className="repo-topics">
          {repo.topics.map((topic) => (
            <span key={topic} className="topic-tag">
              {topic}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// Language color mapping (subset of GitHub's colors)
function getLanguageColor(language: string): string {
  const colors: Record<string, string> = {
    JavaScript: '#f1e05a',
    TypeScript: '#3178c6',
    Python: '#3572A5',
    Java: '#b07219',
    Go: '#00ADD8',
    Rust: '#dea584',
    Ruby: '#701516',
    CSS: '#563d7c',
    HTML: '#e34c26',
    Shell: '#89e051',
  };
  return colors[language] || '#8b8b8b';
}
```

### Create File: `frontend/src/components/features/RepoStats/RepoStats.css`

```css
.repo-stats {
  @apply p-4 rounded-xl;
  @apply bg-slate-50 dark:bg-slate-800/50;
  @apply border border-slate-200 dark:border-slate-700;
}

.repo-stats.loading {
  @apply h-24;
}

.stats-skeleton {
  @apply h-full bg-slate-200 dark:bg-slate-700 rounded;
  @apply animate-pulse;
}

/* Stats grid */
.stats-grid {
  @apply grid grid-cols-4 gap-4 mb-4;
}

.stat-item {
  @apply flex flex-col items-center text-center;
}

.stat-icon {
  @apply text-xl mb-1;
}

.stat-value {
  @apply text-lg font-semibold text-slate-900 dark:text-white;
}

.stat-label {
  @apply text-xs text-slate-500 dark:text-slate-400;
}

/* Meta info */
.repo-meta {
  @apply flex flex-wrap items-center gap-4;
  @apply text-sm text-slate-600 dark:text-slate-400;
  @apply pt-4 border-t border-slate-200 dark:border-slate-700;
}

.meta-item {
  @apply flex items-center gap-1.5;
}

.meta-dot {
  @apply w-3 h-3 rounded-full;
}

/* Topics */
.repo-topics {
  @apply flex flex-wrap gap-2 mt-4;
}

.topic-tag {
  @apply px-2 py-1 text-xs rounded-full;
  @apply bg-primary-100 dark:bg-primary-900/30;
  @apply text-primary-700 dark:text-primary-300;
}

/* Responsive */
@media (max-width: 640px) {
  .stats-grid {
    @apply grid-cols-2;
  }
}
```

---

## Task 6.6: Contribution Graph

### What We're Doing
Creating a GitHub-style contribution heatmap.

### Create File: `frontend/src/components/features/ContributionGraph/ContributionGraph.tsx`

```typescript
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { githubService, ContributionData, ContributionDay } from '../../../services/githubService';
import './ContributionGraph.css';

interface ContributionGraphProps {
  className?: string;
}

/**
 * ContributionGraph
 *
 * GitHub-style contribution heatmap showing daily activity.
 */
export function ContributionGraph({ className = '' }: ContributionGraphProps) {
  const [data, setData] = useState<ContributionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchContributions() {
      try {
        const contributions = await githubService.getContributions();
        setData(contributions);
      } catch (err) {
        console.error('Failed to fetch contributions:', err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchContributions();
  }, []);

  if (isLoading) {
    return (
      <div className={`contribution-graph loading ${className}`}>
        <div className="graph-skeleton" />
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const levelColors = [
    'bg-slate-100 dark:bg-slate-800',     // Level 0 - no contributions
    'bg-green-200 dark:bg-green-900',     // Level 1
    'bg-green-300 dark:bg-green-700',     // Level 2
    'bg-green-400 dark:bg-green-500',     // Level 3
    'bg-green-500 dark:bg-green-400',     // Level 4
  ];

  return (
    <div className={`contribution-graph ${className}`}>
      <div className="graph-header">
        <h3 className="graph-title">
          {data.total.toLocaleString()} contributions in the last year
        </h3>
      </div>

      <div className="graph-container">
        <div className="graph-grid">
          {data.weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="graph-week">
              {week.map((day, dayIndex) => (
                <motion.div
                  key={day.date}
                  className={`graph-day ${levelColors[day.level]}`}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{
                    delay: (weekIndex * 7 + dayIndex) * 0.002,
                    duration: 0.2,
                  }}
                  title={`${day.count} contributions on ${day.date}`}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="graph-legend">
        <span className="legend-label">Less</span>
        {levelColors.map((color, index) => (
          <div key={index} className={`legend-box ${color}`} />
        ))}
        <span className="legend-label">More</span>
      </div>
    </div>
  );
}
```

### Create File: `frontend/src/components/features/ContributionGraph/ContributionGraph.css`

```css
.contribution-graph {
  @apply p-4 rounded-xl;
  @apply bg-white dark:bg-slate-800;
  @apply border border-slate-200 dark:border-slate-700;
}

.contribution-graph.loading {
  @apply h-40;
}

.graph-skeleton {
  @apply h-full bg-slate-200 dark:bg-slate-700 rounded;
  @apply animate-pulse;
}

.graph-header {
  @apply mb-4;
}

.graph-title {
  @apply text-sm font-medium text-slate-700 dark:text-slate-300;
}

.graph-container {
  @apply overflow-x-auto pb-2;
}

.graph-grid {
  @apply flex gap-0.5;
  min-width: max-content;
}

.graph-week {
  @apply flex flex-col gap-0.5;
}

.graph-day {
  @apply w-3 h-3 rounded-sm;
  @apply cursor-pointer;
  @apply transition-transform hover:scale-125;
}

.graph-legend {
  @apply flex items-center justify-end gap-1 mt-4;
  @apply text-xs text-slate-500 dark:text-slate-400;
}

.legend-box {
  @apply w-3 h-3 rounded-sm;
}

.legend-label {
  @apply mx-1;
}
```

---

## Task 6.7: Live Demo Embedding

### What We're Doing
Creating a component to embed live project demos.

### Create File: `frontend/src/components/features/ProjectDemo/ProjectDemo.tsx`

```typescript
import { useState } from 'react';
import './ProjectDemo.css';

interface ProjectDemoProps {
  url: string;
  title: string;
  height?: number;
}

/**
 * ProjectDemo
 *
 * Embeds a live demo of a web project in an iframe.
 * Includes loading state and fullscreen toggle.
 */
export function ProjectDemo({ url, title, height = 600 }: ProjectDemoProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  return (
    <div className={`project-demo ${isFullscreen ? 'fullscreen' : ''}`}>
      <div className="demo-header">
        <h3 className="demo-title">Live Demo</h3>
        <div className="demo-actions">
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="demo-link"
          >
            Open in new tab ↗
          </a>
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="demo-fullscreen-btn"
          >
            {isFullscreen ? '⊙ Exit' : '⊕ Fullscreen'}
          </button>
        </div>
      </div>

      <div className="demo-container" style={{ height: isFullscreen ? '80vh' : height }}>
        {isLoading && (
          <div className="demo-loading">
            <div className="spinner" />
            <p>Loading demo...</p>
          </div>
        )}
        <iframe
          src={url}
          title={title}
          className="demo-iframe"
          onLoad={() => setIsLoading(false)}
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
        />
      </div>
    </div>
  );
}
```

### Create File: `frontend/src/components/features/ProjectDemo/ProjectDemo.css`

```css
.project-demo {
  @apply rounded-xl overflow-hidden;
  @apply bg-white dark:bg-slate-800;
  @apply border border-slate-200 dark:border-slate-700;
}

.project-demo.fullscreen {
  @apply fixed inset-4 z-50;
  @apply shadow-2xl;
}

.demo-header {
  @apply flex items-center justify-between;
  @apply px-4 py-3;
  @apply bg-slate-50 dark:bg-slate-900;
  @apply border-b border-slate-200 dark:border-slate-700;
}

.demo-title {
  @apply font-medium text-slate-700 dark:text-slate-300;
}

.demo-actions {
  @apply flex items-center gap-3;
}

.demo-link {
  @apply text-sm text-primary-600 dark:text-primary-400;
  @apply hover:underline;
}

.demo-fullscreen-btn {
  @apply px-3 py-1 text-sm rounded;
  @apply bg-slate-200 dark:bg-slate-700;
  @apply text-slate-700 dark:text-slate-300;
  @apply hover:bg-slate-300 dark:hover:bg-slate-600;
  @apply transition-colors;
}

.demo-container {
  @apply relative;
}

.demo-loading {
  @apply absolute inset-0 flex flex-col items-center justify-center;
  @apply bg-slate-100 dark:bg-slate-900;
  @apply text-slate-500;
}

.demo-iframe {
  @apply w-full h-full border-0;
}
```

---

## Task 6.8: Update Project Detail Page

### What We're Doing
Integrating all GitHub components into the project detail page.

### Update File: `frontend/src/pages/Projects/ProjectDetailPage.tsx`

```typescript
import { useParams, Link } from 'react-router-dom';
import { useProjects } from '../../store';
import { SEO } from '../../components/SEO';
import { Breadcrumbs } from '../../components/common/Breadcrumbs';
import { GitHubReadme } from '../../components/features/GitHubReadme';
import { RepoStats } from '../../components/features/RepoStats';
import { ProjectDemo } from '../../components/features/ProjectDemo';
import './ProjectDetailPage.css';

/**
 * ProjectDetailPage (Enhanced)
 *
 * Now includes:
 * - GitHub README rendering
 * - Repository statistics
 * - Live demo embedding (if applicable)
 */
export function ProjectDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const projects = useProjects();

  const project = projects.find((p) => p.id === slug);

  if (!project) {
    return (
      <>
        <SEO title="Project Not Found" noIndex />
        <div className="project-not-found">
          <h1>Project Not Found</h1>
          <p>The project "{slug}" could not be found.</p>
          <Link to="/projects">← Back to Projects</Link>
        </div>
      </>
    );
  }

  // Extract GitHub repo name from URL
  const githubRepoMatch = project.url?.match(/github\.com\/[\w-]+\/([\w-]+)/);
  const githubRepoName = githubRepoMatch ? githubRepoMatch[1] : null;

  // Check if project has a live demo URL
  const hasLiveDemo = project.demo_url && !project.demo_url.includes('github.com');

  return (
    <>
      <SEO
        title={project.title}
        description={project.description}
        url={`/projects/${project.id}`}
      />

      <div className="project-detail-page">
        <Breadcrumbs
          items={[
            { label: 'Home', path: '/' },
            { label: 'Projects', path: '/projects' },
            { label: project.title },
          ]}
        />

        {/* Header */}
        <header className="project-header">
          <div className="project-icon-large">{project.icon || '📁'}</div>
          <div className="project-header-content">
            <h1 className="project-title">{project.title}</h1>
            <p className="project-description">{project.description}</p>

            <div className="project-links">
              {project.url && (
                <a
                  href={project.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="project-link primary"
                >
                  {project.url.includes('github.com') ? '🔗 View on GitHub' : '🔗 View Project'}
                </a>
              )}
              {project.demo_url && (
                <a
                  href={project.demo_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="project-link secondary"
                >
                  🚀 Live Demo
                </a>
              )}
            </div>
          </div>
        </header>

        {/* GitHub Stats */}
        {githubRepoName && (
          <section className="project-section">
            <h2 className="section-title">Repository Stats</h2>
            <RepoStats repoName={githubRepoName} />
          </section>
        )}

        {/* Technologies */}
        {project.technologies && project.technologies.length > 0 && (
          <section className="project-section">
            <h2 className="section-title">Technologies</h2>
            <div className="technologies-list">
              {project.technologies.map((tech) => (
                <span key={tech} className="technology-badge">
                  {tech}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* Live Demo */}
        {hasLiveDemo && (
          <section className="project-section">
            <ProjectDemo url={project.demo_url!} title={project.title} />
          </section>
        )}

        {/* GitHub README */}
        {githubRepoName && (
          <section className="project-section">
            <h2 className="section-title">Documentation</h2>
            <GitHubReadme repoName={githubRepoName} />
          </section>
        )}

        {/* Navigation */}
        <div className="project-footer">
          <Link to="/projects" className="back-link">
            ← All Projects
          </Link>
        </div>
      </div>
    </>
  );
}
```

### Update Project YAML Schema

Add `demo_url` field to project YAML files:

```yaml
# frontend/src/content/projects/shuffify.yaml
id: shuffify
title: Shuffify
description: A Spotify playlist shuffler that creates truly random shuffles
url: https://github.com/chrisrogers37/shuffify
demo_url: https://shuffify.example.com  # NEW FIELD
icon: 🎵
category: Web App
technologies:
  - React
  - TypeScript
  - Spotify API
featured: true
order: 1
status: Active
```

### Update Project Type

```typescript
// frontend/src/types/Project.ts
export interface Project {
  id: string;
  title: string;
  description: string;
  url?: string;
  demo_url?: string;  // NEW FIELD
  icon?: string;
  category?: string;
  technologies?: string[];
  featured?: boolean;
  order?: number;
  status?: string;
}
```

---

## Verification Checklist

### API Tests

- [ ] **Repo endpoint works**: `/api/v1/github/repo/shuffify` returns data
- [ ] **README endpoint works**: `/api/v1/github/readme/shuffify` returns content
- [ ] **Languages endpoint works**: `/api/v1/github/languages/shuffify` returns data
- [ ] **Contributions endpoint works**: `/api/v1/github/contributions` returns data

### Component Tests

- [ ] **README renders**: Markdown displays correctly with syntax highlighting
- [ ] **Stats display**: Stars, forks, watchers show correct numbers
- [ ] **Contribution graph**: Heatmap renders with animation
- [ ] **Demo embeds**: iframe loads correctly with controls

### Integration Tests

- [ ] **Project page complete**: All components display on project detail page
- [ ] **Loading states**: Skeleton loaders show while fetching
- [ ] **Error handling**: Graceful fallback when GitHub API fails
- [ ] **Caching works**: Second page load is faster

---

## Common Issues

### Issue: GitHub API rate limit exceeded

**Cause**: Too many requests without authentication.

**Solution**: Add `GITHUB_TOKEN` to backend `.env` file.

### Issue: README images not loading

**Cause**: Relative paths in README.

**Solution**: The GitHubReadme component converts relative paths to raw.githubusercontent.com URLs.

### Issue: CORS errors on GitHub API

**Cause**: Direct browser requests to GitHub API.

**Solution**: All GitHub requests go through the backend proxy.

---

## Next Steps

After completing Phase 6:

1. **Commit your changes**:
   ```bash
   git add .
   git commit -m "Phase 6: GitHub integration with README rendering and stats"
   ```

2. **Deploy and test** all GitHub features in production

3. **Continue to reference documents**:
   - [09-technical-specifications.md](./09-technical-specifications.md)
   - [10-testing-strategy.md](./10-testing-strategy.md)
   - [11-migration-checklist.md](./11-migration-checklist.md)

---

*Document Version: 1.0.0*
*Last Updated: January 2026*
