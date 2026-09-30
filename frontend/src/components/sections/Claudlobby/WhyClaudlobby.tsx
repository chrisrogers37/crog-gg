import { claudlobby } from "../../../content/claudlobby";
import { formatDay } from "../../../utils/formatDate";
import { Counts } from "./Counts";
import { InlineCode } from "./InlineCode";
import { Section } from "./Section";

const { why } = claudlobby;
const { library } = why;

/**
 * What sets it apart, and what is in the library today. Every count is shown
 * with where it came from and when (#173: numbers must match the README).
 */
export function WhyClaudlobby() {
  return (
    <Section id="why" heading={why.heading}>
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
        <Counts items={library.counts} />
        <p className="cl-source">
          Source:{" "}
          <a href={library.source} target="_blank" rel="noopener noreferrer">
            {library.sourceLabel}
          </a>
          , as of {formatDay(library.asOf)}.
        </p>
      </div>
    </Section>
  );
}
