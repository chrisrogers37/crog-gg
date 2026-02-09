import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  githubService,
  ContributionData,
} from "../../../services/githubService";
import "./ContributionGraph.css";

interface ContributionGraphProps {
  className?: string;
}

/**
 * ContributionGraph
 *
 * GitHub-style contribution heatmap showing daily activity.
 */
export function ContributionGraph({ className = "" }: ContributionGraphProps) {
  const [data, setData] = useState<ContributionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchContributions() {
      try {
        const contributions = await githubService.getContributions();
        setData(contributions);
      } catch (err) {
        console.error("Failed to fetch contributions:", err);
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

  const levelClasses = [
    "level-0", // no contributions
    "level-1",
    "level-2",
    "level-3",
    "level-4",
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
                  className={`graph-day ${levelClasses[day.level]}`}
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
        {levelClasses.map((levelClass, index) => (
          <div key={index} className={`legend-box ${levelClass}`} />
        ))}
        <span className="legend-label">More</span>
      </div>
    </div>
  );
}
