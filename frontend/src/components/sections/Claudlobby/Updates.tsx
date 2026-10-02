import { claudlobby } from "../../../content/claudlobby";
import {
  CLAUDLOBBY_RELEASES,
  CLAUDLOBBY_RELEASES_FEED,
} from "../../../content/links";
import { track } from "../../../services/analytics";
import { PageSection } from "../../common/PageSection";

/**
 * For visitors not ready to try Claudlobby yet (#175): GitHub's release
 * notifications, or the releases feed. Nothing to sign up for here, so the
 * site sends nothing anywhere and keeps no email addresses.
 */
export function Updates() {
  const { updates } = claudlobby;
  return (
    <PageSection id="updates" heading={updates.heading} intro={updates.intro}>
      <p className="page-links">
        <a
          href={CLAUDLOBBY_RELEASES}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => track({ name: "updates_click" })}
        >
          {updates.watchLink}
        </a>
        <a
          href={CLAUDLOBBY_RELEASES_FEED}
          target="_blank"
          rel="noopener noreferrer"
        >
          {updates.feedLink}
        </a>
      </p>
      <p className="page-note">{updates.howTo}</p>
    </PageSection>
  );
}
