/**
 * The ids that tie SectionNav's tabs to the one panel AboutPage shows them in:
 * each tab controls the panel, and the panel is labelled by the open tab.
 */
export const SECTION_PANEL_ID = "section-panel";

export const sectionTabId = (sectionId: string) => `section-tab-${sectionId}`;
