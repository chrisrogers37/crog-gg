/**
 * The site's theme: which one is stored, and putting one on <html> (#196 M70).
 *
 * main.tsx applies the stored theme before React renders, so the first paint
 * is already in it, and uiStore's setTheme applies every change after that.
 */

export const THEMES = ["light", "dark", "system"] as const;
export type Theme = (typeof THEMES)[number];

/** The localStorage key uiStore persists to, and the theme is read from. */
export const UI_STORAGE_KEY = "ui-storage";

const DARK_QUERY = "(prefers-color-scheme: dark)";

/**
 * The stored theme, or "light" when there is none or it can't be read. Any
 * localStorage access throws in a browser that blocks site data, and before
 * the app's first render that left the page blank.
 */
export function readStoredTheme(): Theme {
  try {
    const stored = JSON.parse(localStorage.getItem(UI_STORAGE_KEY) ?? "null");
    const theme = THEMES.find((name) => name === stored?.state?.theme);
    return theme ?? "light";
  } catch {
    return "light";
  }
}

/** Stops "system" following the OS; set while it does. */
let stopFollowingOs: (() => void) | undefined;

/**
 * Puts `theme` on <html>. "system" follows the OS setting and keeps following
 * it, so switching the OS theme applies at once; choosing another theme stops
 * that.
 */
export function applyTheme(theme: Theme) {
  stopFollowingOs?.();
  stopFollowingOs = undefined;

  const root = document.documentElement;
  if (theme !== "system") {
    root.classList.toggle("dark", theme === "dark");
    return;
  }

  const query = window.matchMedia(DARK_QUERY);
  const follow = () => root.classList.toggle("dark", query.matches);
  follow();
  query.addEventListener("change", follow);
  stopFollowingOs = () => query.removeEventListener("change", follow);
}
