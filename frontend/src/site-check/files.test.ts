import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import site from "virtual:site-config";
import { frameSrc } from "../test/csp";
import { PHOTO_WIDTHS, photoVariant } from "../utils/photos";

/**
 * `npm run site:check` (#188, #191): what the schema can't see, checked against
 * the active site's files (SITE_DIR, else site/). The schema itself, and the rule against a hand-kept sitemap.xml or
 * robots.txt in site/public, run whenever the dev server, the build or the
 * tests start (scripts/vite-site.ts), so a site that reaches these checks has
 * passed them.
 */

const FRONTEND = resolve(__dirname, "../..");
const PUBLIC = join(__SITE_DIR__, "public");

describe("the site's files", () => {
  it("has every file site.yaml and index.html point to", () => {
    const indexHtml = readFileSync(join(FRONTEND, "index.html"), "utf8");
    const linked = [...indexHtml.matchAll(/href="(\/[^"]+)"/g)].map(([, path]) => path);
    expect(linked, "index.html's links").not.toHaveLength(0);

    const heroPhotos = site.hero.photos.flatMap((base) =>
      PHOTO_WIDTHS.map((width) => photoVariant(base, width)),
    );
    for (const path of [site.owner.image, site.seo.image.path, ...heroPhotos, ...linked]) {
      expect(existsSync(join(PUBLIC, path)), `public${path}`).toBe(true);
    }
  });

  it.skipIf(!site.music.embed)("only embeds a player the CSP lets the page frame", () => {
    expect(frameSrc()).toContain(new URL(site.music.embed!).origin);
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
  // A set: the host without "www." also finds it with.
  const values = new Set([
    site.owner.name,
    site.owner.email,
    bare(site.site.url),
    site.seo.site_name,
    site.seo.about.description,
    site.seo.projects.description,
    ...site.socials.map((social) => bare(social.url)),
    ...(site.music.embed ? [bare(site.music.embed)] : []),
  ]);

  it("are read from site.yaml, not typed into the code", () => {
    expect(SOURCES.length).toBeGreaterThan(50);
    const found: string[] = [];
    for (const file of SOURCES) {
      const text = readFileSync(join(FRONTEND, file), "utf8");
      for (const value of values) {
        if (text.includes(value)) found.push(`${file}: "${value}"`);
      }
    }
    expect(found).toEqual([]);
  });
});
