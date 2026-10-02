import snapshot from "./factory-stats.json";

/**
 * The numbers behind "Built by the factory" (#176): a dated snapshot of GitHub,
 * written by scripts/factory-stats.mjs and committed, so every figure on the
 * page keeps the query it came from and the build never calls GitHub.
 */

/** A count and the GitHub search that produced it. */
export type Count = { value: number; query: string };

export type AppStats = {
  repo: string;
  /** Pull requests merged from `since` through `asOf`, not counting dependency bots. */
  merged: Count;
  /** The same, over the 30 days through `asOf`. */
  mergedLast30Days: Count;
};

/** A listed project with a repo: the snapshot has an entry for each. */
export type AppSlug = keyof typeof snapshot.apps;

export type FactoryStats = {
  /** The fleet's first day: every count starts here. */
  since: string;
  /** The last whole day (UTC) counted. */
  asOf: string;
  apps: Record<AppSlug, AppStats>;
  tracker: { latestNumber: number; source: string };
};

export const factoryStats: FactoryStats = snapshot;

/** The snapshot for one of Chris's repos, by its name, if it has one. */
export const statsForRepo = (name: string): AppStats | undefined =>
  Object.values(factoryStats.apps).find(
    (app) => app.repo === `chrisrogers37/${name}`,
  );
