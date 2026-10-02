import { describe, it, expect } from "vitest";
import yaml from "js-yaml";
import {
  PHOTO_WIDTHS,
  PROFILE_PHOTOS,
  photoSrc,
  photoSrcSet,
  photoVariant,
} from "./photos";
import type { ShowcaseImage } from "../types/Showcase";
import showcaseYaml from "../../../site/public/content/showcase.yaml?raw";

const variants = import.meta.glob("../../../site/public/profile-photos/*.webp", {
  query: "?url",
  eager: true,
});

const showcase = (
  yaml.load(showcaseYaml) as { images: ShowcaseImage[] }
).images.map((image) => image.src);

describe("photos", () => {
  it.each([...new Set([...PROFILE_PHOTOS, ...showcase])])(
    "%s ships every width it is served at",
    (base) => {
      for (const width of PHOTO_WIDTHS) {
        const file = photoVariant(base, width);
        expect(variants[`../../../site/public${file}`], `public${file}`).toBeDefined();
      }
    },
  );

  it("describes each variant by its width", () => {
    expect(photoSrcSet("/p/a")).toBe(
      "/p/a-160.webp 160w, /p/a-320.webp 320w, /p/a-480.webp 480w",
    );
    expect(photoSrc("/p/a")).toBe("/p/a-480.webp");
  });
});
