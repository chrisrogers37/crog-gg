import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import { CLAUDLOBBY_CARD, CLAUDLOBBY_MARK } from "../content/claudlobbyBrand";
import { shippedProjects } from "../test/content";
import { claudlobbyCard, textOf } from "../test/site";
import { PHOTO_WIDTHS, photoVariant } from "../utils/photos";

/**
 * Claudlobby's page wears Claudfather's look from files in the site's public
 * folder: its mark (the org's avatar) and its own share card. A site that
 * lists Claudlobby keeps them, since the page and its head point at them.
 */
const PUBLIC = join(__SITE_DIR__, "public");

/** A PNG's width and height, from its header; undefined for a file that isn't a PNG. */
const pngSize = (file: string) => {
  const bytes = readFileSync(file);
  const isPng =
    bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) &&
    bytes.toString("latin1", 12, 16) === "IHDR";
  return isPng ? { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) } : undefined;
};

describe("Claudlobby's page's files", () => {
  let listed = false;
  beforeAll(async () => {
    listed = (await shippedProjects()).some((project) => project.id === "claudlobby");
  });

  it("include Claudfather's mark at every width the page asks for", (ctx) => {
    if (!listed) ctx.skip(); // the site doesn't list Claudlobby
    for (const width of PHOTO_WIDTHS) {
      const path = photoVariant(CLAUDLOBBY_MARK.photo, width);
      expect(existsSync(join(PUBLIC, path)), `public${path}`).toBe(true);
    }
  });

  it("include its share card, at the size its head declares", (ctx) => {
    if (!listed) ctx.skip();
    const { path, width, height } = CLAUDLOBBY_CARD;
    const file = join(PUBLIC, path);
    expect(existsSync(file), `public${path}`).toBe(true);
    expect(pngSize(file)).toEqual({ width, height });
  });

  it("describe the card by what it says", (ctx) => {
    if (!listed) ctx.skip();
    // The PNG is rendered from claudlobby-card.html, so its words edited in
    // one place and not the other fail here.
    const card = claudlobbyCard();
    expect(card, "site/claudlobby-card.html").toBeDefined();
    const text = (selector: string) => textOf(card!.querySelector(selector));
    expect(`${text("h1")} ${text(".sub")}`).toBe(CLAUDLOBBY_CARD.alt);
  });
});
