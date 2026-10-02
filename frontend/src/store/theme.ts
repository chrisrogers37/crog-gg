/**
 * The site's themes, and putting one on <html> (#196 M70).
 *
 * uiStore holds the choice, persisted and already loaded before React renders.
 * main.tsx applies it at startup and again whenever the OS theme switches, and
 * setTheme applies each change.
 */

export const THEMES = ["light", "dark", "system"] as const;
export type Theme = (typeof THEMES)[number];

/** Matches while the OS is in dark mode, which "system" follows. */
export const DARK_QUERY = "(prefers-color-scheme: dark)";

/** Puts `theme` on <html>. "system" takes the OS setting as it is now. */
export function applyTheme(theme: Theme) {
  const dark =
    theme === "dark" ||
    (theme === "system" && window.matchMedia(DARK_QUERY).matches);
  document.documentElement.classList.toggle("dark", dark);
}
