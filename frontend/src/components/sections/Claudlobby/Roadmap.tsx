import { claudlobby } from "../../../content/claudlobby";
import { InlineCode } from "../../common/InlineCode";
import { PageSection } from "../../common/PageSection";

/**
 * What the repo does now, kept apart from what's planned, so nothing planned
 * reads as shipped (#179).
 */
export function Roadmap() {
  const { roadmap } = claudlobby;
  return (
    <PageSection id="roadmap" heading={roadmap.heading} intro={roadmap.intro}>
      <div className="cl-roadmap">
        {[roadmap.today, roadmap.next].map((column) => (
          <div key={column.heading} className="card cl-roadmap-column">
            <h3>{column.heading}</h3>
            <ul className="page-list">
              {column.items.map((item) => (
                <li key={item}>
                  <InlineCode text={item} />
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </PageSection>
  );
}
