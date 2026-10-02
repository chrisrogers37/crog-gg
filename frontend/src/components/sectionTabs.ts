/**
 * /about's sections, in order. SectionNav's tabs, the mobile menu, the loading
 * skeleton and the "next section" link all read this list.
 */
export const SECTIONS = [
  { id: "about", label: "About" },
  { id: "journey", label: "Journey" },
  { id: "projects", label: "Projects" },
  { id: "music", label: "Music" },
];

/**
 * The ids that tie SectionNav's tabs to the one panel AboutPage shows them in:
 * each tab controls the panel, and the panel is labelled by the open tab.
 */
export const SECTION_PANEL_ID = "section-panel";

export const sectionTabId = (sectionId: string) => `section-tab-${sectionId}`;
