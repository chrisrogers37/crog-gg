import { claudlobby } from "../../../content/claudlobby";
import {
  CLAUDLOBBY_GETTING_STARTED,
  CLAUDLOBBY_README_QUICKSTART,
} from "../../../content/links";
import { InlineCode } from "./InlineCode";
import { Section } from "./Section";

/**
 * What setup needs, then the README's own steps. The hero's Quickstart button
 * jumps here. The commands stay in the README, which changes with each
 * release, so this page can't drift from them.
 */
export function Quickstart() {
  const { quickstart } = claudlobby;
  return (
    <Section
      id="quickstart"
      heading={quickstart.heading}
      intro={quickstart.intro}
    >
      <h3>{quickstart.prerequisitesHeading}</h3>
      <ul className="cl-prereqs">
        {quickstart.prerequisites.map((item) => (
          <li key={item}>
            <InlineCode text={item} />
          </li>
        ))}
      </ul>
      <p className="cl-links">
        <a
          href={CLAUDLOBBY_README_QUICKSTART}
          target="_blank"
          rel="noopener noreferrer"
        >
          {quickstart.readmeLink}
        </a>
        <a
          href={CLAUDLOBBY_GETTING_STARTED}
          target="_blank"
          rel="noopener noreferrer"
        >
          {quickstart.docsLink}
        </a>
      </p>
    </Section>
  );
}
