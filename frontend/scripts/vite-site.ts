import fs from "node:fs";
import path from "node:path";
import { searchForWorkspaceRoot, type Plugin } from "vite";
import { GENERATED_FILES } from "../src/seo/prerender";
import { forgetSiteConfig, SITE_DIR, siteConfig } from "./site-config";

const SITE_FILE = path.join(SITE_DIR, "site.yaml");

const ID = "virtual:site-config";
const RESOLVED = `\0${ID}`;

/**
 * Serves site.yaml to the app as `virtual:site-config`, makes site/public the
 * public folder, and lets tests import the site's files as `@site/...`. The
 * build fails on a bad site.yaml before it bundles anything; the dev server
 * reloads the page when the file changes.
 */
export function site(): Plugin {
  return {
    name: "crog:site",
    config: () => ({
      publicDir: path.join(SITE_DIR, "public"),
      resolve: { alias: { "@site": SITE_DIR } },
      // An allow list set here replaces Vite's default, so it names the
      // workspace too.
      server: { fs: { allow: [searchForWorkspaceRoot(process.cwd()), SITE_DIR] } },
    }),
    buildStart() {
      siteConfig();
      // The build writes these; a copy in public/ would be overwritten
      // without a word.
      for (const generated of GENERATED_FILES) {
        if (fs.existsSync(path.join(SITE_DIR, "public", generated))) {
          this.error(
            `${path.relative(process.cwd(), path.join(SITE_DIR, "public", generated))} would be overwritten: the build generates it, so delete the file`,
          );
        }
      }
    },
    resolveId: (id) => (id === ID ? RESOLVED : undefined),
    load: (id) =>
      id === RESOLVED ? `export default ${JSON.stringify(siteConfig())};` : undefined,
    configureServer(server) {
      server.watcher.add(SITE_FILE);
      server.watcher.on("change", (changed) => {
        if (path.resolve(changed) !== SITE_FILE) return;
        forgetSiteConfig();
        const module = server.moduleGraph.getModuleById(RESOLVED);
        if (module) server.moduleGraph.invalidateModule(module);
        server.ws.send({ type: "full-reload" });
      });
    },
  };
}
