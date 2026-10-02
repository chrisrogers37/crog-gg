import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import site from "virtual:site-config";
import { shippedProjects } from "../test/content";
import { cardSource, cardWords, textOf } from "../test/site";

/**
 * The site's link-preview cards (#174): its own (seo.image in site.yaml), and
 * any project's (`share_card` in its file), each a PNG the head points crawlers at.
 * Each is there at the size the head declares, says in its alt what the card
 * says where the site keeps its source (rendered by scripts/og-image/
 * render.mjs), and keeps the copy's rules.
 */
const PUBLIC = join(__SITE_DIR__, "public");

type Card = typeof site.seo.image;

/** A PNG's width and height, from its header; undefined for a file that isn't a PNG. */
const pngSize = (file: string) => {
  const bytes = readFileSync(file);
  const isPng =
    bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) &&
    bytes.toString("latin1", 12, 16) === "IHDR";
  return isPng ? { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) } : undefined;
};

describe("the link-preview cards", () => {
  let cards: [string, Card][] = [];
  beforeAll(async () => {
    const projects = await shippedProjects();
    cards = [
      ["the site's card", site.seo.image],
      ...projects.flatMap(({ id, share_card: card }): [string, Card][] =>
        card ? [[`${id}'s card`, card]] : [],
      ),
    ];
  });

  it("are each there, a PNG at the size the head declares", () => {
    for (const [name, { path, width, height }] of cards) {
      const file = join(PUBLIC, path);
      expect(existsSync(file), `${name}: public${path}`).toBe(true);
      expect(pngSize(file), name).toEqual({ width, height });
    }
  });

  it("say in their alt what the card says, where the site keeps their sources", (ctx) => {
    const sourced = cards.flatMap(([name, card]) => {
      const source = cardSource(card.path);
      return source ? [{ name, card, source }] : [];
    });
    if (sourced.length === 0) ctx.skip(); // the site keeps no card source
    // A site that renders its cards renders each one: a source renamed away
    // from its card fails here.
    expect(sourced.map(({ name }) => name)).toEqual(cards.map(([name]) => name));
    // Words edited in one place and not the other fail here.
    for (const { name, card, source } of sourced) expect(cardWords(source), name).toBe(card.alt);
  });

  it("are what each site/<name>.html renders to (render.mjs)", (ctx) => {
    // So a card dropped from its file, or a stray source, fails rather than
    // leaving a PNG nothing points at.
    const sources = readdirSync(__SITE_DIR__).filter((file) => file.endsWith(".html"));
    if (sources.length === 0) ctx.skip(); // the site keeps no card source
    const paths = cards.map(([, card]) => card.path);
    for (const file of sources) {
      expect(paths, `site/${file}`).toContain(`/${file.replace(/\.html$/, ".png")}`);
    }
  });

  it("use no em-dashes (CLAUDE.md tone rule)", () => {
    for (const [name, card] of cards) {
      const source = cardSource(card.path);
      for (const text of [card.alt, source && textOf(source.body)]) {
        expect(text ?? "", name).not.toContain("—");
      }
    }
  });
});
