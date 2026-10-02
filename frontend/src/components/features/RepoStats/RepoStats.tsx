import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { githubService, Repository } from "../../../services/githubService";
import "./RepoStats.css";

interface RepoStatsProps {
  /** The repo's owner, from the project's own GitHub URL. */
  owner: string;
  repoName: string;
}

/** A typical repo's figures, which the panel lays out unseen while it loads. */
const PLACEHOLDER: Pick<
  Repository,
  | "stargazers_count"
  | "forks_count"
  | "watchers_count"
  | "open_issues_count"
  | "language"
  | "license"
  | "pushed_at"
  | "topics"
> = {
  stargazers_count: 0,
  forks_count: 0,
  watchers_count: 0,
  open_issues_count: 0,
  language: "TypeScript",
  license: { name: "MIT License", spdx_id: "MIT" },
  pushed_at: "2026-01-01T00:00:00Z",
  topics: [],
};

/**
 * RepoStats
 *
 * Displays GitHub repository statistics including:
 * - Stars, forks, watchers
 * - Primary language
 * - Last updated date
 * - License
 */
export function RepoStats({ owner, repoName }: RepoStatsProps) {
  const [repo, setRepo] = useState<Repository | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let ignore = false;

    async function fetchRepo() {
      // Another repo starts from nothing, and a late answer for the last one
      // is ignored, so its figures never show on this one's page (#196 M68).
      // The detail page also keys this by project. For a caller that doesn't,
      // this still clears the last repo's figures, a frame after the change.
      setRepo(null);
      setIsLoading(true);
      try {
        const data = await githubService.getRepository(owner, repoName);
        if (!ignore) {
          setRepo(data);
        }
      } catch (err) {
        if (!ignore) {
          console.error("Failed to fetch repo:", err);
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }

    fetchRepo();
    return () => {
      ignore = true;
    };
  }, [owner, repoName]);

  if (!isLoading && !repo) {
    return null;
  }

  // While it loads, the panel is a typical repo's, unseen behind a skeleton,
  // so the real figures arriving move nothing below it, at any width: a
  // fixed-height block was shorter than the panel, which wraps on a phone.
  const shown = repo ?? PLACEHOLDER;

  const stats = [
    { label: "Stars", value: shown.stargazers_count, icon: "⭐" },
    { label: "Forks", value: shown.forks_count, icon: "🍴" },
    { label: "Watchers", value: shown.watchers_count, icon: "👀" },
    { label: "Issues", value: shown.open_issues_count, icon: "🐛" },
  ];

  const lastUpdated = new Date(shown.pushed_at).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  const panel = (
    <>
      {/* Main stats */}
      <div className="stats-grid">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            className="stat-item"
            initial={repo ? { opacity: 0, y: 10 } : false}
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
        {shown.language && (
          <span className="meta-item">
            <span
              className="meta-dot"
              style={{ background: getLanguageColor(shown.language) }}
            />
            {shown.language}
          </span>
        )}
        {shown.license && (
          <span className="meta-item">
            <span className="meta-icon">📜</span> {shown.license.spdx_id}
          </span>
        )}
        <span className="meta-item">
          <span className="meta-icon">🕐</span> Updated {lastUpdated}
        </span>
      </div>

      {/* Topics */}
      {shown.topics && shown.topics.length > 0 && (
        <div className="repo-topics">
          {shown.topics.map((topic) => (
            <span key={topic} className="topic-tag">
              {topic}
            </span>
          ))}
        </div>
      )}
    </>
  );

  return repo ? (
    <div className="repo-stats">{panel}</div>
  ) : (
    <div className="repo-stats loading" role="status" aria-label="Loading repository stats">
      <div aria-hidden="true">{panel}</div>
    </div>
  );
}

// Language color mapping (subset of GitHub's colors)
function getLanguageColor(language: string): string {
  const colors: Record<string, string> = {
    JavaScript: "#f1e05a",
    TypeScript: "#3178c6",
    Python: "#3572A5",
    Java: "#b07219",
    Go: "#00ADD8",
    Rust: "#dea584",
    Ruby: "#701516",
    CSS: "#563d7c",
    HTML: "#e34c26",
    Shell: "#89e051",
  };
  return colors[language] || "#8b8b8b";
}
