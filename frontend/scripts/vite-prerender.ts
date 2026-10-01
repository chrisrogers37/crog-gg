import fs from "node:fs/promises";
import path from "node:path";
import type { Plugin } from "vite";
import {
  fileFor,
  landingPages,
  pageFor,
  renderPage,
  renderRobots,
  renderSitemap,
} from "../src/seo/prerender";
import { NOT_FOUND_META } from "../src/seo/site";
import { readProjects } from "../src/utils/projectLoader";

/**
 * Writes each route's <head> into its HTML (#174); see src/seo/prerender.ts.
 * The body stays the client-rendered shell.
 */
export function prerender(): Plugin[] {
  let projectsDir = "";
  const projects = () =>
    readProjects((file) => fs.readFile(path.join(projectsDir, file), "utf8"));
  const locate = (publicDir: string) => {
    projectsDir = path.join(publicDir, "content", "projects");
  };

  return [
    {
      // Dev serves index.html for every path; give each the head its built
      // file carries, so dev and production agree.
      name: "crog:prerender-dev",
      apply: "serve",
      configResolved: (config) => locate(config.publicDir),
      async transformIndexHtml(html, ctx) {
        const url = new URL(ctx.originalUrl ?? ctx.path, "http://dev");
        const pathname = url.pathname.replace(/(.)\/$/, "$1");
        return renderPage(html, pageFor(pathname, await projects()));
      },
    },
    {
      // After Vite has written its script and style tags into index.html.
      name: "crog:prerender",
      apply: "build",
      enforce: "post",
      configResolved: (config) => locate(config.publicDir),
      async generateBundle(_options, bundle) {
        const index = bundle["index.html"];
        if (index?.type !== "asset" || typeof index.source !== "string") {
          throw new Error("the build has no index.html to prerender from");
        }
        const template = index.source;

        const pages = landingPages(await projects());
        for (const page of pages) {
          const source = renderPage(template, page);
          if (page.path === "/") index.source = source;
          else this.emitFile({ type: "asset", fileName: fileFor(page.path), source });
        }
        this.emitFile({
          type: "asset",
          fileName: "404.html",
          source: renderPage(template, NOT_FOUND_META),
        });
        this.emitFile({
          type: "asset",
          fileName: "sitemap.xml",
          source: renderSitemap(pages, new Date().toISOString().slice(0, 10)),
        });
        this.emitFile({ type: "asset", fileName: "robots.txt", source: renderRobots() });
      },
    },
  ];
}
