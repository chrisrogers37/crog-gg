import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import { PROFILE_URLS } from "../content/links";
import type { Project } from "../types/Project";
import { githubRepo, hasLiveDemo } from "../utils/projectLinks";
import { shippedProjects } from "./content";

/**
 * The add-project skill's rules (#197 M17), held by the test suite rather than
 * by the skill's prose alone, so a project that breaks one fails here.
 */
describe("the shipped projects", () => {
  let projects: Project[];
  beforeAll(async () => {
    projects = await shippedProjects();
  });

  it("are there to check", () => {
    expect(projects.length).toBeGreaterThan(0);
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

  it("only link GitHub repos of the site's owner", () => {
    // The API looks a repo's name up under this owner, so another owner's repo
    // would show the owner's same-named repo, or no README. PROFILE_URLS.github
    // stands in for the API's GITHUB_USERNAME; #189 moves both into config.
    const owner = new URL(PROFILE_URLS.github).pathname.split("/")[1];
    for (const project of projects) {
      const repo = githubRepo(project);
      if (repo) expect(repo.owner, project.id).toBe(owner);
    }
  });

  it("only embed demos from hosts the CSP lets the page frame", () => {
    // The deployed CSP. Vite won't serve a file from outside frontend/, so
    // this one is read from disk.
    const vercelJson = readFileSync(
      resolve(__dirname, "../../../vercel.json"),
      "utf8",
    );
    const policy = (
      JSON.parse(vercelJson) as {
        headers: { headers: { key: string; value: string }[] }[];
      }
    ).headers
      .flatMap((rule) => rule.headers)
      .find((header) => header.key === "Content-Security-Policy")?.value;
    const frameSrc =
      policy
        ?.split(";")
        .map((directive) => directive.trim().split(/\s+/))
        .find(([name]) => name === "frame-src")
        ?.slice(1) ?? [];
    // The parse itself, so a reshaped vercel.json can't make this pass empty.
    expect(policy, "no CSP in vercel.json").toBeDefined();
    expect(frameSrc, "no frame-src in the CSP").not.toHaveLength(0);

    for (const project of projects) {
      if (hasLiveDemo(project)) {
        expect(frameSrc, project.id).toContain(new URL(project.demo!).origin);
      }
    }
  });
});
