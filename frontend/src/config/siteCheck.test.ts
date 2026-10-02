import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import site from "virtual:site-config";
import { SITE_DIR } from "../../scripts/vite-site";
import { frameSrc } from "../test/csp";

/**
 * `npm run site:check` (#188): what the schema can't see, checked against the
 * files. The schema itself, and the rule against a hand-kept sitemap.xml or
 * robots.txt in site/public, run whenever the dev server, the build or the
 * tests start (scripts/vite-site.ts), so a site that reaches these checks has
 * passed them.
 */

const FRONTEND = resolve(__dirname, "../..");
const PUBLIC = join(SITE_DIR, "public");

describe("site/", () => {
  it("has every file site.yaml and index.html point to", () => {
    const indexHtml = readFileSync(join(FRONTEND, "index.html"), "utf8");
    const linked = [...indexHtml.matchAll(/href="(\/[^"]+)"/g)].map(([, path]) => path);
    expect(linked, "index.html's links").not.toHaveLength(0);

    for (const path of [site.owner.image, site.seo.image.path, ...linked]) {
      expect(existsSync(join(PUBLIC, path)), `site/public${path}`).toBe(true);
    }
  });

  it("only embeds a player the CSP lets the page frame", () => {
    if (!site.music.embed) return;
    expect(frameSrc()).toContain(new URL(site.music.embed).origin);
  });
});

/** Where the owner's values must not be typed in by hand. */
const SOURCES = [
  ...readdirSync(join(FRONTEND, "src"), { recursive: true, encoding: "utf8" })
    .map((file) => join("src", file))
    .filter((file) => /\.(tsx?|css)$/.test(file))
    .filter((file) => !/(\.test\.|__tests__|[/\\]test[/\\])/.test(file)),
  "index.html",
  ...readdirSync(join(FRONTEND, "scripts"), { recursive: true, encoding: "utf8" })
    .map((file) => join("scripts", file))
    .filter((file) => /\.(tsx?|mjs|html|py)$/.test(file)),
];

/** A URL as it might be typed: no scheme, no "www.", no trailing slash. */
const bare = (url: string) =>
  url.replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/$/, "");

describe("the owner's values", () => {
  // Until #189 gives the API the owner too, GitHubReadme links the owner's
  // repos itself.
  const EXCEPTIONS = new Map([
    ["src/components/features/GitHubReadme/GitHubReadme.tsx", "github.com/"],
  ]);

  const host = new URL(site.site.url).host;
  const values = [
    site.owner.name,
    site.owner.email,
    host,
    host.replace(/^www\./, ""),
    site.seo.site_name,
    site.seo.about.description,
    site.seo.projects.description,
    ...site.socials.map((social) => bare(social.url)),
    ...(site.music.embed ? [bare(site.music.embed)] : []),
  ];

  it("are read from site.yaml, not typed into the code", () => {
    expect(SOURCES.length).toBeGreaterThan(50);
    const found: string[] = [];
    for (const file of SOURCES) {
      const text = readFileSync(join(FRONTEND, file), "utf8");
      for (const value of values) {
        if (!text.includes(value)) continue;
        const allowed = EXCEPTIONS.get(file.split("\\").join("/"));
        if (allowed && value.startsWith(allowed)) continue;
        found.push(`${relative(FRONTEND, join(FRONTEND, file))}: "${value}"`);
      }
    }
    expect(found).toEqual([]);
  });
});
