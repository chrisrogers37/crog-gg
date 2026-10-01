const LAST_RELOAD = "crog:last-reload";

/**
 * A reload that fails again this soon is a loop. A new deploy, which this
 * reload is for, comes minutes or days later.
 */
const LOOP_WINDOW_MS = 60_000;

type Reload = { path: string; at: number };

const readLastReload = (value: string | null): Reload | null => {
  try {
    const parsed: unknown = JSON.parse(value ?? "null");
    const { path, at } = (parsed ?? {}) as Partial<Reload>;
    return typeof path === "string" && typeof at === "number"
      ? { path, at }
      : null;
  } catch {
    return null;
  }
};

/**
 * Reloads the page unless this tab reloaded the same path within the last
 * minute, and returns whether it did.
 *
 * The window stops a chunk that is really broken from looping: it ends on the
 * error page instead. With storage blocked there's no telling a first attempt
 * from a loop, so it doesn't reload at all.
 */
export function reloadOnce(): boolean {
  const path = window.location.pathname;
  const now = Date.now();
  try {
    const last = readLastReload(sessionStorage.getItem(LAST_RELOAD));
    if (last?.path === path && now - last.at < LOOP_WINDOW_MS) return false;
    sessionStorage.setItem(LAST_RELOAD, JSON.stringify({ path, at: now }));
  } catch {
    return false;
  }
  window.location.reload();
  return true;
}
