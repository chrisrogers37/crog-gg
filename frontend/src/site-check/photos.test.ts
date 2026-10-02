import { describe, expect, it } from "vitest";
import site from "virtual:site-config";
import showcaseYaml from "@site/public/content/showcase.yaml?raw";
import { showcaseShape } from "../config/contentSchema";
import { claudlobby } from "../content/claudlobby";
import { shippedProjects } from "../test/content";
import { inSite } from "../test/site";
import { parseYaml } from "../utils/contentFile";
import { PHOTO_WIDTHS, photoVariant } from "../utils/photos";

const variants = import.meta.glob("@site/public/profile-photos/*.webp", {
  query: "?url",
  eager: true,
});

// Held to its shape, as the page holds it (#190): a file that doesn't fit
// fails here, naming the field, not in a visitor's browser.
const showcase = parseYaml(showcaseShape, showcaseYaml, "content/showcase.yaml").images.map(
  (image) => image.src,
);

// Claudlobby's page's mark, Claudfather's avatar, where the site lists it.
const mark = (await shippedProjects()).some(({ id }) => id === "claudlobby")
  ? [claudlobby.mark.photo]
  : [];

describe("the site's photos", () => {
  it.each([...new Set([...site.hero.photos, ...showcase, ...mark])])(
    "%s ships every width it is served at",
    (base) => {
      for (const width of PHOTO_WIDTHS) {
        const file = photoVariant(base, width);
        expect(inSite(variants, `/public${file}`), `public${file}`).toBeDefined();
      }
    },
  );
});
