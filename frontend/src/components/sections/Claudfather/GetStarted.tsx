import { claudfather } from "../../../content/claudfather";
import { CLAUDLOBBY_GETTING_STARTED } from "../../../content/links";
import { PageSection } from "../../common/PageSection";
import { SourceNote } from "./SourceNote";

export function GetStarted() {
  const { start } = claudfather;
  return (
    <PageSection
      id="quickstart"
      heading={start.heading}
      intro={start.intro}
    >
      <a
        className="cf-source-link"
        href={CLAUDLOBBY_GETTING_STARTED}
        target="_blank"
        rel="noopener noreferrer"
      >
        {start.setupLabel} <span aria-hidden="true">↗</span>
      </a>
      <p className="page-note cf-safety">{start.safety.note}</p>
      <SourceNote lead={start.safety.lead} from={start.safety} />
    </PageSection>
  );
}
