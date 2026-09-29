import { claudlobby } from "../../../content/claudlobby";
import { InlineCode } from "./InlineCode";
import { Section } from "./Section";

/** What a dark factory is, in the three steps it takes to run one. */
export function DarkFactory() {
  const { darkFactory } = claudlobby;
  return (
    <Section
      id="dark-factory"
      heading={darkFactory.heading}
      intro={darkFactory.intro}
    >
      <ol className="cl-steps">
        {darkFactory.steps.map((step, index) => (
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
    </Section>
  );
}
