import fs from "node:fs";
import path from "node:path";
import yaml from "js-yaml";
import { parseSiteConfig, type SiteConfig } from "../src/config/schema";

/**
 * The owner's folder (#188): site.yaml, and public/, which is served as is.
 * SITE_DIR picks another folder, relative to the repo root. __dirname, since
 * both Vite's config loader and Vitest provide it, where import.meta.url isn't
 * a file URL under jsdom. No import of vite here: tests read this module, and
 * vite's esbuild won't load under jsdom.
 */
export const SITE_DIR = path.resolve(
  __dirname,
  "../..",
  process.env.SITE_DIR || "site",
);

/** site.yaml as YAML gives it, unchecked. A syntax error names the file. */
export function readSiteYaml(dir = SITE_DIR): unknown {
  const file = path.join(dir, "site.yaml");
  return yaml.load(fs.readFileSync(file, "utf8"), {
    filename: path.relative(process.cwd(), file),
  });
}

/** site.yaml, checked; a SiteConfigError names every problem. */
export function readSiteConfig(dir = SITE_DIR): SiteConfig {
  const source = path.relative(process.cwd(), path.join(dir, "site.yaml"));
  return parseSiteConfig(readSiteYaml(dir), source);
}

let cached: SiteConfig | undefined;

/**
 * The active site.yaml, read and checked once per process; the dev server
 * forgets it when the file changes (vite-site.ts). Build-time code (the
 * prerender) reads it here, since code vite.config.ts imports can't import
 * `virtual:site-config`: the config loads before any plugin can resolve it.
 */
export const siteConfig = (): SiteConfig => (cached ??= readSiteConfig());

export const forgetSiteConfig = () => {
  cached = undefined;
};
