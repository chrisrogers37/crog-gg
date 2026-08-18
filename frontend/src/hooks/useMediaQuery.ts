import { useEffect, useState } from "react";

/**
 * Track whether a CSS media query currently matches.
 *
 * The initial value is read synchronously rather than defaulting to false and
 * correcting on mount: a layout value derived from this would otherwise paint
 * the wide variant once on a phone before snapping to the narrow one.
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() =>
    typeof window !== "undefined" && window.matchMedia
      ? window.matchMedia(query).matches
      : false,
  );

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mql = window.matchMedia(query);
    const onChange = (event: MediaQueryListEvent) => setMatches(event.matches);
    // Re-read on subscribe: the query can have changed between the initial
    // render and this effect.
    setMatches(mql.matches);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, [query]);

  return matches;
}
