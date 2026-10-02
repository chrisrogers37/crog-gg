import { createContext, useContext, useEffect, useRef } from "react";

export type SectionLink = { id: string; label: string };

export type SectionMenu = {
  sections: SectionLink[];
  activeSection: string;
  onSectionChange: (sectionId: string) => void;
};

/**
 * Lets a page add its own sections to the site's one mobile menu. Layout
 * renders that menu on every page (so it works while a page is still
 * loading) and provides this setter.
 */
export const SectionMenuContext = createContext<
  (menu: SectionMenu | null) => void
>(() => {});

/**
 * Lists `sections` in the mobile menu while the calling page is mounted, with
 * `activeSection` marked. `sections` should be stable (a module constant);
 * `onSectionChange` may be a new function every render.
 */
export function useSectionMenu(
  sections: SectionLink[],
  activeSection: string,
  onSectionChange: (sectionId: string) => void,
) {
  const register = useContext(SectionMenuContext);
  const handler = useRef(onSectionChange);

  useEffect(() => {
    handler.current = onSectionChange;
  });

  useEffect(() => {
    register({
      sections,
      activeSection,
      onSectionChange: (id) => handler.current(id),
    });
    return () => register(null);
  }, [register, sections, activeSection]);
}
