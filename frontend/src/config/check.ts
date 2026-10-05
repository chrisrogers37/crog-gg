/**
 * Small checks that hold YAML to a shape: site.yaml (schema.ts, #188) and the
 * content files (contentSchema.ts, #190), which the browser checks too.
 *
 * Each field is a check that records "path: problem" and carries on, so one
 * run reports every mistake rather than the first. A key the shape doesn't
 * name is a mistake too, so a misspelt key fails instead of being ignored.
 * A shape's type is inferred from the same checks.
 */

export type Check<T> = (value: unknown, path: string, issues: string[]) => T;

export const at = (path: string, key: string | number) =>
  path ? `${path}.${key}` : String(key);

/** Records a problem and returns a placeholder, which no caller keeps. */
export function fail<T>(
  issues: string[],
  path: string,
  value: unknown,
  expected: string,
): T {
  const where = path || "the file";
  issues.push(`${where}: ${value === undefined ? "missing" : `expected ${expected}`}`);
  return undefined as T;
}

export const text: Check<string> = (value, path, issues) =>
  typeof value === "string" && value.trim() !== ""
    ? value
    : fail(issues, path, value, "text");

export const matching =
  (pattern: RegExp, expected: string): Check<string> =>
  (value, path, issues) =>
    typeof value === "string" && pattern.test(value)
      ? value
      : fail(issues, path, value, expected);

/**
 * `value` as a URL, or null. Not URL.canParse: these checks run in the
 * browser too, and Safari 16, Chrome 107 and Firefox 104, inside the build's
 * target, don't have it.
 */
export const parseUrl = (value: string): URL | null => {
  try {
    return new URL(value);
  } catch {
    return null;
  }
};

export const httpsUrl: Check<string> = (value, path, issues) =>
  typeof value === "string" && parseUrl(value)?.protocol === "https:"
    ? value
    : fail(issues, path, value, "an https URL");

/** A path the site serves, from site/public: "/og-image.png". Not "//host/x". */
export const sitePath = matching(/^\/(?!\/)\S+$/, 'a path that starts with one "/"');

export const slug = matching(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "a lowercase id (a-z, 0-9, -)");

export const flag: Check<boolean> = (value, path, issues) =>
  typeof value === "boolean" ? value : fail(issues, path, value, "true or false");

export const positiveInteger: Check<number> = (value, path, issues) =>
  Number.isInteger(value) && (value as number) > 0
    ? (value as number)
    : fail(issues, path, value, "a positive whole number");

export const oneOf =
  <const T extends string>(allowed: readonly T[]): Check<T> =>
  (value, path, issues) =>
    allowed.includes(value as T)
      ? (value as T)
      : fail(issues, path, value, `one of ${allowed.join(", ")}`);

/** Absent, null and "" all mean "not set". */
export const optional =
  <T>(check: Check<T>): Check<T | undefined> =>
  (value, path, issues) =>
    value === undefined || value === null || value === ""
      ? undefined
      : check(value, path, issues);

export const list =
  <T>(item: Check<T>, { min = 0 } = {}): Check<T[]> =>
  (value, path, issues) => {
    if (!Array.isArray(value)) return fail(issues, path, value, "a list");
    if (value.length < min) {
      issues.push(`${path}: expected at least ${min}`);
    }
    return value.map((entry, index) => item(entry, at(path, index), issues));
  };

export type Shape = Record<string, Check<unknown>>;
type Value<S extends Shape, K extends keyof S> = ReturnType<S[K]>;

/**
 * What a shape parses to. A key whose check can give undefined (optional())
 * is an optional property, so a literal of the type can leave it out.
 */
export type Parsed<S extends Shape> = {
  [K in keyof S as undefined extends Value<S, K> ? never : K]: Value<S, K>;
} & {
  [K in keyof S as undefined extends Value<S, K> ? K : never]?: Value<S, K>;
} extends infer T
  ? { [K in keyof T]: T[K] }
  : never;

export const object =
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

/** Absent or null is `fallback()`; anything else is held to `check`. */
export const withDefault =
  <T>(check: Check<T>, fallback: () => NoInfer<T>): Check<T> =>
  (value, path, issues) =>
    value === undefined || value === null ? fallback() : check(value, path, issues);

/** A mapping whose keys are names the file chooses, each held to `item`. */
export const record =
  <T>(item: Check<T>): Check<Record<string, T>> =>
  (value, path, issues) => {
    if (typeof value !== "object" || value === null || Array.isArray(value)) {
      return fail(issues, path, value, "a mapping");
    }
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [key, item(entry, at(path, key), issues)]),
    );
  };

/** "source has N problem(s):", then one line per problem. */
export const describeProblems = (source: string, issues: string[]) =>
  `${source} has ${issues.length} problem(s):\n${issues.map((issue) => `  - ${issue}`).join("\n")}`;

/**
 * A link-preview card (#174): a PNG in the site's public folder, its size,
 * and its words as the alt. The site's (seo.image in site.yaml), and a
 * project's own (`share_card` in its file).
 */
export const shareImage = object({
  path: sitePath,
  width: positiveInteger,
  height: positiveInteger,
  alt: text,
});
