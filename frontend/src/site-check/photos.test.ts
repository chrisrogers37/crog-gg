import { describe, expect, it } from "vitest";
import yaml from "js-yaml";
import site from "virtual:site-config";
import showcaseYaml from "@site/public/content/showcase.yaml?raw";
import { inSite } from "../test/site";
import type { ShowcaseImage } from "../types/Showcase";
import { PHOTO_WIDTHS, photoVariant } from "../utils/photos";

const variants = import.meta.glob("@site/public/profile-photos/*.webp", {
  query: "?url",
  eager: true,
});

const showcase = (yaml.load(showcaseYaml) as { images: ShowcaseImage[] }).images.map(
  (image) => image.src,
);

describe("the site's photos", () => {
  it.each([...new Set([...site.hero.photos, ...showcase])])(
    "%s ships every width it is served at",
    (base) => {
      for (const width of PHOTO_WIDTHS) {
        const file = photoVariant(base, width);
        expect(inSite(variants, `/public${file}`), `public${file}`).toBeDefined();
      }
    },
  );
});
