// Compares pairs of full-page shots pixel by pixel (pixelmatch, threshold 0.1) and writes a diff image for each pair.
// Reads <OUT>/compare-src/pairs.json, a list of { page, theme, main, pr } with the shots' file names relative to <OUT>.
// Writes <OUT>/compare-<page>-<theme>.diff.png and <OUT>/compare.json (one result per pair), and exits 1 unless every
// pair has 0 differing pixels: the gate is exact, because the shots are of pages held still (see audit.mjs).
import { readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import pixelmatch from "pixelmatch";
import pngjs from "pngjs";

const { PNG } = pngjs;
const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(process.env.OUT || join(HERE, "out"));

const pairs = JSON.parse(await readFile(join(OUT, "compare-src", "pairs.json"), "utf8"));
const results = [];

for (const pair of pairs) {
  const result = { page: pair.page, theme: pair.theme, main: pair.main, pr: pair.pr, diff: `compare-${pair.page}-${pair.theme}.diff.png` };
  try {
    const main = PNG.sync.read(await readFile(join(OUT, pair.main)));
    const pr = PNG.sync.read(await readFile(join(OUT, pair.pr)));
    result.size = { main: `${main.width}x${main.height}`, pr: `${pr.width}x${pr.height}` };
    if (main.width !== pr.width || main.height !== pr.height) {
      // Shots of different sizes cannot be compared pixel for pixel: the pages differ in height or width.
      result.differing = null;
      result.pass = false;
      result.note = `sizes differ: main ${result.size.main}, PR ${result.size.pr}; no diff image`;
    } else {
      const diff = new PNG({ width: main.width, height: main.height });
      result.differing = pixelmatch(main.data, pr.data, diff.data, main.width, main.height, { threshold: 0.1 });
      result.pass = result.differing === 0;
      await writeFile(join(OUT, result.diff), PNG.sync.write(diff));
    }
  } catch (error) {
    result.differing = null;
    result.pass = false;
    result.note = String(error).slice(0, 300);
  }
  results.push(result);
  console.log(`compare ${pair.page} ${pair.theme}: ${result.differing ?? "not compared"} differing pixels${result.note ? ` (${result.note})` : ""}`);
}

await writeFile(join(OUT, "compare.json"), JSON.stringify(results, null, 2));
process.exitCode = results.length > 0 && results.every((result) => result.pass) ? 0 : 1;
