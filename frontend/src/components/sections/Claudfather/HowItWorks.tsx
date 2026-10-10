import { claudfather } from "../../../content/claudfather";
import { PageSection } from "../../common/PageSection";

export function HowItWorks() {
  const { workflow } = claudfather;
  return (
    <PageSection
      id="how-it-works"
      heading={workflow.heading}
      intro={workflow.intro}
    >
      <p className="page-eyebrow">{workflow.label}</p>
      <ol className="cf-steps">
        {workflow.steps.map((step) => (
          <li key={step.title}>
            <h3>{step.title}</h3>
            <p>{step.body}</p>
          </li>
        ))}
      </ol>
      <p className="page-note cf-workflow-note">{workflow.caveat}</p>
    </PageSection>
  );
}
