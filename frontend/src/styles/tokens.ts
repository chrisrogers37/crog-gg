/**
 * Design Tokens
 *
 * Central source of truth for design values.
 * Use these in JavaScript when Tailwind classes aren't suitable.
 */

export const tokens = {
  // Colors (matching Tailwind config)
  colors: {
    primary: {
      main: "#2563eb",
      light: "#3b82f6",
      dark: "#1d4ed8",
    },
    accent: {
      main: "#7c3aed",
      light: "#8b5cf6",
      dark: "#6b21a8",
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
