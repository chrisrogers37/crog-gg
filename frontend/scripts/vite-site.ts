import fs from "node:fs";
import path from "node:path";
import yaml from "js-yaml";
import type { Plugin } from "vite";
import { parseSiteConfig, type SiteConfig } from "../src/config/schema";

/**
 * The owner's folder (#188): site.yaml, and public/, which is served as is.
 * SITE_DIR picks another folder, relative to the repo root. __dirname, since
 * both Vite's config loader and Vitest provide it, where import.meta.url isn't
 * a file URL under jsdom.
 */
export const SITE_DIR = path.resolve(
  __dirname,
  "../..",
  process.env.SITE_DIR ?? "site",
);

/** site.yaml, checked; a SiteConfigError names every problem. */
export function readSiteConfig(dir = SITE_DIR): SiteConfig {
  const file = path.join(dir, "site.yaml");
  const source = path.relative(process.cwd(), file);
  return parseSiteConfig(yaml.load(fs.readFileSync(file, "utf8")), source);
}

const ID = "virtual:site-config";
const RESOLVED = `\0${ID}`;

/**
 * Serves site.yaml to the app as `virtual:site-config`, and site/public as
 * the public folder. The build fails on a bad site.yaml before it bundles
 * anything; the dev server reloads the page when the file changes.
 *
 * Never import `virtual:site-config` from code vite.config.ts imports (this
 * file, scripts/vite-prerender.ts, src/seo/site.ts): the config loads before
 * any plugin can resolve it. Build-time code calls readSiteConfig() instead.
 */
export function site(): Plugin {
  const file = path.join(SITE_DIR, "site.yaml");
  let config: SiteConfig | undefined;

  return {
    name: "crog:site",
    config: () => ({ publicDir: path.join(SITE_DIR, "public") }),
    buildStart() {
      config = readSiteConfig();
      // The build writes these from the page list (src/seo/prerender.ts); a
      // copy in public/ would be overwritten without a word.
      for (const generated of ["sitemap.xml", "robots.txt"]) {
        if (fs.existsSync(path.join(SITE_DIR, "public", generated))) {
          this.error(`site/public/${generated} would be overwritten: the build generates it, so delete the file`);
        }
      }
      this.addWatchFile(file);
    },
    resolveId: (id) => (id === ID ? RESOLVED : undefined),
    load(id) {
      if (id !== RESOLVED) return undefined;
      config ??= readSiteConfig();
      return `export default ${JSON.stringify(config)};`;
    },
    configureServer(server) {
      server.watcher.add(file);
      server.watcher.on("change", (changed) => {
        if (path.resolve(changed) !== file) return;
        config = undefined;
        const module = server.moduleGraph.getModuleById(RESOLVED);
        if (module) server.moduleGraph.invalidateModule(module);
        server.ws.send({ type: "full-reload" });
      });
    },
  };
}
