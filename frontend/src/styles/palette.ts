/**
 * Palette: the canonical color source of truth for the site.
 *
 * These raw ramps are the ONE place a brand color value lives.
 * `tailwind.config.js` imports from here, so every utility class and every
 * `theme()` in the CSS resolves to these values: a color is defined once.
 *
 * The CSS custom properties in `src/App.css` mirror these by hand (plain CSS
 * cannot import JS); each var there is annotated with the shade it tracks, so
 * keep them in step with these values.
 *
 * Scales follow Tailwind's 50..950 convention:
 *   primary = blue (brand)   accent = purple   slate = neutral   danger = red
 * claudfather is named colours, not a scale: Claudlobby's page alone.
 */

export const primary = {
  50: "#eff6ff",
  100: "#dbeafe",
  200: "#bfdbfe",
  300: "#93c5fd",
  400: "#60a5fa",
  500: "#3b82f6",
  600: "#2563eb",
  700: "#1d4ed8",
  800: "#1e40af",
  900: "#1e3a8a",
  950: "#172554",
} as const;

export const accent = {
  50: "#faf5ff",
  100: "#f3e8ff",
  200: "#e9d5ff",
  300: "#d8b4fe",
  400: "#c084fc",
  500: "#a855f7",
  600: "#9333ea",
  700: "#7c3aed",
  800: "#6b21a8",
  900: "#581c87",
} as const;

export const slate = {
  50: "#f8fafc",
  100: "#f1f5f9",
  200: "#e2e8f0",
  300: "#cbd5e1",
  400: "#94a3b8",
  500: "#64748b",
  600: "#475569",
  700: "#334155",
  800: "#1e293b",
  900: "#0f172a",
  950: "#020617",
} as const;

export const danger = {
  50: "#fef2f2",
  100: "#fee2e2",
  200: "#fecaca",
  300: "#fca5a5",
  400: "#f87171",
  500: "#ef4444",
  600: "#dc2626",
  700: "#b91c1c",
  800: "#991b1b",
  900: "#7f1d1d",
  950: "#450a0a",
} as const;

/**
 * Claudfather's colours, read off its avatar (the GitHub org Claudlobby lives
 * in): the medallion's orange, the night behind it, the robot's cream face.
 * Only Claudlobby's page and its share card wear them (Claudlobby.css).
 */
export const claudfather = {
  orange: "#e5711f", // 4.8:1 on charcoal, 5.7:1 under ink text
  orangeDeep: "#ad5214", // orange text on light ground: 5.3:1 on white
  charcoal: "#262627", // the avatar's background
  ink: "#171717", // the suit
  cream: "#faedd4", // the face: 13:1 on charcoal
} as const;

export const palette = { primary, accent, slate, danger } as const;
