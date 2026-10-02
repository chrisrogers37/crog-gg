import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import { claudlobby } from "../content/claudlobby";
import { shippedProjects } from "../test/content";
import { claudlobbyCard, textOf } from "../test/site";
import { PHOTO_WIDTHS, photoVariant } from "../utils/photos";

/**
 * Claudlobby's page wears Claudfather's look from files in the site's public
 * folder: its mark (the org's avatar) and its own share card. A site that
 * lists Claudlobby keeps them, since the page and its head point at them.
 */
const PUBLIC = join(__SITE_DIR__, "public");

/** A PNG's width and height, from its header. */
const pngSize = (file: string) => {
  const header = readFileSync(file).subarray(16, 24);
  return { width: header.readUInt32BE(0), height: header.readUInt32BE(4) };
};

describe("Claudlobby's page's files", () => {
  let listed = false;
  beforeAll(async () => {
    listed = (await shippedProjects()).some((project) => project.id === "claudlobby");
  });

  it("include Claudfather's mark at every width the page asks for", (ctx) => {
    if (!listed) ctx.skip(); // the site doesn't list Claudlobby
    for (const width of PHOTO_WIDTHS) {
      const path = photoVariant(claudlobby.brand.mark.photo, width);
      expect(existsSync(join(PUBLIC, path)), `public${path}`).toBe(true);
    }
  });

  it("include its share card, at the size its head declares", (ctx) => {
    if (!listed) ctx.skip();
    const { path, width, height } = claudlobby.brand.card;
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
    expect(`${text("h1")} ${text(".sub")}`).toBe(claudlobby.brand.card.alt);
  });
});
