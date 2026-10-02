/**
 * The shapes of the content files in site/public/content/ (#190 M22), and the
 * check that holds a file to one as it loads. A file that doesn't fit fails
 * with every problem named, path by path, instead of a section that crashes
 * or sorts wrong on some later render.
 */

import { skillColor } from "../utils/skillColor";
import {
  type Check,
  describeProblems,
  fail,
  httpsUrl,
  list,
  matching,
  object,
  oneOf,
  optional,
  record,
  sitePath,
  slug,
  text,
  withDefault,
} from "./check";

const MONTHS = "Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec";
const PERIOD = new RegExp(`^(present|\\d{4}|(${MONTHS}) \\d{4})$`);

/**
 * A timeline date: "Mon YYYY", "YYYY" or present. An unquoted year reaches
 * here as a number, so it's read as text; "Present" is read as present. An
 * unquoted ISO date reaches here as a Date and fails with the same hint.
 */
const period: Check<string> = (value, path, issues) => {
  if (typeof value === "string" || typeof value === "number") {
    const date = String(value).trim().replace(/^present$/i, "present");
    if (PERIOD.test(date)) return date;
  }
  return fail(issues, path, value, 'a date: "Mon YYYY", "YYYY" or present');
};

/**
 * A skill category's colour: "#rrggbb" or "#rgb", as timeline.yaml's header
 * says, kept as #rrggbb. Anything else, or none, gets the default grey, as
 * skillColor gives it (#193), rather than failing the journey.
 */
const skillCategoryColor: Check<string> = (value) =>
  skillColor(typeof value === "string" ? value : undefined);

/** A host name, as a logo is looked up by: "example.com". */
const domain = matching(/^(?!-)[a-z0-9-]+(\.[a-z0-9-]+)+$/i, 'a domain, like "example.com"');

const noSkills = () => [];

export const bioShape = object({
  display_name: text,
  location: optional(text),
  tagline: optional(text),
  about_text: text,
});

export const TIMELINE_ENTRY_TYPES = ["role", "education", "milestone"] as const;

export const timelineShape = object({
  entries: list(
    object({
      type: oneOf(TIMELINE_ENTRY_TYPES),
      title: text,
      organization: text,
      domain: optional(domain),
      start_date: period,
      end_date: period,
      one_liner: text,
      skills: withDefault(list(text), noSkills),
    }),
  ),
  skill_categories: withDefault(
    record(
      object({
        color: skillCategoryColor,
        skills: withDefault(list(text), noSkills),
      }),
    ),
    () => ({}),
  ),
});

const projectFile = matching(/^[a-z0-9]+(?:-[a-z0-9]+)*\.yaml$/, 'a file name, like "my-project.yaml"');

export const projectIndexShape = object({
  projects: list(projectFile),
  /** The one project shown first and largest; one of `projects`. */
  featured: optional(projectFile),
});

export const PROJECT_STATUSES = ["active", "archived", "experimental"] as const;

export const projectShape = object({
  /** It becomes the page's URL and its prerendered file. */
  id: slug,
  title: text,
  description: text,
  url: optional(httpsUrl),
  github: optional(httpsUrl),
  demo: optional(httpsUrl),
  icon: text,
  category: text,
  technologies: withDefault(list(text), noSkills),
  gradient: optional(text),
  status: optional(oneOf(PROJECT_STATUSES)),
});

/** A project file's fields, as checked. */
export type RawProject = ReturnType<typeof projectShape>;

export const showcaseShape = object({
  images: list(object({ src: sitePath, alt: text })),
});

export class ContentError extends Error {
  constructor(file: string, issues: string[]) {
    super(describeProblems(file, issues));
    this.name = "ContentError";
  }
}

/**
 * `raw` (a content file, as YAML parsed it) held to `shape`, or a ContentError
 * naming `file` and every problem. An HTML page served for a missing file
 * parses to a string, so it fails as "the file: expected a mapping".
 */
export function parseContent<T>(shape: Check<T>, raw: unknown, file: string): T {
  const issues: string[] = [];
  const parsed = shape(raw, "", issues);
  if (issues.length > 0) throw new ContentError(file, issues);
  return parsed;
}
