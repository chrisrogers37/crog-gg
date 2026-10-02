import type { ReactNode } from "react";
import { InlineCode } from "./InlineCode";

type PageSectionProps = {
  /** Also the anchor the section can be linked to, e.g. #quickstart. */
  id: string;
  heading: string;
  intro?: string;
  children: ReactNode;
};

/**
 * One of a page's sections (styles/page.css): an h2 that names it, an
 * optional intro, the content.
 */
export function PageSection({ id, heading, intro, children }: PageSectionProps) {
  const headingId = `${id}-heading`;
  return (
    <section id={id} className="page-section" aria-labelledby={headingId}>
      <h2 id={headingId}>{heading}</h2>
      {intro && (
        <p className="page-lead">
          <InlineCode text={intro} />
        </p>
      )}
      {children}
    </section>
  );
}
