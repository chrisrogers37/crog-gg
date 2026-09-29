import type { ReactNode } from "react";
import { InlineCode } from "./InlineCode";

type SectionProps = {
  /** Also the anchor the section can be linked to, e.g. #quickstart. */
  id: string;
  heading: string;
  intro?: string;
  children: ReactNode;
};

/** A homepage section: an h2 that names it, an optional intro, the content. */
export function Section({ id, heading, intro, children }: SectionProps) {
  const headingId = `${id}-heading`;
  return (
    <section id={id} className="cl-section" aria-labelledby={headingId}>
      <h2 id={headingId}>{heading}</h2>
      {intro && (
        <p className="cl-lead">
          <InlineCode text={intro} />
        </p>
      )}
      {children}
    </section>
  );
}
