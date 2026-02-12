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
