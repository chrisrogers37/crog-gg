import type { Project } from "../../../types";
import { Hero } from "./Hero";
import { HowItWorks } from "./HowItWorks";
import { Quickstart } from "./Quickstart";
import { Roadmap } from "./Roadmap";
import { Updates } from "./Updates";
import { WhyClaudlobby } from "./WhyClaudlobby";
import { Workers } from "./Workers";
import "./Claudlobby.css";

/**
 * Claudlobby's page under /projects: its own sections in place of the
 * standard project page's. The copy is a typed module (content/claudlobby.ts),
 * so a missing or misspelled field fails the type check; what index.yaml says
 * of the project (whether it's featured) comes from `project`.
 */
export function ClaudlobbyPage({ project }: { project: Project }) {
  // .cl-page: Claudfather's colours, for this page's sections alone.
  return (
    <div className="cl-page">
      <Hero project={project} />
      <Workers />
      <HowItWorks />
      <WhyClaudlobby />
      <Quickstart />
      <Roadmap />
      <Updates />
    </div>
  );
}
