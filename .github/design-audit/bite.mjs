// Checks that the branch's phone spec bites. The spec was run against main's checkout (playwright's JSON report is
// <OUT>/bite.json); this reads it and holds each test to one rule, whatever the branch. A test is identified by its
// outermost test.describe title and its title, across projects. The tests main's own phone spec has are listed in
// <OUT>/bite-main-list.json, written before the branch's spec was copied over; the file is absent when main has no
// phone spec, and then every test is new. A test the branch adds tests what it changes, so it must fail on main: one
// that passed there checks nothing about the change, and that, or a run that failed to report, is what fails the step.
// A test the branch adds that cannot fail on main for a known reason is listed in KNOWN_INERT with the reason: it is
// marked in the table, and does not fail the step. A run of no tests checks nothing, and fails the step too.
// A test main already has is expected to pass there; one that fails is noted, and does not fail the step. The table
// (test, expected, observed, the assertion message) goes into <OUT>/report.md and <OUT>/report.json, and into the
// step summary, whichever way the gate goes.
import { appendFileSync } from "node:fs";
import { appendFile, readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(process.env.OUT || join(HERE, "out"));

const strip = (text) => String(text ?? "").replace(/\u001b\[[0-9;]*m/g, "");
const oneLine = (text, length) => strip(text).split("\n").slice(0, 4).join(" ").replace(/\s+/g, " ").trim().slice(0, length);
const cell = (text) => String(text ?? "").replace(/\|/g, "\\|");
const identity = (group, title) => JSON.stringify([group, title]);

/* Tests a branch adds that can't fail on main, with the reason. In Chromium's touch emulation a press also sets :hover, so a
   control that main styles on an ungated hover rule shows a change on a press there too, and its pressed test proves the branch's
   pressed state, not main's lack of one. */
const KNOWN_INERT = [
  {
    group: "pressed",
    title: /^(the menu's theme button|a footer link|a menu link|the menu's close button|a project row) /,
    reason: "main's hover rule on this control fires on a press in Chromium's touch emulation",
  },
];

async function readJson(name) {
  const text = await readFile(join(OUT, name), "utf8");
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

/* The tests main's own phone spec has: none when main has no phone spec, which leaves no list. */
async function mainTests() {
  let json;
  try {
    json = await readJson("bite-main-list.json");
  } catch (error) {
    if (error?.code === "ENOENT") return new Set();
    throw error;
  }
  const tests = [];
  for (const file of json.suites ?? []) collect(file, [], tests);
  return new Set(tests.map(({ group, title }) => identity(group, title)));
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
let inMain = new Set();
try {
  inMain = await mainTests();
} catch (error) {
  problems.push(`main's test list could not be read: ${oneLine(error, 200)}`);
}
try {
  const json = await readJson("bite.json");
  runErrors = (json.errors ?? []).map((error) => oneLine(error.message ?? error, 300));
  const tests = [];
  for (const file of json.suites ?? []) collect(file, [], tests);
  for (const { group, title, project, test } of tests) {
    const isNew = !inMain.has(identity(group, title));
    const observed = observe(test);
    let verdict;
    if (isNew) {
      const inert = KNOWN_INERT.find((known) => known.group === group && known.title.test(title));
      if (observed === "passed" && inert) {
        verdict = `passed on main, known: ${inert.reason}`;
      } else {
        verdict = observed === "passed" ? "PASSED ON MAIN, MUST FAIL" : observed === "failed" ? "ok" : "skipped, not checked";
        if (observed === "passed") problems.push(`${group} > ${title} (${project}) passed on main`);
      }
    } else {
      verdict = observed === "passed" ? "ok" : observed === "failed" ? "failed, expected to pass (noted)" : "skipped";
    }
    rows.push({ group, title, project, expected: isNew ? "fail" : "pass", observed, verdict, message: observed === "failed" ? message(test) : "" });
  }
  if (tests.length === 0) problems.push("the spec ran no tests");
} catch (error) {
  problems.push(`the spec's report could not be read: ${oneLine(error, 200)}`);
}
if (runErrors.length > 0) problems.push(`the run reported errors: ${runErrors.join(" / ")}`);

const pass = problems.length === 0;
const counts = Object.fromEntries(["passed", "failed", "skipped"].map((state) => [state, rows.filter((row) => row.observed === state).length]));
const newRows = rows.filter((row) => row.expected === "fail");
const bitten = newRows.filter((row) => row.observed === "failed").length;
const lines = [
  "",
  "## Prove the spec bites (the phone spec run against main)",
  "",
  `${rows.length} tests across ${new Set(rows.map((row) => row.project)).size} projects: ${counts.passed} passed, ${counts.failed} failed, ${counts.skipped} skipped.`,
  "Expectation: a test the branch adds must fail on main; a test main already has is expected to pass there.",
  `Gate (a test the branch adds passed on main, or the run failed to report): ${pass ? "PASS" : "FAIL"}.`,
  ...problems.map((problem) => `- ${problem}`),
  "",
  "| group | test | project | expected on main | observed | verdict | assertion message |",
  "|---|---|---|---|---|---|---|",
  ...rows.map((row) => `| ${cell(row.group)} | ${cell(row.title)} | ${cell(row.project)} | ${row.expected} | ${row.observed} | ${row.verdict} | ${cell(row.message)} |`),
  "",
];

report.bite = { counts, rows, problems, pass };
report.gates = [...(report.gates ?? []), { name: "the spec fails on main where it must", pass, detail: pass ? `${bitten} of ${newRows.length} tests the branch adds failed on main` : problems.join("; ") }];
await writeFile(join(OUT, "report.json"), JSON.stringify(report, null, 2));
await appendFile(join(OUT, "report.md"), lines.join("\n"));
if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, lines.join("\n"));
console.log(lines.join("\n"));
process.exitCode = pass ? 0 : 1;
