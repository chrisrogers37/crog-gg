/**
 * Design Tokens
 *
 * Semantic design values for use in JavaScript when Tailwind classes aren't
 * suitable. Colors are NOT redefined here. They derive from the palette
 * single source of truth (src/styles/palette.ts), the same module
 * tailwind.config.js consumes, so brand colors can never drift between the
 * two. Pick the palette shade whose meaning matches the semantic slot.
 */

import { primary, accent } from "./palette";

export const tokens = {
  // Colors: derived from the palette SSOT (src/styles/palette.ts).
  colors: {
    primary: {
      main: primary[600], // #2563eb
      light: primary[500], // #3b82f6
      dark: primary[700], // #1d4ed8
    },
    accent: {
      main: accent[700], // #7c3aed
      light: accent[600], // #9333ea (was #8b5cf6, a non-palette violet)
      dark: accent[800], // #6b21a8
    },
    success: "#10b981",
    warning: "#f59e0b",
    error: "#ef4444",
  },

  // Spacing scale (in pixels, for JS usage)
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    "2xl": 48,
    "3xl": 64,
  },

  // Animation durations
  duration: {
    fast: 150,
    normal: 300,
    slow: 500,
  },

  // Animation easings
  easing: {
    easeOut: [0.0, 0.0, 0.2, 1],
    easeIn: [0.4, 0.0, 1, 1],
    easeInOut: [0.4, 0.0, 0.2, 1],
    spring: [0.175, 0.885, 0.32, 1.275],
  },

  // Breakpoints (matching Tailwind)
  breakpoints: {
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
    "2xl": 1536,
  },

  // Z-index scale
  zIndex: {
    dropdown: 1000,
    sticky: 1100,
    modal: 1200,
    popover: 1300,
    tooltip: 1400,
  },
};

export type Tokens = typeof tokens;
