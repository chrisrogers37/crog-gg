const RELOADED_PATH = "crog:reloaded-path";

/**
 * Reloads the page unless this tab already did for this path, and returns
 * whether it did.
 *
 * Once per path, so a chunk that is really broken ends on the error page, not
 * in a reload loop. With storage blocked there's no telling a first attempt
 * from a loop, so it doesn't reload at all.
 */
export function reloadOnce(): boolean {
  const path = window.location.pathname;
  try {
    if (sessionStorage.getItem(RELOADED_PATH) === path) return false;
    sessionStorage.setItem(RELOADED_PATH, path);
  } catch {
    return false;
  }
  window.location.reload();
  return true;
}
