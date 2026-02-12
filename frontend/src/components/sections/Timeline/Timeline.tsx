import { useState, useEffect, useRef, useMemo } from "react";
import { motion } from "framer-motion";
import { TimelineData, TimelineEntry } from "../../../types/Timeline";
import { SkillBubbles } from "./SkillBubbles";
import "./Timeline.css";

type TimelineProps = {
  data: TimelineData | null;
};

export function Timeline({ data }: TimelineProps) {
  const [visibleIndex, setVisibleIndex] = useState(0);
  const [activeSkills, setActiveSkills] = useState<string[]>([]);
  const entryRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Sort entries by end_date descending (newest first) - memoized to avoid
  // recreating the array on every render (which would break useEffect deps)
  const sortedEntries = useMemo(
    () =>
      data?.entries
        ? [...data.entries].sort((a, b) => {
            const aDate = a.end_date === "present" ? "9999" : a.end_date;
            const bDate = b.end_date === "present" ? "9999" : b.end_date;
            return bDate.localeCompare(aDate);
          })
        : [],
    [data?.entries],
  );

  // Track which entries are visible using Intersection Observer
  useEffect(() => {
    if (!sortedEntries.length) return;

    const observer = new IntersectionObserver(
      (observerEntries) => {
        let highestVisible = 0;
        observerEntries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = Number((entry.target as HTMLElement).dataset.index);
            if (index > highestVisible) {
              highestVisible = index;
            }
          }
        });
        setVisibleIndex((prev) => Math.max(prev, highestVisible));
      },
      { threshold: 0.3 },
    );

    entryRefs.current.forEach((ref) => {
      if (ref) observer.observe(ref);
    });

    return () => observer.disconnect();
  }, [sortedEntries]);

  // Update active skills based on visible entries
  useEffect(() => {
    const skills = new Set<string>();
    sortedEntries.slice(0, visibleIndex + 1).forEach((entry) => {
      entry.skills.forEach((skill) => skills.add(skill));
    });
    setActiveSkills(Array.from(skills));
  }, [visibleIndex, sortedEntries]);

  if (!data || !sortedEntries.length) {
    return (
      <div className="timeline-container">
        <p>Loading journey...</p>
      </div>
    );
  }

  const getEntryIcon = (type: TimelineEntry["type"]) => {
    switch (type) {
      case "role":
        return "\uD83D\uDCBC";
      case "education":
        return "\uD83C\uDF93";
      case "milestone":
        return "\u2B50";
      default:
        return "\u25CF";
    }
  };

  const formatPeriod = (entry: TimelineEntry) => {
    if (entry.end_date === "present") {
      return `${entry.start_date} - present`;
    }
    if (entry.start_date === entry.end_date) {
      return entry.start_date;
    }
    return `${entry.start_date} - ${entry.end_date}`;
  };

  return (
    <div className="timeline-container">
      <div className="timeline-layout">
        {/* Timeline track */}
        <div className="timeline-track">
          <div className="timeline-line" />

          {sortedEntries.map((entry, index) => (
            <motion.div
              key={`${entry.organization}-${entry.start_date}`}
              ref={(el) => {
                entryRefs.current[index] = el;
              }}
              data-index={index}
              className={`timeline-entry timeline-entry-${entry.type} ${
                index % 2 === 0 ? "timeline-left" : "timeline-right"
              }`}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
            >
              <div className="timeline-dot">
                <span className="timeline-icon">
                  {getEntryIcon(entry.type)}
                </span>
              </div>
              <div className="timeline-card">
                <div className="timeline-card-header">
                  <span className="timeline-period">{formatPeriod(entry)}</span>
                  <h4 className="timeline-title">{entry.title}</h4>
                  <span className="timeline-org">{entry.organization}</span>
                </div>
                <p className="timeline-one-liner">{entry.one_liner}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Skill bubbles sidebar */}
        <aside className="timeline-skills-sidebar">
          <div className="timeline-skills-sticky">
            <h4 className="timeline-skills-heading">skills along the way</h4>
            <SkillBubbles
              activeSkills={activeSkills}
              skillCategories={data.skill_categories}
            />
          </div>
        </aside>
      </div>
    </div>
  );
}
