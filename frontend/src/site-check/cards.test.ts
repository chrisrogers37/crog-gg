import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import site from "virtual:site-config";
import { shippedProjects } from "../test/content";
import { cardSource, cardWords, textOf } from "../test/site";

/**
 * The site's link-preview cards (#174): its own (seo.image in site.yaml), and
 * any project's (`card` in its file), each a PNG the head points crawlers at.
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
      ...projects.flatMap(({ id, card }): [string, Card][] => (card ? [[`${id}'s card`, card]] : [])),
    ];
  });

  it("are each there, a PNG at the size the head declares", () => {
    for (const [name, { path, width, height }] of cards) {
      const file = join(PUBLIC, path);
      expect(existsSync(file), `${name}: public${path}`).toBe(true);
      expect(pngSize(file), name).toEqual({ width, height });
    }
  });

  it("say in their alt what the card says, where the site keeps its source", () => {
    // Words edited in one place and not the other fail here.
    for (const [name, card] of cards) {
      const source = cardSource(card.path);
      if (source) expect(cardWords(source), name).toBe(card.alt);
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
