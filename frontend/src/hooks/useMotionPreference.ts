import { useSyncExternalStore } from "react";

const query = "(prefers-reduced-motion: reduce)";
const snapshot = () => window.matchMedia(query).matches;
const subscribe = (onChange: () => void) => {
  const media = window.matchMedia(query);
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
};

/** One policy for the animated sections, including preference changes mid-visit.
 * The installed Framer useReducedMotion snapshots the setting on mount. Reading
 * the browser store also keeps this policy independent of the motion bundle.
 */
export function useMotionPreference() {
  return useSyncExternalStore(subscribe, snapshot, () => true);
}
