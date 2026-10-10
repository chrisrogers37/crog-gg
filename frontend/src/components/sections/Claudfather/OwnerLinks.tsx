import { claudfather } from "../../../content/claudfather";
import {
  CLAUDLOBBY_RELEASES,
  CLAUDLOBBY_RELEASES_FEED,
} from "../../../content/links";
import { track } from "../../../services/analytics";
import { PageSection } from "../../common/PageSection";

export function OwnerLinks() {
  return (
    <PageSection
      id="updates"
      heading={claudfather.follow.heading}
      intro={claudfather.follow.intro}
    >
      <div className="cf-owner-links">
        <a
          href={CLAUDLOBBY_RELEASES}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => track({ name: "updates_click" })}
        >
          Claudlobby releases
        </a>
        <a
          href={CLAUDLOBBY_RELEASES_FEED}
          target="_blank"
          rel="noopener noreferrer"
        >
          Release feed
        </a>
        <a
          id="roadmap"
          href={claudfather.organization}
          target="_blank"
          rel="noopener noreferrer"
        >
          Current project plans and documentation
        </a>
      </div>
    </PageSection>
  );
}
