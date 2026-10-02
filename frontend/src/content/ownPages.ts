/**
 * The projects with a page of their own (content/projectPages.ts), by id.
 * Apart from the pages themselves, so the site checks and the e2e tests can
 * know them without loading any React.
 */
export const OWN_PAGE_IDS = ["claudlobby"] as const;

export type OwnPageId = (typeof OWN_PAGE_IDS)[number];

/** Whether a project's page is its own rather than the standard one. */
export const hasOwnPage = (id: string): id is OwnPageId =>
  (OWN_PAGE_IDS as readonly string[]).includes(id);
