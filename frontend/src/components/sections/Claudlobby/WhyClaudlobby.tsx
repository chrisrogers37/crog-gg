import { claudlobby } from "../../../content/claudlobby";
import { InlineCode } from "../../common/InlineCode";
import { PageSection } from "../../common/PageSection";
import { SourceNote } from "./SourceNote";

const { why } = claudlobby;
const { library } = why;

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
        <SourceNote lead="Source:" from={library} />
      </div>
    </PageSection>
  );
}
