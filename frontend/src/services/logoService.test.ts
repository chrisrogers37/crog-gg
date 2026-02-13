import { describe, it, expect, beforeEach } from "vitest";
import { logoService } from "./logoService";

function createMockImage(shouldLoad: boolean): [typeof Image, () => number] {
  let callCount = 0;
  const MockImage = class {
    onload: (() => void) | null = null;
    onerror: (() => void) | null = null;

    set src(_value: string) {
      callCount++;
      setTimeout(() => {
        if (shouldLoad) {
          this.onload?.();
        } else {
          this.onerror?.();
        }
      }, 0);
    }
  };
  return [MockImage as unknown as typeof Image, () => callCount];
}

describe("logoService", () => {
  beforeEach(() => {
    logoService.clearCache();
  });

  describe("getLogoUrl", () => {
    it("generates Clearbit URL by default", () => {
      const url = logoService.getLogoUrl("meta.com");
      expect(url).toBe("https://logo.clearbit.com/meta.com?size=64");
    });

    it("generates Clearbit URL with custom size", () => {
      const url = logoService.getLogoUrl("meta.com", { size: 128 });
      expect(url).toBe("https://logo.clearbit.com/meta.com?size=128");
    });

    it("generates Google favicon URL when specified", () => {
      const url = logoService.getLogoUrl("meta.com", { provider: "google" });
      expect(url).toBe(
        "https://www.google.com/s2/favicons?domain=meta.com&sz=64",
      );
    });

    it("generates Google favicon URL with custom size", () => {
      const url = logoService.getLogoUrl("cornell.edu", {
        provider: "google",
        size: 32,
      });
      expect(url).toBe(
        "https://www.google.com/s2/favicons?domain=cornell.edu&sz=32",
      );
    });
  });

  describe("validateLogo", () => {
    it("resolves true when image loads successfully", async () => {
      const originalImage = globalThis.Image;
      const [MockImage, getCount] = createMockImage(true);
      globalThis.Image = MockImage;

      const result = await logoService.validateLogo(
        "https://logo.clearbit.com/meta.com?size=64",
      );
      expect(result).toBe(true);
      expect(getCount()).toBe(1);

      globalThis.Image = originalImage;
    });

    it("resolves false when image fails to load", async () => {
      const originalImage = globalThis.Image;
      const [MockImage] = createMockImage(false);
      globalThis.Image = MockImage;

      const result = await logoService.validateLogo(
        "https://logo.clearbit.com/invalid-domain.xyz?size=64",
      );
      expect(result).toBe(false);

      globalThis.Image = originalImage;
    });

    it("caches validation results", async () => {
      const originalImage = globalThis.Image;
      const [MockImage, getCount] = createMockImage(true);
      globalThis.Image = MockImage;

      const url = "https://logo.clearbit.com/cached-test.com?size=64";
      await logoService.validateLogo(url);
      await logoService.validateLogo(url);

      // Image constructor should only be called once due to caching
      expect(getCount()).toBe(1);

      globalThis.Image = originalImage;
    });
  });
});
