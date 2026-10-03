import { claudlobby } from "../../../content/claudlobby";
import { InlineCode } from "../../common/InlineCode";
import { PageSection } from "../../common/PageSection";
import { SourceNote } from "./SourceNote";

/**
 * The jobs a fleet does, each a role from the library: who the page is for
 * (Chris, 2026-10-02), a solo founder or a small team with work across the
 * business, not only code. Each says only what its profile in the repo does,
 * and where that's from.
 */
export function Workers() {
  const { workers } = claudlobby;
  return (
    <PageSection id="workers" heading={workers.heading} intro={workers.intro}>
      {/* role="list": Safari drops list semantics under list-style: none. */}
      <ul className="cl-roles" role="list">
        {workers.roles.map((role) => (
          <li key={role.title} className="card cl-role">
            <h3>{role.title}</h3>
            <p>
              <InlineCode text={role.body} />
            </p>
          </li>
        ))}
      </ul>
      <SourceNote lead="Roles from" from={workers} />
    </PageSection>
  );
}
