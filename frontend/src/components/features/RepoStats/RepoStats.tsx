import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { githubService, Repository } from "../../../services/githubService";
import { factoryStats, statsForRepo } from "../../../content/factory";
import { formatDay, formatMonth } from "../../../utils/formatDate";
import "./RepoStats.css";

/**
 * Below this many stars, star, fork and watcher counts read as "unused" rather
 * than "early", so they're left out (#176, #181 G4).
 */
export const STAR_THRESHOLD = 25;

interface RepoStatsProps {
  repoName: string;
}

/**
 * RepoStats
 *
 * Displays GitHub repository statistics including:
 * - Stars, forks, watchers, once the stars reach STAR_THRESHOLD
 * - Pull requests merged, from the dated snapshot in content/factory-stats.json
 *   (open issues aren't shown: the fleet files its own work queue, so their
 *   count says nothing about how finished an app is)
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
      // The detail page also keys this by project. For a caller that doesn't,
      // this still clears the last repo's figures, a frame after the change.
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

  // The snapshot needs no network, so a failed or rate-limited live call only
  // costs the live figures: stars, forks and the meta row.
  const factory = statsForRepo(repoName);
  if (!repo && !factory) {
    return null;
  }

  const stats = [
    ...(repo && repo.stargazers_count >= STAR_THRESHOLD
      ? [
          { label: "Stars", value: repo.stargazers_count, icon: "⭐" },
          { label: "Forks", value: repo.forks_count, icon: "🍴" },
          { label: "Watchers", value: repo.watchers_count, icon: "👀" },
        ]
      : []),
    ...(factory
      ? [
          { label: "PRs merged", value: factory.merged.value, icon: "🔀" },
          {
            label: "In the last 30 days",
            value: factory.mergedLast30Days.value,
            icon: "📈",
          },
        ]
      : []),
  ];


  return (
    <div className="repo-stats">
      {/* Main stats */}
      {stats.length > 0 && (
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
      )}
      {factory && (
        <p className="stats-source">
          Pull requests merged since the fleet started in{" "}
          {formatMonth(factoryStats.since)}, not counting dependency bots, as of{" "}
          {formatDay(factoryStats.asOf)}.
        </p>
      )}

      {/* Meta info */}
      {repo && (
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
            <span className="meta-icon">🕐</span> Updated{" "}
            {new Date(repo.pushed_at).toLocaleDateString("en-US", {
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
          </span>
        </div>
      )}

      {/* Topics */}
      {repo?.topics && repo.topics.length > 0 && (
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
