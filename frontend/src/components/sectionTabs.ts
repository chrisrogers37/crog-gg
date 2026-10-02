import site from "virtual:site-config";

/**
 * /about's sections, in order, from site.yaml (#188). SectionNav's tabs, the
 * mobile menu, the loading skeleton and the "next section" link all read this
 * list.
 */
export const SECTIONS = site.sections;

/**
 * The ids that tie SectionNav's tabs to the one panel AboutPage shows them in:
 * each tab controls the panel, and the panel is labelled by the open tab.
 */
export const SECTION_PANEL_ID = "section-panel";

export const sectionTabId = (sectionId: string) => `section-tab-${sectionId}`;
