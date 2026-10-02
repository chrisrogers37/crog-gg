/**
 * A glob's entry for a file in the site folder. Vite keys an `@site/...` glob
 * by the file's path from frontend/, which depends on SITE_DIR, so this
 * matches the end: `inSite(files, "/public/logos/a.png")`.
 */
export const inSite = <T>(files: Record<string, T>, path: string): T | undefined =>
  Object.entries(files).find(([key]) => key.endsWith(path))?.[1];
