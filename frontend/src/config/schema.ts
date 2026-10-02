/**
 * The shape of site/site.yaml, the owner's identity (#188), and the check that
 * holds a file to it.
 *
 * Each field is a small check that records "path: problem" and carries on, so
 * one run reports every mistake rather than the first. A key the shape doesn't
 * name is a mistake too, so a misspelt key fails instead of being ignored.
 * The SiteConfig type is inferred from the same shape.
 */

type Check<T> = (value: unknown, path: string, issues: string[]) => T;

const at = (path: string, key: string | number) =>
  path ? `${path}.${key}` : String(key);

/** Records a problem and returns a placeholder, which no caller keeps. */
function fail<T>(
  issues: string[],
  path: string,
  value: unknown,
  expected: string,
): T {
  const where = path || "the file";
  issues.push(`${where}: ${value === undefined ? "missing" : `expected ${expected}`}`);
  return undefined as T;
}

const text: Check<string> = (value, path, issues) =>
  typeof value === "string" && value.trim() !== ""
    ? value
    : fail(issues, path, value, "text");

const matching =
  (pattern: RegExp, expected: string): Check<string> =>
  (value, path, issues) =>
    typeof value === "string" && pattern.test(value)
      ? value
      : fail(issues, path, value, expected);

const httpsUrl: Check<string> = (value, path, issues) => {
  if (typeof value === "string" && URL.canParse(value)) {
    if (new URL(value).protocol === "https:") return value;
  }
  return fail(issues, path, value, "an https URL");
};

/** An https origin with no path, so `${url}/about` is a URL. */
const origin: Check<string> = (value, path, issues) =>
  typeof value === "string" &&
  URL.canParse(value) &&
  new URL(value).protocol === "https:" &&
  new URL(value).origin === value
    ? value
    : fail(issues, path, value, "an https origin with no path or trailing slash");

/** A path the site serves, from site/public: "/og-image.png". Not "//host/x". */
const sitePath = matching(/^\/(?!\/)\S+$/, 'a path that starts with one "/"');

const email = matching(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "an email address");

const slug = matching(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "a lowercase id (a-z, 0-9, -)");

/** What GitHub accepts as a username or organisation. */
const githubName = matching(/^[A-Za-z0-9-]{1,39}$/, "a GitHub username");

const positiveInteger: Check<number> = (value, path, issues) =>
  Number.isInteger(value) && (value as number) > 0
    ? (value as number)
    : fail(issues, path, value, "a positive whole number");

const oneOf =
  <const T extends string>(allowed: readonly T[]): Check<T> =>
  (value, path, issues) =>
    allowed.includes(value as T)
      ? (value as T)
      : fail(issues, path, value, `one of ${allowed.join(", ")}`);

/** Absent, null and "" all mean "not set". */
const optional =
  <T>(check: Check<T>): Check<T | undefined> =>
  (value, path, issues) =>
    value === undefined || value === null || value === ""
      ? undefined
      : check(value, path, issues);

const list =
  <T>(item: Check<T>, { min = 0 } = {}): Check<T[]> =>
  (value, path, issues) => {
    if (!Array.isArray(value)) return fail(issues, path, value, "a list");
    if (value.length < min) {
      issues.push(`${path}: expected at least ${min}`);
    }
    return value.map((entry, index) => item(entry, at(path, index), issues));
  };

type Shape = Record<string, Check<unknown>>;
type Parsed<S extends Shape> = { [K in keyof S]: ReturnType<S[K]> };

const object =
  <S extends Shape>(shape: S): Check<Parsed<S>> =>
  (value, path, issues) => {
    if (typeof value !== "object" || value === null || Array.isArray(value)) {
      return fail(issues, path, value, "a mapping");
    }
    const record = value as Record<string, unknown>;
    for (const key of Object.keys(record)) {
      // Own keys only, so "constructor" or "toString" isn't taken as known.
      if (!Object.prototype.hasOwnProperty.call(shape, key)) {
        issues.push(`${at(path, key)}: unknown key`);
      }
    }
    const parsed: Record<string, unknown> = {};
    for (const [key, check] of Object.entries(shape)) {
      parsed[key] = check(record[key], at(path, key), issues);
    }
    return parsed as Parsed<S>;
  };

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

/**
 * What `/` is: "landing", the Claudlobby landing page, with the personal page
 * at /about; or "profile", the personal page itself, with no landing page.
 */
export const HOMES = ["landing", "profile"] as const;
export type Home = (typeof HOMES)[number];

/** The forms the API can write a persona in (api/_lib/site_config.py). */
const PRONOUNS = ["he", "she", "they"] as const;

/** /about's sections; each id is a component, so the list is fixed. */
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
  }),
  home: oneOf(HOMES),
  seo: object({
    /** Appended to every page title. */
    site_name: text,
    image: object({
      path: sitePath,
      width: positiveInteger,
      height: positiveInteger,
      alt: text,
    }),
    about: object({ description: text }),
    projects: object({ description: text }),
  }),
  /** In display order, on every surface they show in. */
  socials: list(social),
  footer: object({ source_repo_url: optional(httpsUrl) }),
  sections: list(object({ id: oneOf(SECTION_IDS), label: text }), { min: 1 }),
  hero: object({
    photos: list(sitePath, { min: 1 }),
    typewriter: list(text, { min: 1 }),
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
  about: object({
    preview_height: object({ narrow: positiveInteger, wide: positiveInteger }),
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
  // The collapsed preview and the default tab are About's.
  if (!config.sections.some((section) => section.id === "about")) {
    issues.push('sections: "about" is required');
  }
  if (config.music.intro.split("{artist}").length !== 2) {
    issues.push('music.intro: expected "{artist}" exactly once');
  }
}

export class SiteConfigError extends Error {
  constructor(source: string, issues: string[]) {
    super(`${source} has ${issues.length} problem(s):\n${issues.map((issue) => `  - ${issue}`).join("\n")}`);
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
