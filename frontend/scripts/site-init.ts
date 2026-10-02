/**
 * `npm run site:init`, at the repo root (#192): makes `site/` a fresh copy of
 * `site.example/`, the fictional site, so a fork starts from no one's content.
 *
 * - It refuses while `site/` has changes git hasn't committed, unless
 *   `--force` is passed.
 * - It copies `site.example/` over `site/`, leaving out the fixture's own
 *   LICENSE and README.md, and keeps `site.example/`, which the unit tests
 *   read.
 * - It points the footer's "view source" link at this repo, from git's
 *   `origin`.
 *
 * Plain Node runs it (node strips the types), so it imports nothing but Node.
 */
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/** site.example/'s own files, which a fork's site/ doesn't want. */
export const FIXTURE_ONLY = ["LICENSE", "README.md"];

/**
 * A git remote as the https URL of the repo it names: SSH forms are turned
 * into https, and ".git" is dropped. Anything else gives "".
 */
export function repoUrl(remote: string): string {
  const match =
    /^(?:https:\/\/|ssh:\/\/git@|git@)([\w.-]+)[/:]([\w./-]+?)(?:\.git)?\/?$/.exec(remote.trim());
  return match ? `https://${match[1]}/${match[2]}` : "";
}

/** site.yaml's text, with footer.source_repo_url set to `url`. */
export function withSourceRepo(text: string, url: string): string {
  const line = /^(\s+source_repo_url:).*$/m;
  if (!line.test(text)) {
    throw new Error("site.yaml has no footer.source_repo_url line to set");
  }
  return text.replace(line, `$1 ${JSON.stringify(url)}`);
}

/** Replaces `root`/site with `root`/site.example; see the top of the file. */
export function siteInit({
  root,
  force = false,
  log = console.log,
}: {
  root: string;
  force?: boolean;
  log?: (line: string) => void;
}): void {
  const git = (...args: string[]) =>
    execFileSync("git", args, { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();

  if (!force && git("status", "--porcelain", "--", "site") !== "") {
    throw new Error(
      "site/ has changes git hasn't committed. Commit or stash them, or run with --force to discard them.",
    );
  }

  const site = path.join(root, "site");
  const example = path.join(root, "site.example");
  fs.rmSync(site, { recursive: true, force: true });
  fs.cpSync(example, site, {
    recursive: true,
    filter: (source) => !FIXTURE_ONLY.includes(path.relative(example, source)),
  });

  let remote = "";
  try {
    remote = git("remote", "get-url", "origin");
  } catch {
    // No origin yet: the footer just has no source link.
  }
  const url = repoUrl(remote);
  const siteYaml = path.join(site, "site.yaml");
  fs.writeFileSync(siteYaml, withSourceRepo(fs.readFileSync(siteYaml, "utf8"), url));

  log("site/ is now a copy of site.example/, a fictional site.");
  log(
    url
      ? `The footer's "view source" links to ${url}.`
      : `No repo URL in git's origin, so the footer has no "view source" link: set footer.source_repo_url in site/site.yaml.`,
  );
  log("Next:");
  log("  1. Make it yours: site/site.yaml (who the site is) and site/public/ (the content and images).");
  log("     documentation/CONTENT.md describes every field.");
  log("  2. Check it, then see it: cd frontend && npm run site:check && npm run dev");
  log("  3. Deploy it: FORKING.md");
}

// Run as a script, not when the tests import it.
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    siteInit({
      root: path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../.."),
      force: process.argv.includes("--force"),
    });
  } catch (error) {
    console.error((error as Error).message);
    process.exit(1);
  }
}
