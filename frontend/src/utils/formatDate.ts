// Kept apart from dateUtils, which only the lazy Timeline uses, so the
// homepage bundle doesn't carry its parser.
/** "2026-09-29" as "Sep 29, 2026", the same in every time zone. */
export const formatDay = (isoDate: string) =>
  new Date(`${isoDate}T00:00:00Z`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });

/** "2026-01-05" as "Jan 2026", the same in every time zone. */
export const formatMonth = (isoDate: string) =>
  new Date(`${isoDate}T00:00:00Z`).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
