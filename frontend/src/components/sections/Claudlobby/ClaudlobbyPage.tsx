import { DarkFactory } from "./DarkFactory";
import { Hero } from "./Hero";
import { Quickstart } from "./Quickstart";
import { Roadmap } from "./Roadmap";
import { Updates } from "./Updates";
import { WhyClaudlobby } from "./WhyClaudlobby";
import "./Claudlobby.css";

/**
 * Claudlobby's page under /projects: its own sections in place of the
 * standard project page's. The copy is bundled (content/claudlobby.ts), so the
 * hero renders without waiting on a fetch.
 */
export function ClaudlobbyPage() {
  return (
    <>
      <Hero />
      <DarkFactory />
      <WhyClaudlobby />
      <Quickstart />
      <Roadmap />
      <Updates />
    </>
  );
}
