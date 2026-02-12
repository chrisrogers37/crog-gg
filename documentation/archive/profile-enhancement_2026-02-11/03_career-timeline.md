# Phase 03: Interactive Career Timeline with Skill Bubbles

**Status:** ✅ COMPLETE
**Completed:** 2026-02-12
**PR Title:** Replace Experience/Education/Skills with interactive career timeline
**Risk Level:** Low
**Estimated Effort:** Large (8-12 hours)

## Files Modified

| Action   | File                                                         |
| -------- | ------------------------------------------------------------ |
| Created  | `frontend/public/content/timeline.yaml`                      |
| Created  | `frontend/src/types/Timeline.ts`                             |
| Created  | `frontend/src/utils/timelineLoader.ts`                       |
| Created  | `frontend/src/components/sections/Timeline/Timeline.tsx`     |
| Created  | `frontend/src/components/sections/Timeline/Timeline.css`     |
| Created  | `frontend/src/components/sections/Timeline/SkillBubbles.tsx` |
| Created  | `frontend/src/components/sections/Timeline/index.ts`         |
| Modified | `frontend/src/components/SectionNav.tsx`                     |
| Modified | `frontend/src/pages/Home/HomePage.tsx`                       |
| Modified | `frontend/src/store/contentStore.ts`                         |
| Modified | `frontend/src/data/resume.ts`                                |
| Modified | `frontend/src/types/content.ts`                              |

## Context

This is the centerpiece enhancement. Currently, Experience, Education, and Skills are three disconnected tab sections:

- Experience shows 3 job cards with heavy achievement bullet lists (5+ bullets each)
- Education shows 3 degrees as standalone cards
- Skills shows a randomized word cloud that shuffles on every visit

The user's vision: **a vertical scroll timeline where time is the backbone.** Each role gets one punchy bullet. Skills appear as floating bubbles along the side, fading in/out based on what was being used at each career stage. Education entries are woven into the timeline at their chronological position. Scrolling = traveling back in time.

This merges 3 disconnected sections into one cohesive narrative and directly delivers the "tells my story" vision.

## Dependencies

- **Depends on:** Phase 01 (hero sets narrative tone above the timeline)
- **Unlocks:** Phase 04 (section flow navigation needs new section structure)

## Detailed Implementation Plan

### Step 1: Create timeline.yaml

**File:** `frontend/public/content/timeline.yaml` (NEW)

This merges data from experience.yaml, education.yaml, and skills.yaml into a single chronological timeline. Each entry gets ONE punchy bullet. Skills are tagged to the periods where they were actively used.

```yaml
# Career Timeline - Chronological journey with contextual skills
# Entries are ordered newest-first (present at top, oldest at bottom)

entries:
  - type: role
    title: Blockchain Data Engineer
    organization: Citadel
    start_date: "2023"
    end_date: present
    one_liner: re-architecting a multi-trillion record blockchain analytics ecosystem with dbt
    skills:
      - python
      - sql
      - dbt
      - bigquery
      - google cloud platform
      - airflow
      - kubernetes
      - docker
      - git

  - type: education
    title: MS (partial), Applied Analytics
    organization: Columbia University
    start_date: "2020"
    end_date: "2021"
    one_liner: dove deeper into analytics and data science at the graduate level
    skills:
      - python
      - statistical testing
      - regression
      - classification

  - type: role
    title: Data Scientist
    organization: Meta
    start_date: "2021"
    end_date: "2023"
    one_liner: supported recruiting product teams with metric design, experimentation, and forecasting
    skills:
      - python
      - sql
      - statistical testing
      - experimentation
      - regression
      - forecasting
      - metric design
      - tableau

  - type: role
    title: Business Intelligence Analyst II
    organization: Memorial Sloan Kettering
    start_date: "2018"
    end_date: "2021"
    one_liner: published nlp research and built analytics that informed hospital-wide policy
    skills:
      - python
      - sql
      - R
      - tableau
      - natural language processing
      - classification
      - time series analysis

  - type: education
    title: MEng, Chemical Engineering
    organization: Cornell University
    start_date: "2014"
    end_date: "2015"
    one_liner: engineering masters with a focus on process optimization
    skills: []

  - type: education
    title: BS, Chemical Engineering
    organization: Cornell University
    start_date: "2010"
    end_date: "2014"
    one_liner: where it all started - engineering fundamentals and problem solving
    skills: []

# All skills with metadata for the bubble display
skill_categories:
  languages:
    color: "#3178C6"
    skills:
      - python
      - sql
      - R
  data_tools:
    color: "#10B981"
    skills:
      - dbt
      - bigquery
      - tableau
      - airflow
  cloud_infra:
    color: "#8B5CF6"
    skills:
      - google cloud platform
      - aws
      - kubernetes
      - docker
      - git
  data_science:
    color: "#F59E0B"
    skills:
      - statistical testing
      - experimentation
      - regression
      - classification
      - natural language processing
      - forecasting
      - time series analysis
      - metric design
  creative:
    color: "#EC4899"
    skills:
      - llms
      - ableton
      - adobe premiere pro
      - object-oriented programming
      - data modeling
```

### Step 2: Create Timeline types

**File:** `frontend/src/types/Timeline.ts` (NEW)

```typescript
export type TimelineEntryType = "role" | "education" | "milestone";

export type TimelineEntry = {
  type: TimelineEntryType;
  title: string;
  organization: string;
  start_date: string;
  end_date: string;
  one_liner: string;
  skills: string[];
};

export type SkillCategory = {
  color: string;
  skills: string[];
};

export type TimelineData = {
  entries: TimelineEntry[];
  skill_categories: Record<string, SkillCategory>;
};
```

### Step 3: Create timeline loader

**File:** `frontend/src/utils/timelineLoader.ts` (NEW)

```typescript
import yaml from "js-yaml";
import { TimelineData } from "../types/Timeline";

export async function loadTimeline(): Promise<TimelineData> {
  try {
    const response = await fetch("/content/timeline.yaml");
    if (!response.ok) {
      throw new Error(`Failed to load timeline: ${response.status}`);
    }
    const text = await response.text();
    const data = yaml.load(text) as TimelineData;
    return data;
  } catch (error) {
    console.error("Failed to load timeline data:", error);
    return { entries: [], skill_categories: {} };
  }
}
```

### Step 4: Create SkillBubbles component

**File:** `frontend/src/components/sections/Timeline/SkillBubbles.tsx` (NEW)

```tsx
import { motion, AnimatePresence } from "framer-motion";
import { SkillCategory } from "../../../types/Timeline";

type SkillBubblesProps = {
  activeSkills: string[];
  skillCategories: Record<string, SkillCategory>;
};

export function SkillBubbles({
  activeSkills,
  skillCategories,
}: SkillBubblesProps) {
  // Build a map of skill -> color from categories
  const skillColorMap: Record<string, string> = {};
  Object.values(skillCategories).forEach((category) => {
    category.skills.forEach((skill) => {
      skillColorMap[skill] = category.color;
    });
  });

  return (
    <div className="skill-bubbles">
      <AnimatePresence>
        {activeSkills.map((skill) => (
          <motion.span
            key={skill}
            className="skill-bubble"
            style={{
              backgroundColor: `${skillColorMap[skill] || "#6B7280"}20`,
              color: skillColorMap[skill] || "#6B7280",
              borderColor: `${skillColorMap[skill] || "#6B7280"}40`,
            }}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.3 }}
          >
            {skill}
          </motion.span>
        ))}
      </AnimatePresence>
    </div>
  );
}
```

### Step 5: Create Timeline component

**File:** `frontend/src/components/sections/Timeline/Timeline.tsx` (NEW)

```tsx
import { useState, useEffect, useRef } from "react";
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

  // Sort entries by start_date descending (newest first)
  const sortedEntries = data?.entries
    ? [...data.entries].sort((a, b) => {
        const aDate = a.end_date === "present" ? "9999" : a.end_date;
        const bDate = b.end_date === "present" ? "9999" : b.end_date;
        return bDate.localeCompare(aDate);
      })
    : [];

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
  }, [sortedEntries.length]);

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
        return "\uD83D\uDCBC"; // briefcase
      case "education":
        return "\uD83C\uDF93"; // graduation cap
      case "milestone":
        return "\u2B50"; // star
      default:
        return "\u25CF"; // bullet
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
```

### Step 6: Create Timeline styles

**File:** `frontend/src/components/sections/Timeline/Timeline.css` (NEW)

```css
/* Timeline Container */
.timeline-container {
  padding: 1rem 0;
}

.timeline-layout {
  display: grid;
  grid-template-columns: 1fr 240px;
  gap: 2rem;
}

/* Timeline Track */
.timeline-track {
  position: relative;
  padding: 1rem 0;
}

.timeline-line {
  position: absolute;
  left: 50%;
  top: 0;
  bottom: 0;
  width: 2px;
  background: var(--border-color);
  transform: translateX(-50%);
}

/* Timeline Entry */
.timeline-entry {
  position: relative;
  display: flex;
  align-items: flex-start;
  margin-bottom: 2rem;
  width: 100%;
}

.timeline-left {
  flex-direction: row;
  padding-right: calc(50% + 1.5rem);
}

.timeline-left .timeline-card {
  text-align: right;
  margin-left: auto;
}

.timeline-right {
  flex-direction: row-reverse;
  padding-left: calc(50% + 1.5rem);
}

.timeline-right .timeline-card {
  text-align: left;
}

/* Timeline Dot */
.timeline-dot {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 50%;
  background: var(--card-background);
  border: 2px solid var(--border-color);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2;
}

.timeline-icon {
  font-size: 1rem;
  line-height: 1;
}

.timeline-entry-role .timeline-dot {
  border-color: var(--primary-color);
}

.timeline-entry-education .timeline-dot {
  border-color: #8b5cf6;
}

/* Timeline Card */
.timeline-card {
  max-width: calc(50% - 2.5rem);
  padding: 1rem 1.25rem;
  background: var(--card-background);
  border: 1px solid var(--border-color);
  border-radius: 0.75rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  transition:
    box-shadow 0.2s,
    transform 0.2s;
}

.timeline-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
  transform: translateY(-1px);
}

.timeline-card-header {
  margin-bottom: 0.5rem;
}

.timeline-period {
  font-size: 0.8rem;
  color: var(--text-secondary);
  font-weight: 500;
}

.timeline-title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0.25rem 0 0.15rem;
}

.timeline-org {
  font-size: 0.9rem;
  color: var(--text-secondary);
}

.timeline-one-liner {
  font-size: 0.9rem;
  color: var(--text-secondary);
  margin: 0;
  line-height: 1.5;
}

/* Skills Sidebar */
.timeline-skills-sidebar {
  position: relative;
}

.timeline-skills-sticky {
  position: sticky;
  top: 2rem;
}

.timeline-skills-heading {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-secondary);
  margin: 0 0 0.75rem;
  text-transform: lowercase;
}

/* Skill Bubbles */
.skill-bubbles {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}

.skill-bubble {
  display: inline-block;
  padding: 0.3rem 0.7rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 500;
  border: 1px solid;
  white-space: nowrap;
}

/* Mobile: Single column, skills below each entry */
@media (max-width: 768px) {
  .timeline-layout {
    grid-template-columns: 1fr;
  }

  .timeline-line {
    left: 1.25rem;
  }

  .timeline-left,
  .timeline-right {
    padding-left: 3.5rem;
    padding-right: 0;
    flex-direction: row;
  }

  .timeline-left .timeline-card,
  .timeline-right .timeline-card {
    text-align: left;
    max-width: 100%;
    margin-left: 0;
  }

  .timeline-dot {
    left: 1.25rem;
  }

  .timeline-skills-sidebar {
    order: -1;
    margin-bottom: 1rem;
  }

  .timeline-skills-sticky {
    position: relative;
    top: 0;
  }
}

@media (max-width: 480px) {
  .timeline-entry {
    margin-bottom: 1.5rem;
  }

  .timeline-card {
    padding: 0.75rem 1rem;
  }
}
```

### Step 7: Create Timeline barrel export

**File:** `frontend/src/components/sections/Timeline/index.ts` (NEW)

```typescript
export { Timeline } from "./Timeline";
export { SkillBubbles } from "./SkillBubbles";
```

### Step 8: Add Timeline type exports

**File:** `frontend/src/types/content.ts`

**Add import** at the top (after line 4):

**Before:**

```typescript
import { BioData } from "./Bio";
import { Employment } from "./Experience";
import { Education } from "./Education";
import { Skill } from "./Skills";
```

**After:**

```typescript
import { BioData } from "./Bio";
import { Employment } from "./Experience";
import { Education } from "./Education";
import { Skill } from "./Skills";
import { TimelineData } from "./Timeline";
```

**Add timeline to ContentState** (after line 21):

**Before:**

```typescript
export interface ContentState {
  about: BioData;
  portfolio: PortfolioContent;
  skills: Skill[];
}
```

**After:**

```typescript
export interface ContentState {
  about: BioData;
  portfolio: PortfolioContent;
  skills: Skill[];
  timeline: TimelineData | null;
}
```

### Step 9: Update contentStore to load timeline data

**File:** `frontend/src/store/contentStore.ts`

**Add import** at line 3 (after existing imports):

**Before (line 3):**

```typescript
import { BioData, Employment, Education, Skill, Project } from "../types";
```

**After:**

```typescript
import { BioData, Employment, Education, Skill, Project } from "../types";
import { TimelineData } from "../types/Timeline";
import { loadTimeline } from "../utils/timelineLoader";
```

**Add timeline to ContentState interface** (after line 16, after `projects`):

**Before (lines 10-17):**

```typescript
interface ContentState {
  // Data
  bio: BioData | null;
  experience: Employment[];
  education: Education[];
  skills: Skill[];
  projects: Project[];
```

**After:**

```typescript
interface ContentState {
  // Data
  bio: BioData | null;
  experience: Employment[];
  education: Education[];
  skills: Skill[];
  projects: Project[];
  timeline: TimelineData | null;
```

**Add to initialState** (after line 62, after `projects: []`):

```typescript
  timeline: null,
```

**Update loadContent action** to also load timeline (modify the `loadContent` function around line 96):

**Before (lines 96-121):**

```typescript
      loadContent: async () => {
        try {
          set({ isLoading: true, error: null });

          const data = await loadResumeData();

          set({
            bio: data.bio,
            experience: data.experience,
            education: data.education,
            skills: data.skills,
            projects: data.projects,
            // Store originals for reset
            originalBio: data.bio,
            originalExperience: data.experience,
            originalEducation: data.education,
            isLoading: false,
          });
```

**After:**

```typescript
      loadContent: async () => {
        try {
          set({ isLoading: true, error: null });

          const [data, timelineData] = await Promise.all([
            loadResumeData(),
            loadTimeline(),
          ]);

          set({
            bio: data.bio,
            experience: data.experience,
            education: data.education,
            skills: data.skills,
            projects: data.projects,
            timeline: timelineData,
            // Store originals for reset
            originalBio: data.bio,
            originalExperience: data.experience,
            originalEducation: data.education,
            isLoading: false,
          });
```

**Add selector** at the bottom of the file (after line 324):

```typescript
export const useTimeline = () => useContentStore((state) => state.timeline);
```

### Step 10: Update SectionNav to replace 3 sections with "Journey"

**File:** `frontend/src/components/SectionNav.tsx`

**Before (lines 8-15):**

```typescript
const sections = [
  { id: "about", label: "About" },
  { id: "experience", label: "Experience" },
  { id: "skills", label: "Skills" },
  { id: "education", label: "Education" },
  { id: "projects", label: "Projects" },
  { id: "music", label: "Music" },
];
```

**After:**

```typescript
const sections = [
  { id: "about", label: "About" },
  { id: "journey", label: "Journey" },
  { id: "projects", label: "Projects" },
  { id: "music", label: "Music" },
];
```

### Step 11: Update HomePage to render Timeline

**File:** `frontend/src/pages/Home/HomePage.tsx`

**Add imports** (after existing section imports around line 24):

**Before (lines 24-29):**

```typescript
import {
  Experience,
  Education,
  Projects,
  Music,
} from "../../components/sections";
```

**After:**

```typescript
import {
  Experience,
  Education,
  Projects,
  Music,
} from "../../components/sections";
import { Timeline } from "../../components/sections/Timeline";
```

**Add timeline store selector** (after line 15, add `useTimeline` to the store imports):

**Before (lines 10-16):**

```typescript
import {
  useUIStore,
  useIsLoading,
  useContentError,
  useBio,
  useSkills,
} from "../../store";
```

**After:**

```typescript
import {
  useUIStore,
  useIsLoading,
  useContentError,
  useBio,
  useSkills,
} from "../../store";
import { useTimeline } from "../../store/contentStore";
```

**Add timeline to component body** (after line 88, `const skills = useSkills();`):

```typescript
const timeline = useTimeline();
```

**Update renderActiveSection** to handle "journey" instead of "experience", "skills", "education":

**Before (lines 106-142):**

```typescript
  const renderActiveSection = () => {
    let content: React.ReactNode;
    switch (activeSection) {
      case "about":
        content = (
          <section className="section-content about-section">
            <div className="about-content">
              <About onRegenerate={() => {}} content={bio ?? undefined} />
            </div>
          </section>
        );
        break;
      case "skills":
        content = <Skills skills={skills} />;
        break;
      case "experience":
        content = <Experience />;
        break;
      case "education":
        content = <Education />;
        break;
      case "projects":
        content = <Projects />;
        break;
      case "music":
        content = <Music />;
        break;
      default:
        return null;
    }
```

**After:**

```typescript
  const renderActiveSection = () => {
    let content: React.ReactNode;
    switch (activeSection) {
      case "about":
        content = (
          <section className="section-content about-section">
            <div className="about-content">
              <About onRegenerate={() => {}} content={bio ?? undefined} />
            </div>
          </section>
        );
        break;
      case "journey":
        content = <Timeline data={timeline} />;
        break;
      case "projects":
        content = <Projects />;
        break;
      case "music":
        content = <Music />;
        break;
      default:
        return null;
    }
```

**Update the loading skeleton** to reflect new section labels (lines 163-174):

**Before:**

```typescript
            {[
              "about",
              "experience",
              "skills",
              "education",
              "projects",
              "music",
            ].map((id) => (
```

**After:**

```typescript
            {[
              "about",
              "journey",
              "projects",
              "music",
            ].map((id) => (
```

## Test Plan

### Unit Tests

Create `frontend/src/components/sections/Timeline/__tests__/Timeline.test.tsx`:

```typescript
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Timeline } from "../Timeline";

const mockData = {
  entries: [
    {
      type: "role" as const,
      title: "Data Engineer",
      organization: "Citadel",
      start_date: "2023",
      end_date: "present",
      one_liner: "building data pipelines",
      skills: ["python", "sql"],
    },
    {
      type: "education" as const,
      title: "BS, Engineering",
      organization: "Cornell",
      start_date: "2010",
      end_date: "2014",
      one_liner: "engineering fundamentals",
      skills: [],
    },
  ],
  skill_categories: {
    languages: { color: "#3178C6", skills: ["python", "sql"] },
  },
};

describe("Timeline", () => {
  it("renders timeline entries", () => {
    render(<Timeline data={mockData} />);
    expect(screen.getByText("Data Engineer")).toBeInTheDocument();
    expect(screen.getByText("Citadel")).toBeInTheDocument();
    expect(screen.getByText("Cornell")).toBeInTheDocument();
  });

  it("renders loading state when data is null", () => {
    render(<Timeline data={null} />);
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it("displays one-liners for each entry", () => {
    render(<Timeline data={mockData} />);
    expect(screen.getByText("building data pipelines")).toBeInTheDocument();
  });
});
```

### E2E Test

Update `frontend/e2e/home.spec.ts`:

```typescript
test("journey section shows timeline", async ({ page }) => {
  // Click the Journey tab
  const journeyTab = page.locator('button[data-section="journey"]');
  await journeyTab.click();

  // Verify timeline renders
  const timeline = page.locator(".timeline-container");
  await expect(timeline).toBeVisible({ timeout: 5000 });

  // Verify at least one entry exists
  const entries = page.locator(".timeline-entry");
  await expect(entries.first()).toBeVisible();

  // Verify skill bubbles area exists
  const skills = page.locator(".skill-bubbles");
  await expect(skills).toBeVisible();
});
```

## Documentation Updates

- New content file: `frontend/public/content/timeline.yaml`
- New types: `frontend/src/types/Timeline.ts`
- SectionNav sections changed from 6 to 4: About, Journey, Projects, Music

## Edge Cases

1. **timeline.yaml fails to load:** timelineLoader returns `{ entries: [], skill_categories: {} }`, Timeline component shows "Loading journey..." fallback
2. **Empty entries array:** Same fallback message
3. **No skills on an entry:** SkillBubbles handles empty arrays gracefully (nothing renders)
4. **Very long one-liner:** CSS `line-height: 1.5` and natural word wrap handle this
5. **Window resize:** CSS grid collapses to single column at 768px
6. **Intersection Observer not supported:** Entries still render, just without scroll-triggered animations

## Verification Checklist

```bash
cd frontend && npm run build
cd frontend && npm run lint
cd frontend && npm run test:run
cd frontend && npm run test:e2e
```

- [ ] Journey tab appears in navigation (replaces Experience, Skills, Education)
- [ ] Timeline renders with all entries in chronological order (newest first)
- [ ] Role entries have briefcase icon, education entries have graduation cap
- [ ] Entries alternate left/right on desktop
- [ ] Entries are single column on mobile (below 768px)
- [ ] Skill bubbles appear in sidebar on desktop
- [ ] Skill bubbles accumulate as you scroll down the timeline
- [ ] Cards have hover effect (slight lift + shadow)
- [ ] Dark mode renders correctly
- [ ] Loading skeleton shows 4 nav buttons (not 6)

## What NOT To Do

- **Don't delete the old Experience, Education, Skills components** - keep them importable for backward compatibility and AI regeneration
- **Don't use `enum`** for TimelineEntryType - use string literal union (already done above)
- **Don't hard-code content in JSX** - all text comes from timeline.yaml
- **Don't use em-dashes** in one-liner content
- **Don't add more than 1 bullet per entry** - the whole point is concise one-liners
- **Don't make skills randomize** - they should appear in consistent order based on categories
- **Don't import the old `Skills` component in the switch statement** - the Journey tab replaces it
