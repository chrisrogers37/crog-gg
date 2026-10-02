import { useState, useEffect, useRef, useMemo } from "react";
import { motion } from "framer-motion";
import { TimelineData, TimelineEntry } from "../../../types/Timeline";
import { parseDateToNumber } from "../../../utils/dateUtils";
import { LogoImage } from "../../common/LogoImage";
import { SkillBubbles } from "./SkillBubbles";
import "./Timeline.css";

type TimelineProps = {
  data: TimelineData | null;
};

export function Timeline({ data }: TimelineProps) {
  const [visibleIndex, setVisibleIndex] = useState(0);
  const entryRefs = useRef<(HTMLDivElement | null)[]>([]);

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

  // Active skills are derived from the visible entries rather than stored
  // alongside them. Computing this in an effect meant the first painted frame
  // had an empty bubble row, which gained its first line one frame later and
  // pushed everything below it down -- at narrow widths the bubbles sit above
  // the timeline, so that is the whole section and the buttons beneath it. A
  // value computed during render is present on the first paint, so there is no
  // zero-height frame to grow out of.
  const activeSkills = useMemo(() => {
    const skills = new Set<string>();
    sortedEntries.slice(0, visibleIndex + 1).forEach((entry) => {
      entry.skills.forEach((skill) => skills.add(skill));
    });
    return Array.from(skills);
  }, [visibleIndex, sortedEntries]);

  // The page shows a failed load itself (HomePage); here it's still on its
  // way, or it came with nothing in it.
  if (!data || !sortedEntries.length) {
    return (
      <div className="timeline-container">
        <p>{data ? "Nothing on the journey yet." : "Loading journey..."}</p>
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
              // Two roles at one place can start the same month (#190 M22).
              key={`${entry.organization}-${entry.start_date}-${entry.title}`}
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
                  alt=""
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
                  <h3 className="timeline-title">{entry.title}</h3>
                  <span className="timeline-org">
                    <LogoImage
                      domain={entry.domain}
                      alt=""
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
            <h3 className="timeline-skills-heading">skills along the way</h3>
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
