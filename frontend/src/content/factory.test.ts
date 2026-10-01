import { beforeAll, describe, expect, it } from "vitest";
import { claudlobby } from "./claudlobby";
import { factoryStats } from "./factory";
import type { Project } from "../types/Project";
import { shippedProjects } from "../test/content";

let projects: Project[];
beforeAll(async () => {
  projects = await shippedProjects();
});

describe("Built by the factory (#176)", () => {
  it.each(claudlobby.factory.apps)(
    "shows $slug as its project page describes it",
    (app) => {
      // The homepage copy is bundled; the project pages read YAML. They must
      // agree, and the card's /projects link resolves by the project's id.
      const project = projects.find(({ id }) => id === app.slug);
      expect(project, `no listed project with id ${app.slug}`).toBeDefined();
      expect(app.name).toBe(project?.title);
      expect(app.url).toBe(project?.url);
      expect(`https://github.com/${factoryStats.apps[app.slug].repo}`).toBe(
        project?.github,
      );
    },
  );

  it("has a snapshot for every listed project with a repo", () => {
    // A project added without rerunning scripts/factory-stats.mjs would show
    // no numbers on its page.
    const withRepo = projects.filter(({ github }) => github).map(({ id }) => id);
    expect(Object.keys(factoryStats.apps).sort()).toEqual(withRepo.sort());
  });

  it("has a dated, sourced number behind every figure it shows", () => {
    expect(factoryStats.asOf).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    for (const stats of Object.values(factoryStats.apps)) {
      for (const count of [stats.merged, stats.mergedLast30Days]) {
        expect(Number.isInteger(count.value)).toBe(true);
        expect(count.query).toContain(`repo:${stats.repo} is:pr is:merged`);
        // Dependency bumps and workflow bots aren't anyone's work.
        for (const bot of ["dependabot", "renovate", "github-actions"]) {
          expect(count.query).toContain(`-author:app/${bot}`);
        }
      }
      expect(stats.mergedLast30Days.value).toBeLessThanOrEqual(
        stats.merged.value,
      );
    }
    expect(Number.isInteger(factoryStats.tracker.latestNumber)).toBe(true);
    expect(factoryStats.tracker.source).toMatch(
      /^https:\/\/api\.github\.com\/repos\/Claudfather\/Claudlobby\//,
    );
  });
});
