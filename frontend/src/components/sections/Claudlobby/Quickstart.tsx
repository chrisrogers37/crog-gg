import { claudlobby } from "../../../content/claudlobby";
import {
  CLAUDLOBBY_GETTING_STARTED,
  CLAUDLOBBY_ISSUES,
  CLAUDLOBBY_README_QUICKSTART,
} from "../../../content/links";
import { RepoLink } from "../../common/RepoLink";
import { InlineCode } from "../../common/InlineCode";
import { PageSection } from "../../common/PageSection";

/**
 * What setup needs, then the README's own steps. The hero's Quickstart button
 * jumps here. The commands stay in the README, which changes with each
 * release, so this page can't drift from them.
 */
export function Quickstart() {
  const { quickstart } = claudlobby;
  return (
    <PageSection
      id="quickstart"
      heading={quickstart.heading}
      intro={quickstart.intro}
    >
      <h3>{quickstart.prerequisitesHeading}</h3>
      <ul className="page-list">
        {quickstart.prerequisites.map((item) => (
          <li key={item}>
            <InlineCode text={item} />
          </li>
        ))}
      </ul>
      <p className="page-links">
        <RepoLink location="quickstart" href={CLAUDLOBBY_README_QUICKSTART}>
          {quickstart.readmeLink}
        </RepoLink>
        <a
          href={CLAUDLOBBY_GETTING_STARTED}
          target="_blank"
          rel="noopener noreferrer"
        >
          {quickstart.docsLink}
        </a>
      </p>
      <p className="page-note">
        {quickstart.alphaNote}{" "}
        <a href={CLAUDLOBBY_ISSUES} target="_blank" rel="noopener noreferrer">
          {quickstart.issuesLink}
        </a>
      </p>
    </PageSection>
  );
}
