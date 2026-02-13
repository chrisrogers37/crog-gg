import { useState, useEffect, useRef, useMemo } from "react";
import { motion } from "framer-motion";
import { TimelineData, TimelineEntry } from "../../../types/Timeline";
import { LogoImage } from "../../common/LogoImage";
import { SkillBubbles } from "./SkillBubbles";
import "./Timeline.css";

type TimelineProps = {
  data: TimelineData | null;
};

export function Timeline({ data }: TimelineProps) {
  const [visibleIndex, setVisibleIndex] = useState(0);
  const [activeSkills, setActiveSkills] = useState<string[]>([]);
  const entryRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Parse date strings like "Nov 2025", "2023", or "present" into a sortable number (YYYYMM)
  const parseDateToNumber = (dateStr: string): number => {
    if (dateStr === "present") return 999912;
    const months: Record<string, string> = {
      Jan: "01",
      Feb: "02",
      Mar: "03",
      Apr: "04",
      May: "05",
      Jun: "06",
      Jul: "07",
      Aug: "08",
      Sep: "09",
      Oct: "10",
      Nov: "11",
      Dec: "12",
    };
    const parts = dateStr.split(" ");
    if (parts.length === 2 && months[parts[0]]) {
      return Number(parts[1] + months[parts[0]]);
    }
    // Year-only format like "2023" - treat as December of that year
    return Number(parts[0] + "12");
  };

  // Sort entries by end_date descending (newest first) - memoized to avoid
  // recreating the array on every render (which would break useEffect deps)
  const sortedEntries = useMemo(
    () =>
      data?.entries
        ? [...data.entries].sort((a, b) => {
            return (
              parseDateToNumber(b.end_date) - parseDateToNumber(a.end_date)
            );
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
                <LogoImage
                  domain={entry.domain}
                  alt={entry.organization}
                  size={28}
                  className="timeline-dot-logo"
                  fallback={
                    <span className="timeline-icon">
                      {getEntryIcon(entry.type)}
                    </span>
                  }
                />
              </div>
              <div className="timeline-card">
                <div className="timeline-card-header">
                  <span className="timeline-period">{formatPeriod(entry)}</span>
                  <h4 className="timeline-title">{entry.title}</h4>
                  <span className="timeline-org">
                    <LogoImage
                      domain={entry.domain}
                      alt={entry.organization}
                      size={18}
                      className="timeline-org-logo"
                    />
                    {entry.organization}
                  </span>
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
