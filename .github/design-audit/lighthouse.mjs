// Lighthouse mobile performance of main's build and the branch's build, in one job. The rule is fixed here, before any
// run:
//   Order: six interleaved rounds. Each round runs main, then the branch, so warm-up and drift hit both alike.
//   Figures, per run: the performance score x 100, cumulative layout shift and largest contentful paint. A median is
//     the middle of the sorted values (the mean of the middle two when the count is even).
//   Gates (the job fails on): the branch's median performance below main's median minus 2; the branch's median CLS
//     above main's median CLS.
//   A target with fewer than six good runs, or any run error, is reported, and the gates are read on the runs taken. A
//     target with no good run has no median, and the gates fail with that reason.
// Every run is listed in the report and the step summary whichever way the gates go. Every run blocks the analytics
// paths the site loads, so the runs are not counted as visits.
import { execFileSync, spawnSync } from "node:child_process";
import { appendFileSync, existsSync } from "node:fs";
import { appendFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(process.env.OUT || join(HERE, "out"));
const RUNS_DIR = join(OUT, "lighthouse");
const origin = (value) => `${String(value).replace(/\/+$/, "")}/`;

const TARGETS = [
  { name: "main", url: origin(process.env.MAIN || "http://localhost:4181") },
  { name: "pr", url: origin(process.env.PR || "http://localhost:4180") },
];
const BLOCKED = ["*/_vercel/insights/*", "*/_vercel/speed-insights/*"];
const MARGIN = 2;
const ROUNDS = 6;
const CLI = join(HERE, "node_modules", "lighthouse", "cli", "index.js");

const oneLine = (text, length) => String(text ?? "").replace(/\s+/g, " ").trim().slice(0, length);
// Lighthouse prints its reason last, after any progress and stack.
const tail = (text, length) => String(text ?? "").replace(/\s+/g, " ").trim().slice(-length);
const cls = (value) => (typeof value === "number" ? String(Number(value.toFixed(5))) : "n/a");
const seconds = (ms) => (typeof ms === "number" ? `${(ms / 1000).toFixed(1)} s` : "n/a");

function chromeVersion() {
  for (const command of ["google-chrome", "google-chrome-stable", "chromium"]) {
    try {
      return execFileSync(command, ["--version"], { encoding: "utf8", timeout: 20000 }).trim();
    } catch {
      // not installed under this name
    }
  }
  return "unknown";
}

async function measure(target, round) {
  const output = join(RUNS_DIR, `lh-${target.name}-${round}.json`);
  const flags = [
    target.url,
    "--only-categories=performance",
    "--form-factor=mobile",
    "--throttling-method=simulate",
    ...BLOCKED.map((pattern) => `--blocked-url-patterns=${pattern}`),
    "--output=json",
    `--output-path=${output}`,
    "--chrome-flags=--headless=new --no-sandbox",
    "--quiet",
  ];
  const [command, args] = existsSync(CLI) ? [process.execPath, [CLI, ...flags]] : ["npx", ["lighthouse", ...flags]];
  const started = Date.now();
  const result = spawnSync(command, args, { cwd: HERE, encoding: "utf8", timeout: 5 * 60 * 1000, maxBuffer: 64 * 1024 * 1024 });
  const run = { target: target.name, round, url: target.url, seconds: Math.round((Date.now() - started) / 1000) };
  if (result.status !== 0 || !existsSync(output)) {
    return { ...run, error: `exit ${result.status ?? result.signal}: ${tail(result.stderr || result.error, 400)}` };
  }
  try {
    const lhr = JSON.parse(await readFile(output, "utf8"));
    const performance = Math.round((lhr.categories?.performance?.score ?? NaN) * 100);
    if (!Number.isFinite(performance)) return { ...run, error: oneLine(`no performance score: ${lhr.runtimeError?.message ?? "unknown"}`, 400) };
    return {
      ...run,
      performance,
      cls: lhr.audits?.["cumulative-layout-shift"]?.numericValue,
      lcp: lhr.audits?.["largest-contentful-paint"]?.numericValue,
      version: lhr.lighthouseVersion,
      userAgent: lhr.environment?.hostUserAgent,
      benchmarkIndex: lhr.environment?.benchmarkIndex,
      warnings: lhr.runWarnings ?? [],
    };
  } catch (error) {
    return { ...run, error: oneLine(error, 300) };
  }
}

function median(values) {
  const sorted = values.filter(Number.isFinite).sort((a, b) => a - b);
  if (sorted.length === 0) return null;
  const middle = sorted.length >> 1;
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

/* Each target's medians over the runs that gave a figure. */
const medians = (runs) =>
  Object.fromEntries(
    TARGETS.map(({ name }) => {
      const own = runs.filter((run) => run.target === name && !run.error);
      return [name, { runs: own.length, performance: median(own.map((run) => run.performance)), cls: median(own.map((run) => run.cls)), lcp: median(own.map((run) => run.lcp)) }];
    }),
  );

await mkdir(RUNS_DIR, { recursive: true });
const chrome = chromeVersion();
const runs = [];

async function round(number) {
  for (const target of TARGETS) {
    const run = await measure(target, number);
    runs.push(run);
    console.log(`lighthouse round ${number} ${target.name}: ${run.error ? `error: ${run.error}` : `performance ${run.performance}, CLS ${cls(run.cls)}, LCP ${seconds(run.lcp)}`} (${run.seconds} s)`);
  }
}

for (let number = 1; number <= ROUNDS; number++) await round(number);
const taken = medians(runs);
const version = runs.find((run) => run.version)?.version ?? "unknown";

const pr = taken.pr;
const main = taken.main;
// A target with no good run has no median: the gates fail, and say which.
const without = TARGETS.filter(({ name }) => taken[name].runs === 0).map(({ name }) => (name === "pr" ? "the branch" : name));
const noRun = without.length > 0 ? `no good run on ${without.join(" and ")}` : null;
const gates = [
  {
    name: `Lighthouse: the branch's median performance is no lower than main's minus ${MARGIN}`,
    pass: pr.performance !== null && main.performance !== null && pr.performance >= main.performance - MARGIN,
    detail: noRun ?? `branch ${pr.performance} over ${pr.runs} runs, main ${main.performance} over ${main.runs} runs`,
  },
  {
    name: "Lighthouse: the branch's median CLS is no higher than main's",
    pass: pr.cls !== null && main.cls !== null && pr.cls <= main.cls,
    detail: noRun ?? `branch ${cls(pr.cls)}, main ${cls(main.cls)}`,
  },
];

const cell = (text) => String(text ?? "").replace(/\|/g, "\\|");
const short = TARGETS.filter(({ name }) => taken[name].runs < ROUNDS).map(({ name }) => `- ${name}: ${taken[name].runs} of ${ROUNDS} runs gave a figure; the gates are read on those.`);
const lines = [
  "",
  "## Lighthouse (mobile, simulated throttling)",
  "",
  `Lighthouse ${version}, ${chrome}. Rule, fixed before any run: ${ROUNDS} interleaved rounds (main, then the branch), median = the middle of the sorted values (the mean of the middle two when the count is even); gates: the branch's performance median no lower than main's minus ${MARGIN}, the branch's CLS median no higher than main's; a target with fewer than ${ROUNDS} good runs is reported and the gates are read on the runs taken, and a target with none fails them. Analytics paths blocked on every run: ${BLOCKED.join(", ")}.`,
  "",
  "| target | round | performance | CLS | LCP | seconds | note |",
  "|---|---|---|---|---|---|---|",
  ...runs.map((run) => `| ${run.target} | ${run.round} | ${run.error ? "error" : run.performance} | ${cls(run.cls)} | ${seconds(run.lcp)} | ${run.seconds} | ${cell(run.error ?? (run.warnings.length > 0 ? oneLine(run.warnings.join(" / "), 160) : ""))} |`),
  "",
  "Medians over the runs taken:",
  "",
  "| target | runs | performance | CLS | LCP |",
  "|---|---|---|---|---|",
  ...TARGETS.map(({ name }) => `| ${name} | ${taken[name].runs} | ${taken[name].performance ?? "n/a"} | ${cls(taken[name].cls)} | ${seconds(taken[name].lcp)} |`),
  "",
  ...(short.length > 0 ? [...short, ""] : []),
  ...gates.map((gate) => `- ${gate.pass ? "PASS" : "FAIL"}: ${gate.name} (${gate.detail})`),
  "",
];

let report = {};
try {
  report = JSON.parse(await readFile(join(OUT, "report.json"), "utf8"));
} catch {
  // the audit step did not leave a report: this one starts it
}
report.lighthouse = { version, chrome, runs, medians: taken, gates };
report.gates = [...(report.gates ?? []), ...gates];
await writeFile(join(OUT, "report.json"), JSON.stringify(report, null, 2));
await appendFile(join(OUT, "report.md"), lines.join("\n"));
if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, lines.join("\n"));
console.log(lines.join("\n"));
process.exitCode = gates.every((gate) => gate.pass) ? 0 : 1;
