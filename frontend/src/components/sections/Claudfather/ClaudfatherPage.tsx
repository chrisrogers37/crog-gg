import type { Project } from "../../../types";
import { claudfather } from "../../../content/claudfather";
import { PageSection } from "../../common/PageSection";
import { Hero } from "./Hero";
import { HowItWorks } from "./HowItWorks";
import { Family } from "./Family";
import { GetStarted } from "./GetStarted";
import { OwnerLinks } from "./OwnerLinks";
import "./Claudfather.css";

export function ClaudfatherPage({ project }: { project: Project }) {
  return (
    <div className="cl-page">
      <Hero project={project} />
      <HowItWorks />
      <Family />
      <PageSection id="why" heading={claudfather.why.heading}>
        <p className="page-lead">{claudfather.why.body}</p>
      </PageSection>
      <GetStarted />
      <OwnerLinks />
    </div>
  );
}
