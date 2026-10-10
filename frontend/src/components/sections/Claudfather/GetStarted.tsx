import { claudfather } from "../../../content/claudfather";
import { CLAUDLOBBY_GETTING_STARTED } from "../../../content/links";
import { PageSection } from "../../common/PageSection";
import { WebsiteLink } from "./WebsiteLink";

export function GetStarted() {
  const { start, website } = claudfather;
  return (
    <PageSection
      id="quickstart"
      heading={start.heading}
      intro={
        website
          ? start.intro
          : "Follow the setup guide to build a local fleet with Claudlobby."
      }
    >
      <WebsiteLink website={website} />
      <a
        className="cf-source-link"
        href={CLAUDLOBBY_GETTING_STARTED}
        target="_blank"
        rel="noopener noreferrer"
      >
        {start.setupLabel} <span aria-hidden="true">↗</span>
      </a>
    </PageSection>
  );
}
