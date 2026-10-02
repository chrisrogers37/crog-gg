import fs from "node:fs";
import path from "node:path";
import { searchForWorkspaceRoot, type Plugin } from "vite";
import { GENERATED_FILES } from "../src/seo/prerender";
import { forgetSiteConfig, siteConfig, siteDir } from "./site-config";

const ID = "virtual:site-config";
const RESOLVED = `\0${ID}`;

/**
 * Serves site.yaml to the app as `virtual:site-config`, makes site/public the
 * public folder, and lets tests import the site's files as `@site/...`. The
 * build fails on a bad site.yaml before it bundles anything; the dev server
 * reloads the page when the file changes.
 */
export function site({
  // A site folder of its own (Vitest's projects use two), else SITE_DIR's.
  dir,
  // The commit this build is from, when Vercel names it, so "view source" can
  // link to exactly the code that's live (#188). Tests pass their own.
  commit = process.env.VERCEL_GIT_COMMIT_SHA ?? "",
}: { dir?: string; commit?: string } = {}): Plugin {
  const root = siteDir(dir);
  const file = path.join(root, "site.yaml");

  return {
    name: "crog:site",
    config: () => ({
      publicDir: path.join(root, "public"),
      define: {
        __SITE_COMMIT__: JSON.stringify(commit),
        // For tests that check the site's files on disk.
        __SITE_DIR__: JSON.stringify(root),
      },
      resolve: { alias: { "@site": root } },
      // An allow list set here replaces Vite's default, so it names the
      // workspace too.
      server: { fs: { allow: [searchForWorkspaceRoot(process.cwd()), root] } },
    }),
    buildStart() {
      siteConfig(root);
      // The build writes these; a copy in public/ would be overwritten
      // without a word.
      for (const generated of GENERATED_FILES) {
        if (fs.existsSync(path.join(root, "public", generated))) {
          this.error(
            `${path.relative(process.cwd(), path.join(root, "public", generated))} would be overwritten: the build generates it, so delete the file`,
          );
        }
      }
    },
    resolveId: (id) => (id === ID ? RESOLVED : undefined),
    load: (id) =>
      id === RESOLVED ? `export default ${JSON.stringify(siteConfig(root))};` : undefined,
    configureServer(server) {
      server.watcher.add(file);
      server.watcher.on("change", (changed) => {
        if (path.resolve(changed) !== file) return;
        forgetSiteConfig(root);
        const module = server.moduleGraph.getModuleById(RESOLVED);
        if (module) server.moduleGraph.invalidateModule(module);
        server.ws.send({ type: "full-reload" });
      });
    },
  };
}
