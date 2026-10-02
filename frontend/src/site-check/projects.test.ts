import { beforeAll, describe, expect, it } from "vitest";
import site from "virtual:site-config";
import type { Project } from "../types/Project";
import { githubRepo, hasLiveDemo } from "../utils/projectLinks";
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

  it("are there to check, each in a category the filter can show", () => {
    // Shipped content must render (#120): no projects is a broken page, and
    // the filter needs categories to offer.
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

  it("only link GitHub repos of the site's owner", (ctx) => {
    const linked = projects.filter((project) => githubRepo(project));
    if (linked.length === 0) ctx.skip(); // no project links a repo
    // The API looks a repo's name up under this owner, so another owner's repo
    // would show the owner's same-named repo, or no README. site.yaml's github
    // social stands in for the API's GITHUB_USERNAME until #189 reads it too.
    const github = site.socials.find((social) => social.icon === "github");
    expect(github, "a github social in site.yaml").toBeDefined();
    const owner = new URL(github!.url).pathname.split("/")[1];
    for (const project of linked) {
      expect(githubRepo(project)?.owner, project.id).toBe(owner);
    }
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
