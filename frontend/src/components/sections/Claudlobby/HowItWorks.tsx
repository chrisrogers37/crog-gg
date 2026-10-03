import { claudlobby } from "../../../content/claudlobby";
import { InlineCode } from "../../common/InlineCode";
import { PageSection } from "../../common/PageSection";

/** How a fleet comes to run, in three steps: declare it, plan it, let it run. */
export function HowItWorks() {
  const { howItWorks } = claudlobby;
  return (
    <PageSection id="how-it-works" heading={howItWorks.heading} intro={howItWorks.intro}>
      {/* role="list": Safari drops list semantics under list-style: none. */}
      <ol className="cl-steps" role="list">
        {howItWorks.steps.map((step, index) => (
          <li key={step.title} className="card cl-step">
            <span className="cl-step-number" aria-hidden="true">
              {index + 1}
            </span>
            <h3>{step.title}</h3>
            <code className="cl-step-code">{step.code}</code>
            <p>
              <InlineCode text={step.body} />
            </p>
          </li>
        ))}
      </ol>
    </PageSection>
  );
}
