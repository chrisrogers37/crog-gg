/** What the page took from the Claudlobby repo: a commit-pinned link, and the day it was read. */
type Sourced = { source: string; sourceLabel: string; asOf: string };

/**
 * Where a count or a list on the page came from, and when (#173). The date is
 * a calendar day ("2026-09-29"), shown as "Sep 29, 2026" in every time zone.
 */
export function SourceNote({ lead, from }: { lead: string; from: Sourced }) {
  const asOf = new Date(`${from.asOf}T00:00:00Z`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
  return (
    <p className="cl-source">
      {lead}{" "}
      <a href={from.source} target="_blank" rel="noopener noreferrer">
        {from.sourceLabel}
      </a>
      , as of {asOf}.
    </p>
  );
}
