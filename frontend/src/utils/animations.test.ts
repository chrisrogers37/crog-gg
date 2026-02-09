import { describe, it, expect } from "vitest";
import {
  fadeIn,
  fadeInUp,
  fadeInDown,
  scaleIn,
  slideInRight,
  slideInLeft,
  staggerContainer,
  staggerItem,
  hoverScale,
  tapScale,
  springTransition,
  pageTransition,
} from "./animations";

describe("Animation Variants", () => {
  describe("fadeIn", () => {
    it("has hidden state with opacity 0", () => {
      expect(fadeIn.hidden).toEqual({ opacity: 0 });
    });

    it("has visible state with opacity 1", () => {
      expect(fadeIn.visible).toMatchObject({ opacity: 1 });
    });

    it("has exit state", () => {
      expect(fadeIn.exit).toEqual({ opacity: 0 });
    });
  });

  describe("fadeInUp", () => {
    it("has hidden state with opacity 0 and y offset", () => {
      expect(fadeInUp.hidden).toEqual({ opacity: 0, y: 20 });
    });

    it("has visible state with opacity 1 and y 0", () => {
      expect(fadeInUp.visible).toMatchObject({ opacity: 1, y: 0 });
    });
  });

  describe("fadeInDown", () => {
    it("has hidden state with negative y offset", () => {
      expect(fadeInDown.hidden).toEqual({ opacity: 0, y: -20 });
    });

    it("has visible state with y 0", () => {
      expect(fadeInDown.visible).toMatchObject({ opacity: 1, y: 0 });
    });
  });

  describe("scaleIn", () => {
    it("has hidden state with reduced scale", () => {
      expect(scaleIn.hidden).toEqual({ opacity: 0, scale: 0.95 });
    });

    it("has visible state with full scale", () => {
      expect(scaleIn.visible).toMatchObject({ opacity: 1, scale: 1 });
    });
  });

  describe("slideInRight", () => {
    it("has hidden state with x offset", () => {
      expect(slideInRight.hidden).toEqual({ opacity: 0, x: 20 });
    });

    it("has visible state with x 0", () => {
      expect(slideInRight.visible).toMatchObject({ opacity: 1, x: 0 });
    });
  });

  describe("slideInLeft", () => {
    it("has hidden state with negative x offset", () => {
      expect(slideInLeft.hidden).toEqual({ opacity: 0, x: -20 });
    });

    it("has visible state with x 0", () => {
      expect(slideInLeft.visible).toMatchObject({ opacity: 1, x: 0 });
    });
  });

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

  describe("Hover and Tap effects", () => {
    it("hoverScale has correct scale value", () => {
      expect(hoverScale.scale).toBe(1.02);
    });

    it("tapScale has correct scale value", () => {
      expect(tapScale.scale).toBe(0.98);
    });
  });

  describe("Transitions", () => {
    it("springTransition has correct properties", () => {
      expect(springTransition.type).toBe("spring");
      expect(springTransition.stiffness).toBe(300);
      expect(springTransition.damping).toBe(30);
    });

    it("pageTransition has correct duration", () => {
      expect(pageTransition.duration).toBe(0.4);
    });
  });
});
