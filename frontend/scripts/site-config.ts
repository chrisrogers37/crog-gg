import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import yaml from "js-yaml";
import { parseSiteConfig, type SiteConfig } from "../src/config/schema";

// This module's folder, in each loader that reads it: Vite's config loader
// and Vitest provide __dirname (import.meta.url isn't a file URL under jsdom),
// and Playwright, which loads the e2e as ES modules, gives a file URL. No
// import of vite here: tests read this module, and vite's esbuild won't load
// under jsdom.
const HERE =
  typeof __dirname === "string" ? __dirname : path.dirname(fileURLToPath(import.meta.url));

/** The repo root, which site folders are named relative to. */
export const REPO_ROOT = path.resolve(HERE, "../..");

/**
 * A site folder (#188, #191): site.yaml, and public/, which is served as is.
 * `dir` names it, else SITE_DIR does, else it's site/, the owner's. Read on
 * each call, so a config can pick one before anything reads it.
 */
export const siteDir = (dir = process.env.SITE_DIR || "site") =>
  path.resolve(REPO_ROOT, dir);

/**
 * A site's site.yaml as YAML gives it, unchecked. A syntax error names the
 * file. `root` is the folder's absolute path, as siteDir() gives it.
 */
export function readSiteYaml(root = siteDir()): unknown {
  const file = path.join(root, "site.yaml");
  return yaml.load(fs.readFileSync(file, "utf8"), {
    filename: path.relative(process.cwd(), file),
  });
}

/** A site's site.yaml, checked; a SiteConfigError names every problem. */
export function readSiteConfig(root = siteDir()): SiteConfig {
  const source = path.relative(process.cwd(), path.join(root, "site.yaml"));
  return parseSiteConfig(readSiteYaml(root), source);
}

const cache = new Map<string, SiteConfig>();

/**
 * A site's config, read and checked once per process; the dev server forgets
 * it when the file changes (vite-site.ts). Build-time code (the prerender)
 * reads it here, since code vite.config.ts imports can't import
 * `virtual:site-config`: the config loads before any plugin can resolve it.
 */
export function siteConfig(root = siteDir()): SiteConfig {
  let config = cache.get(root);
  if (!config) cache.set(root, (config = readSiteConfig(root)));
  return config;
}

export const forgetSiteConfig = (root = siteDir()) => {
  cache.delete(root);
};
