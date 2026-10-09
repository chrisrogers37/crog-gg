/**
 * The shape of site/site.yaml, the owner's identity (#188), and the check that
 * holds a file to it, built from the checks in check.ts. The SiteConfig type
 * is inferred from the same shape.
 */

import {
  type Check,
  describeProblems,
  fail,
  flag,
  httpsUrl,
  list,
  matching,
  object,
  oneOf,
  optional,
  parseUrl,
  shareImage,
  sitePath,
  slug,
  text,
} from "./check";

/** An https origin with no path, so `${url}/about` is a URL. */
const origin: Check<string> = (value, path, issues) => {
  const url = typeof value === "string" ? parseUrl(value) : null;
  return url?.protocol === "https:" && url.origin === value
    ? (value as string)
    : fail(issues, path, value, "an https origin with no path or trailing slash");
};

const email = matching(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "an email address");

/** What GitHub accepts as a username or organisation. */
const githubName = matching(/^[A-Za-z0-9-]{1,39}$/, "a GitHub username");

/** The places a social link can show, and the icons the surfaces draw. */
export const SOCIAL_PLACES = ["footer", "menu", "contact", "music", "schema"] as const;
export type SocialPlace = (typeof SOCIAL_PLACES)[number];

export const SOCIAL_ICONS = [
  "github",
  "linkedin",
  "telegram",
  "instagram",
  "spotify",
  "hoobe",
  "link",
] as const;
export type SocialIcon = (typeof SOCIAL_ICONS)[number];

/** The forms the API can write a persona in (api/_lib/site_config.py). */
const PRONOUNS = ["he", "she", "they"] as const;

/**
 * What `features` takes (#189): `auto` shows a feature when the deployment
 * can serve it (GET /api/features), `on` and `off` decide.
 */
export const FEATURE_MODES = ["auto", "on", "off"] as const;
export type FeatureMode = (typeof FEATURE_MODES)[number];

/** The home page's sections; each id is a component, so the list is fixed. */
export const SECTION_IDS = ["about", "journey", "projects", "music"] as const;
export type SectionId = (typeof SECTION_IDS)[number];

const social = object({
  id: slug,
  /** The visible text, and the link's accessible name. */
  label: text,
  icon: oneOf(SOCIAL_ICONS),
  url: httpsUrl,
  show_in: list(oneOf(SOCIAL_PLACES)),
});

const siteShape = object({
  owner: object({
    name: text,
    email,
    job_title: text,
    works_for: optional(object({ name: text, url: httpsUrl })),
    image: sitePath,
    knows_about: list(text),
  }),
  site: object({
    url: origin,
    /** Other origins that serve the site; the API accepts calls from them. */
    aliases: optional(list(origin)),
  }),
  github: object({
    /** Whose public repos the project pages' stats and READMEs come from. */
    username: githubName,
    /** Other owners whose public repos a project may link. */
    allowed_owners: optional(list(githubName)),
    /**
     * Whether a project page shows its repo's stars, forks, watchers and open
     * issues; shown if left out. Low counts undersell a project, so a site can
     * hide them until they say something.
     */
    show_counts: optional(flag),
  }),
  /** Whether SUMMON and the GitHub panels show; each `auto` if left out. */
  features: optional(
    object({
      regenerate: optional(oneOf(FEATURE_MODES)),
      github: optional(oneOf(FEATURE_MODES)),
    }),
  ),
  seo: object({
    /** Appended to every page title. */
    site_name: text,
    image: shareImage,
    about: object({ description: text }),
    projects: object({ description: text }),
  }),
  /** In display order, on every surface they show in. */
  socials: list(social),
  footer: object({ source_repo_url: optional(httpsUrl) }),
  sections: list(object({ id: oneOf(SECTION_IDS), label: text }), { min: 1 }),
  hero: object({
    photos: list(sitePath, { min: 1 }),
    labels: object({ projects: text, contact: text }),
  }),
  regenerate: object({
    /** The button's words: idle, while it works, and the undo. */
    labels: object({ button: text, busy: text, reset: text }),
    persona: object({
      /** The rewritten name keeps one of these. */
      name_variants: list(text, { min: 1 }),
      /** "they" if left out. */
      pronouns: optional(oneOf(PRONOUNS)),
    }),
    /** Asked of every rewrite, word for word. */
    style_rules: optional(list(text)),
  }),
  contact: object({ heading: text, text }),
  music: object({
    /** "{artist}" marks where the artist's name goes. */
    intro: text,
    artist: text,
    embed: optional(httpsUrl),
    /** The player's name to a screen reader. */
    embed_title: optional(text),
  }),
});

export type SiteConfig = ReturnType<typeof siteShape>;
export type Social = SiteConfig["socials"][number];

function duplicates(values: string[]): string[] {
  return values.filter((value, index) => values.indexOf(value) !== index);
}

/** The rules that span fields, once each field has its shape. */
function crossCheck(config: SiteConfig, issues: string[]) {
  for (const id of duplicates(config.socials.map((entry) => entry.id))) {
    issues.push(`socials: the id "${id}" is used twice`);
  }
  for (const id of duplicates(config.sections.map((section) => section.id))) {
    issues.push(`sections: "${id}" is listed twice`);
  }
  // About is the page's own text, and the one SUMMON rewrites.
  if (!config.sections.some((section) => section.id === "about")) {
    issues.push('sections: "about" is required');
  }
  if (config.music.intro.split("{artist}").length !== 2) {
    issues.push('music.intro: expected "{artist}" exactly once');
  }
}

export class SiteConfigError extends Error {
  constructor(source: string, issues: string[]) {
    super(describeProblems(source, issues));
    this.name = "SiteConfigError";
  }
}

/** `raw` as a SiteConfig, or a SiteConfigError naming every problem. */
export function parseSiteConfig(raw: unknown, source = "site/site.yaml"): SiteConfig {
  const issues: string[] = [];
  const config = siteShape(raw, "", issues);
  if (issues.length === 0) crossCheck(config, issues);
  if (issues.length > 0) throw new SiteConfigError(source, issues);
  return config;
}
