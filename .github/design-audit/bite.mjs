// Checks that the phone spec bites. The spec was run against main's checkout (playwright's JSON report is
// <OUT>/bite.json); this reads it and holds each test to the expectation written down before the run, by the spec's
// test.describe title. A test that must fail on main and passed there checks nothing about the change, and that is
// the one outcome that fails the step. The table (test, expected, observed, the assertion message) goes into
// <OUT>/report.md and <OUT>/report.json, and into the step summary, whichever way the gate goes.
import { appendFileSync } from "node:fs";
import { appendFile, readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(process.env.OUT || join(HERE, "out"));

/* By the spec's describe title: what main's code must do to the group's tests. */
const EXPECTED = {
  // Boxes under 44 px on main: hamburger 30 tall, menu links 43.2, theme toggle 36, footer links 21, demo controls 21
  // and 33, contact and music pills 34, breadcrumb links 21.
  sizes: "fail",
  // The timeline's text at 89 and the README's at 49, against the headings at 16.
  "left edges": "fail",
  // No :active rule exists on main.
  pressed: "fail",
  // Main's CSS reads no --safe-* name.
  insets: "fail",
  // A measurement of the engine and the label widths: the same on main.
  "env probe": "pass",
  labels: "pass",
};

const strip = (text) => String(text ?? "").replace(/\u001b\[[0-9;]*m/g, "");
const oneLine = (text, length) => strip(text).split("\n").slice(0, 4).join(" ").replace(/\s+/g, " ").trim().slice(0, length);
const cell = (text) => String(text ?? "").replace(/\|/g, "\\|");

async function readJson() {
  const text = await readFile(join(OUT, "bite.json"), "utf8");
  try {
    return JSON.parse(text);
  } catch {
    // Anything printed before or after the report on stdout is not part of it.
    return JSON.parse(text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1));
  }
}

/* Every test of every project, with the describe titles above it. */
function collect(suite, describes, tests) {
  for (const spec of suite.specs ?? []) {
    for (const test of spec.tests ?? []) tests.push({ group: describes[0] ?? "", title: spec.title, project: test.projectName, test });
  }
  for (const child of suite.suites ?? []) collect(child, [...describes, child.title], tests);
}

/* What happened to a test, by its last attempt. */
function observe(test) {
  const results = test.results ?? [];
  const last = results[results.length - 1];
  if (test.status === "skipped" || !last || last.status === "skipped") return "skipped";
  return last.status === "passed" ? "passed" : "failed";
}

function message(test) {
  const results = test.results ?? [];
  const failing = [...results].reverse().find((result) => result.status !== "passed" && result.status !== "skipped");
  if (!failing) return "";
  return oneLine(failing.error?.message ?? failing.errors?.[0]?.message ?? failing.status, 260);
}

let report = {};
try {
  report = JSON.parse(await readFile(join(OUT, "report.json"), "utf8"));
} catch {
  // the audit step did not leave a report: this one starts it
}

const rows = [];
const problems = [];
let runErrors = [];
let readable = false;
try {
  const json = await readJson();
  runErrors = (json.errors ?? []).map((error) => oneLine(error.message ?? error, 300));
  const tests = [];
  for (const file of json.suites ?? []) collect(file, [], tests);
  for (const { group, title, project, test } of tests) {
    const expected = EXPECTED[group];
    const observed = observe(test);
    let verdict = "not held to an expectation";
    if (expected === "fail") {
      verdict = observed === "passed" ? "PASSED ON MAIN, MUST FAIL" : observed === "failed" ? "ok" : "skipped, not checked";
      if (observed === "passed") problems.push(`${group} > ${title} (${project}) passed on main`);
    } else if (expected === "pass") {
      verdict = observed === "passed" ? "ok" : observed === "failed" ? "failed, expected to pass (noted)" : "skipped";
    }
    rows.push({ group, title, project, expected: expected ?? "-", observed, verdict, message: observed === "failed" ? message(test) : "" });
  }
  readable = true;
} catch (error) {
  problems.push(`the spec's report could not be read: ${oneLine(error, 200)}`);
}

// A group that must fail has to have run, and failed at least once: a title that matches no test, or a group that
// was skipped throughout, checked nothing either.
if (readable) {
  for (const [group, expected] of Object.entries(EXPECTED)) {
    const inGroup = rows.filter((row) => row.group === group);
    if (inGroup.length === 0) problems.push(`no test in the group "${group}" (the spec's test.describe title may differ)`);
    else if (expected === "fail" && !inGroup.some((row) => row.observed === "failed")) problems.push(`no test in the group "${group}" failed or ran on main`);
  }
}
if (runErrors.length > 0) problems.push(`the run reported errors: ${runErrors.join(" / ")}`);

const pass = problems.length === 0;
const counts = Object.fromEntries(["passed", "failed", "skipped"].map((state) => [state, rows.filter((row) => row.observed === state).length]));
const lines = [
  "",
  "## Prove the spec bites (the phone spec run against main)",
  "",
  `${rows.length} tests across ${new Set(rows.map((row) => row.project)).size} projects: ${counts.passed} passed, ${counts.failed} failed, ${counts.skipped} skipped.`,
  `Expectation, by describe title: ${Object.entries(EXPECTED).map(([group, expected]) => `${group}: ${expected}`).join("; ")}.`,
  `Gate (a test that must fail on main passed there, or a group checked nothing): ${pass ? "PASS" : "FAIL"}.`,
  ...problems.map((problem) => `- ${problem}`),
  "",
  "| group | test | project | expected on main | observed | verdict | assertion message |",
  "|---|---|---|---|---|---|---|",
  ...rows.map((row) => `| ${cell(row.group)} | ${cell(row.title)} | ${cell(row.project)} | ${row.expected} | ${row.observed} | ${row.verdict} | ${cell(row.message)} |`),
  "",
];

report.bite = { expected: EXPECTED, counts, rows, problems, pass };
report.gates = [...(report.gates ?? []), { name: "the spec fails on main where it must", pass, detail: pass ? `${counts.failed} failed as expected` : problems.join("; ") }];
await writeFile(join(OUT, "report.json"), JSON.stringify(report, null, 2));
await appendFile(join(OUT, "report.md"), lines.join("\n"));
if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, lines.join("\n"));
console.log(lines.join("\n"));
process.exitCode = pass ? 0 : 1;
