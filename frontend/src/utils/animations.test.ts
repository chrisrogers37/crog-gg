import { describe, it, expect } from "vitest";
import { staggerContainer, staggerItem } from "./animations";

describe("Animation Variants", () => {
  describe("staggerContainer", () => {
    it("has hidden state", () => {
      expect(staggerContainer.hidden).toEqual({ opacity: 0 });
    });

    it("has visible state with stagger transition", () => {
      const visible = staggerContainer.visible as {
        opacity: number;
        transition: { staggerChildren: number };
      };
      expect(visible.opacity).toBe(1);
      expect(visible.transition.staggerChildren).toBe(0.1);
    });
  });

  describe("staggerItem", () => {
    it("has hidden state matching pattern", () => {
      expect(staggerItem.hidden).toEqual({ opacity: 0, y: 20 });
    });

    it("has visible state", () => {
      expect(staggerItem.visible).toMatchObject({ opacity: 1, y: 0 });
    });
  });
});
