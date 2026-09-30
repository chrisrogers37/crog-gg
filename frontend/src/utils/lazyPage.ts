import { lazy, type ComponentType } from "react";
import { reloadOnce } from "./reloadOnce";

/**
 * React.lazy for a route's page, with one recovery: when the page's chunk
 * won't load, which is what a tab opened before a deploy gets, the page
 * reloads once to fetch the new build, and the page's loading state stays up
 * until it lands. If this tab already reloaded for this path, the error goes
 * on to the route's RouteError (#196 M40).
 *
 * React calls the loader once per page load, so this runs once per failure,
 * whatever the browser calls it.
 */
export function lazyPage(load: () => Promise<{ default: ComponentType }>) {
  return lazy(() =>
    load().catch((error: unknown) => {
      if (reloadOnce()) return new Promise<never>(() => {});
      throw error;
    }),
  );
}
