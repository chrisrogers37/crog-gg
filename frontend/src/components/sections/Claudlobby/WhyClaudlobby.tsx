import { claudlobby } from "../../../content/claudlobby";
import { InlineCode } from "../../common/InlineCode";
import { PageSection } from "../../common/PageSection";

const { why } = claudlobby;
const { library } = why;

/** "2026-09-29" as "Sep 29, 2026", the same in every time zone. */
const AS_OF = new Date(`${library.asOf}T00:00:00Z`).toLocaleDateString(
  "en-US",
  { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" },
);

/**
 * What sets it apart, and what is in the library today. Every count is shown
 * with where it came from and when (#173: numbers must match the README).
 */
export function WhyClaudlobby() {
  return (
    <PageSection id="why" heading={why.heading}>
      <div className="cl-points">
        {why.points.map((point) => (
          <div key={point.title}>
            <h3>{point.title}</h3>
            <p>
              <InlineCode text={point.body} />
            </p>
          </div>
        ))}
      </div>
      <div className="card cl-library">
        <h3>{library.heading}</h3>
        <dl className="cl-counts">
          {library.counts.map((count) => (
            <div key={count.label}>
              <dt>{count.label}</dt>
              <dd>{count.value}</dd>
            </div>
          ))}
        </dl>
        <p className="cl-source">
          Source:{" "}
          <a href={library.source} target="_blank" rel="noopener noreferrer">
            {library.sourceLabel}
          </a>
          , as of {AS_OF}.
        </p>
      </div>
    </PageSection>
  );
}
