import { beforeAll, describe, expect, it } from "vitest";
import site from "virtual:site-config";
import { hasOwnPage } from "../content/ownPages";
import type { Project } from "../types/Project";
import { githubRepo, hasLiveDemo, isServedOwner } from "../utils/projectLinks";
import { PLANNED, strings } from "../test/claudfatherRules";
import { shippedProjects } from "../test/content";
import { frameSrc } from "../test/csp";

/**
 * The add-project skill's rules (#197 M17), held by the test suite rather than
 * by the skill's prose alone, so a project that breaks one fails here.
 */
describe("the shipped projects", () => {
  let projects: Project[];
  beforeAll(async () => {
    projects = await shippedProjects();
  });

  it("are there to check, each in a category", () => {
    // Shipped content must render (#120): no projects is a broken page, and
    // a project's page names its category.
    expect(projects.length).toBeGreaterThan(0);
    for (const project of projects) expect(project.category, project.id).toMatch(/\S/);
  });

  it("each use one emoji as the icon, which the card prints as text", () => {
    // One pictograph, with any variation selector, skin tone or ZWJ joins. An
    // icon-font class name would print as its letters.
    const ONE_EMOJI =
      /^\p{Extended_Pictographic}(?:\uFE0F|\p{Emoji_Modifier}|\u200D\p{Extended_Pictographic})*$/u;
    for (const project of projects) {
      expect(project.icon, project.id).toMatch(ONE_EMOJI);
    }
  });

  it("only link GitHub repos of an owner the API serves", (ctx) => {
    // A page of its own (Claudfather's) shows no GitHub panels, so its repo
    // may be anyone's.
    const linked = projects.filter((project) => githubRepo(project) && !hasOwnPage(project.id));
    if (linked.length === 0) ctx.skip(); // no project links a repo
    // The API serves the public repos of github.username (and any
    // allowed_owners), so another owner's repo would show no stats or README.
    for (const project of linked) {
      const owner = githubRepo(project)!.owner;
      expect(isServedOwner(site, owner), `${project.id}: ${owner}`).toBe(true);
    }
  });

  it("say of Claudfather, when they list it, what its page says: no other model provider", (ctx) => {
    // The card and its page's head show the project file, so it keeps the
    // page copy's rule (#179): other agents and providers are the roadmap.
    const claudfather = projects.find((project) => project.id === "claudfather");
    if (!claudfather) ctx.skip(); // the site doesn't list Claudfather
    for (const text of strings(claudfather)) expect(text, text).not.toMatch(PLANNED);
  });

  it("only embed demos from hosts the CSP lets the page frame", (ctx) => {
    const embedded = projects.filter(hasLiveDemo);
    if (embedded.length === 0) ctx.skip(); // no project embeds a demo
    const frame = frameSrc();
    for (const project of embedded) {
      expect(frame, project.id).toContain(new URL(project.demo!).origin);
    }
  });
});
