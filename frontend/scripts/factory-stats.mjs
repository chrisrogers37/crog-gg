// Writes src/content/factory-stats.json: every number the homepage's "Built by
// the factory" section and the project pages show (#176), each kept with the
// GitHub query it came from and the day it was taken. Run it by hand and commit
// the result, so the build never depends on GitHub and every figure can be
// checked:
//
//   GITHUB_TOKEN=$(gh auth token) node scripts/factory-stats.mjs
import fs from "node:fs/promises";
import yaml from "js-yaml";

const OUT = new URL("../src/content/factory-stats.json", import.meta.url);
const PROJECTS = new URL("../public/content/projects/", import.meta.url);
const TRACKER = "Claudfather/Claudlobby";

// Dependency bumps aren't work anyone built, so they're not counted.
const NOT_BOTS = "-author:app/dependabot -author:app/renovate -author:app/github-actions";

const token = process.env.GITHUB_TOKEN;
if (!token) throw new Error("Set GITHUB_TOKEN, e.g. GITHUB_TOKEN=$(gh auth token)");

// Local calendar days, so "as of" is the day the snapshot was taken here.
const day = (date) => date.toLocaleDateString("en-CA");
const asOf = day(new Date());
const monthAgo = day(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));

const wait = (seconds) =>
  new Promise((resolve) => setTimeout(resolve, seconds * 1000));

async function github(path, attempt = 1) {
  const response = await fetch(`https://api.github.com/${path}`, {
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
    },
  });
  // Search's burst limit trips even at 20 requests a minute, often without a
  // retry-after header, so any rate-limit refusal waits and tries again. Any
  // other failure (a bad token, say) is reported at once.
  if ((response.status === 403 || response.status === 429) && attempt < 5) {
    const { message = "" } = await response.clone().json().catch(() => ({}));
    if (/rate limit/i.test(message)) {
      const seconds = Number(response.headers.get("retry-after")) || 60;
      console.log(`rate limited, retrying in ${seconds}s`);
      await wait(seconds + 1);
      return github(path, attempt + 1);
    }
  }
  if (!response.ok) {
    throw new Error(`GitHub ${response.status} for ${path}: ${await response.text()}`);
  }
  return response.json();
}

// Search allows 30 requests a minute; spacing them keeps a run under that.
async function search(query) {
  const result = await github(
    `search/issues?q=${encodeURIComponent(query)}&sort=created&order=asc&per_page=1`,
  );
  await wait(3);
  return result;
}

const readYaml = async (file) =>
  yaml.load(await fs.readFile(new URL(file, PROJECTS), "utf8"));

// Every listed project with a repo, keyed by its id (its /projects/:id page).
const apps = {};
for (const file of (await readYaml("index.yaml")).projects) {
  const { id, github: repoUrl } = await readYaml(file);
  const repo = repoUrl?.match(/github\.com\/([\w.-]+\/[\w.-]+)/)?.[1];
  if (!repo) continue;

  const merged = `repo:${repo} is:pr is:merged ${NOT_BOTS}`;
  const recent = `${merged} merged:>=${monthAgo}`;
  const all = await search(merged);
  const lastMonth = await search(recent);
  apps[id] = {
    repo,
    merged: { value: all.total_count, query: merged },
    mergedLast30Days: { value: lastMonth.total_count, query: recent },
    // When the oldest counted pull request was opened: every count is "since".
    since: all.items[0]?.created_at.slice(0, 10) ?? null,
  };
  console.log(id, apps[id].merged.value, apps[id].mergedLast30Days.value);
}

const latestPath = `repos/${TRACKER}/issues?state=all&sort=created&direction=desc&per_page=1`;
const [latest] = await github(latestPath);

const stats = {
  asOf,
  apps,
  tracker: {
    latestNumber: latest.number,
    source: `https://api.github.com/${latestPath}`,
  },
};
await fs.writeFile(OUT, `${JSON.stringify(stats, null, 2)}\n`);
console.log(`wrote ${OUT.pathname}`);
