import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { githubService, Repository } from "../../../services/githubService";
import "./RepoStats.css";

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
    let ignore = false;

    async function fetchRepo() {
      // Another repo starts from nothing, and a late answer for the last one
      // is ignored, so its figures never show on this one's page (#196 M68).
      // The detail page also keys this by project; this keeps RepoStats right
      // for a caller that doesn't.
      setRepo(null);
      setIsLoading(true);
      try {
        const data = await githubService.getRepository(repoName);
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
    { label: "Stars", value: repo.stargazers_count, icon: "⭐" },
    { label: "Forks", value: repo.forks_count, icon: "🍴" },
    { label: "Watchers", value: repo.watchers_count, icon: "👀" },
    { label: "Issues", value: repo.open_issues_count, icon: "🐛" },
  ];

  const lastUpdated = new Date(repo.pushed_at).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
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
            <span
              className="meta-dot"
              style={{ background: getLanguageColor(repo.language) }}
            />
            {repo.language}
          </span>
        )}
        {repo.license && (
          <span className="meta-item">
            <span className="meta-icon">📜</span> {repo.license.spdx_id}
          </span>
        )}
        <span className="meta-item">
          <span className="meta-icon">🕐</span> Updated {lastUpdated}
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
