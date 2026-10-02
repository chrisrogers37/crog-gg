import { createContext, useContext, useEffect } from "react";

export type SectionLink = { id: string; label: string };

/** A page's sections, which the mobile menu links to as #id. */
export type SectionMenu = { sections: SectionLink[] };

/**
 * Lets a page add its own sections to the site's one mobile menu. Layout
 * renders that menu on every page (so it works while a page is still
 * loading) and provides this setter.
 */
export const SectionMenuContext = createContext<
  (menu: SectionMenu | null) => void
>(() => {});

/**
 * Lists `sections` in the mobile menu while the calling page is mounted.
 * `sections` should be stable (a module constant).
 */
export function useSectionMenu(sections: SectionLink[]) {
  const register = useContext(SectionMenuContext);
  useEffect(() => {
    register({ sections });
    return () => register(null);
  }, [register, sections]);
}
