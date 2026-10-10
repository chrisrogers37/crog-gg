import { claudfather } from "../../../content/claudfather";
import { PageSection } from "../../common/PageSection";
import { RepoLink } from "../../common/RepoLink";
import { SourceNote } from "./SourceNote";

export function Family() {
  // Deduplicate the public reference when multiple roles share one source.
  const sources = [
    ...new Map(claudfather.family.map((role) => [role.source, role])).values(),
  ];
  return (
    <PageSection id="family" heading="The family">
      <ul className="cf-family">
        {claudfather.family.map((role) => (
          <li id={role.id} key={role.id} className="cf-family-row">
            <div>
              <h3>{role.job}</h3>
              <p className="cf-project-name">{role.name}</p>
            </div>
            <div>
              <p>{role.description}</p>
              {role.repo && (
                <RepoLink
                  location="family"
                  href={role.repo}
                  className="cf-source-link"
                >
                  {role.name} on GitHub <span aria-hidden="true">↗</span>
                </RepoLink>
              )}
            </div>
          </li>
        ))}
      </ul>
      {sources.map((from) => (
        <SourceNote
          key={from.source}
          lead="Roles described in the"
          from={{ ...from, sourceLabel: "public brand reference" }}
        />
      ))}
    </PageSection>
  );
}
