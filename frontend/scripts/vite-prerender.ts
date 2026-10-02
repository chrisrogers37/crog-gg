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
import { bioShape, showcaseShape, timelineShape } from "../src/config/contentSchema";
import { createSeo } from "../src/seo/site";
import { parseYaml } from "../src/utils/contentFile";
import { readProjects } from "../src/utils/projectLoader";
import { siteConfig } from "./site-config";

/**
 * Writes each route's <head> into its HTML (#174); see src/seo/prerender.ts.
 * The body stays the client-rendered shell.
 */
export function prerender(): Plugin[] {
  const loadSeo = () => createSeo(siteConfig());
  let contentDir = "";
  const projects = () =>
    readProjects((file) => fs.readFile(path.join(contentDir, "projects", file), "utf8"));
  /**
   * The rest of the content the page holds to a shape (#190): a file that
   * doesn't fit fails the build, naming it, as a project file does, rather
   * than a section in a visitor's browser.
   */
  const checkContent = async () => {
    const read = (file: string) => fs.readFile(path.join(contentDir, file), "utf8");
    parseYaml(bioShape, await read("bio.yaml"), "content/bio.yaml");
    parseYaml(timelineShape, await read("timeline.yaml"), "content/timeline.yaml");
    parseYaml(showcaseShape, await read("showcase.yaml"), "content/showcase.yaml");
  };
  const locate = (publicDir: string) => {
    contentDir = path.join(publicDir, "content");
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
        const seo = loadSeo();
        return renderPage(seo, html, pageFor(seo, pathname, await projects()));
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

        await checkContent();
        const seo = loadSeo();
        const pages = landingPages(seo, await projects());
        for (const page of pages) {
          const source = renderPage(seo, template, page);
          if (page.path === "/") index.source = source;
          else this.emitFile({ type: "asset", fileName: fileFor(page.path), source });
        }
        this.emitFile({
          type: "asset",
          fileName: "404.html",
          source: renderPage(seo, template, seo.NOT_FOUND_META),
        });
        this.emitFile({
          type: "asset",
          fileName: "sitemap.xml",
          source: renderSitemap(seo, pages, new Date().toISOString().slice(0, 10)),
        });
        this.emitFile({ type: "asset", fileName: "robots.txt", source: renderRobots(seo) });
      },
    },
  ];
}
