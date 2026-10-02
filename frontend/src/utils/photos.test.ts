import { describe, it, expect } from "vitest";
import { photoSrc, photoSrcSet } from "./photos";

// That every photo the site names ships at every width is site:check's:
// src/site-check/photos.test.ts.
describe("photos", () => {
  it("describes each variant by its width", () => {
    expect(photoSrcSet("/p/a")).toBe(
      "/p/a-160.webp 160w, /p/a-320.webp 320w, /p/a-480.webp 480w",
    );
    expect(photoSrc("/p/a")).toBe("/p/a-480.webp");
  });
});
