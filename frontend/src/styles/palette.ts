/**
 * Palette: the canonical color source of truth for the site.
 *
 * These raw ramps are the ONE place a brand color value lives. Both
 * `tailwind.config.js` and `src/styles/tokens.ts` import from here, so a
 * color is defined exactly once and the two cannot drift apart.
 *
 * The CSS custom properties in `src/App.css` mirror these by hand (plain CSS
 * cannot import JS); each var there is annotated with the shade it tracks, so
 * keep them in step with these values.
 *
 * Scales follow Tailwind's 50..950 convention:
 *   primary = blue (brand)   accent = purple   slate = neutral
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

export const palette = { primary, accent, slate } as const;
