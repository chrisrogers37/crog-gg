/**
 * `npm run site:init`, at the repo root (#192): makes `site/` a fresh copy of
 * `site.example/`, the fictional site, so a fork starts from no one's content.
 *
 * - It refuses while `site/` holds anything git hasn't committed (untracked
 *   and ignored files too), unless `--force` is passed, and always when
 *   `site/` is a repo of its own.
 * - It copies `site.example/` into a new folder first and swaps it in only
 *   once the copy is whole, leaving out the fixture's own LICENSE and
 *   README.md. It keeps `site.example/`, which the unit tests read.
 * - It points the footer's "view source" link at this repo, from git's
 *   `origin`.
 *
 * Plain Node runs it, with the types stripped (Node 22.6+), so it imports
 * nothing but Node and uses only syntax that strips away.
 */
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/** site.example/'s own files, which a fork's site/ doesn't want. */
export const FIXTURE_ONLY = ["LICENSE", "README.md"];

/**
 * A git remote as the https URL of the repo it names, for a public link:
 * SSH forms become https, and a user, a password or a port is dropped, as is
 * ".git". Anything else gives "".
 */
export function repoUrl(remote: string): string {
  const match =
    /^(?:(?:https|ssh):\/\/(?:[^@/]+@)?([\w.-]+)(?::\d+)?\/|git@([\w.-]+):)([\w./-]+?)(?:\.git)?\/?$/.exec(
      remote,
    );
  return match ? `https://${match[1] ?? match[2]}/${match[3]}` : "";
}

/** site.yaml's text, with footer.source_repo_url set to `url`. */
export function withSourceRepo(text: string, url: string): string {
  const line = /^(\s+source_repo_url:).*$/m;
  if (!line.test(text)) {
    throw new Error("site.yaml has no footer.source_repo_url line to set");
  }
  return text.replace(line, `$1 ${JSON.stringify(url)}`);
}

/**
 * The environment without git's own variables. A git hook exports GIT_DIR
 * (a linked worktree's, say), and a git command here would follow it to
 * another repo than `root`.
 */
const withoutGitEnv = (): NodeJS.ProcessEnv =>
  Object.fromEntries(Object.entries(process.env).filter(([key]) => !key.startsWith("GIT_")));

/** Replaces `root`/site with `root`/site.example; see the top of the file. */
export function siteInit({
  root,
  force,
  log = console.log,
}: {
  root: string;
  force: boolean;
  log?: (line: string) => void;
}): void {
  const git = (...args: string[]) =>
    execFileSync("git", args, {
      cwd: root,
      encoding: "utf8",
      env: withoutGitEnv(),
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();

  const site = path.join(root, "site");
  const example = path.join(root, "site.example");
  if (!fs.existsSync(path.join(example, "site.yaml"))) {
    throw new Error("site.example/site.yaml is missing, so there's nothing to start from.");
  }
  if (fs.existsSync(path.join(site, ".git"))) {
    throw new Error("site/ is a git repo of its own; move it out of the way first.");
  }

  let uncommitted: string;
  try {
    uncommitted = git("status", "--porcelain", "--untracked-files=all", "--ignored", "--", "site");
  } catch {
    throw new Error("This isn't a git checkout (a ZIP download, say): clone the repo, or run with -- --force.");
  }
  if (!force && uncommitted !== "") {
    throw new Error(
      "site/ has files git hasn't committed. Commit or stash them, or run `npm run site:init -- --force` to discard them.",
    );
  }

  // Whole before it replaces anything: a copy that fails leaves site/ as it was.
  const next = path.join(root, `.site-init-${process.pid}`);
  fs.rmSync(next, { recursive: true, force: true });
  try {
    fs.cpSync(example, next, {
      recursive: true,
      verbatimSymlinks: true,
      filter: (source) => !FIXTURE_ONLY.includes(path.relative(example, source)),
    });
    let remote = "";
    try {
      remote = git("remote", "get-url", "origin");
    } catch {
      // No origin yet: the footer just has no source link.
    }
    const url = repoUrl(remote);
    const siteYaml = path.join(next, "site.yaml");
    fs.writeFileSync(siteYaml, withSourceRepo(fs.readFileSync(siteYaml, "utf8"), url));
    fs.rmSync(site, { recursive: true, force: true });
    fs.renameSync(next, site);

    log("site/ is now a copy of site.example/, a fictional site.");
    log(
      url
        ? `The footer's "view source" links to ${url}.`
        : `git's origin names no repo URL, so the footer has no "view source" link: set footer.source_repo_url in site/site.yaml.`,
    );
  } finally {
    fs.rmSync(next, { recursive: true, force: true });
  }
  log("Next, as FORKING.md describes:");
  log("  1. Make it yours: site/site.yaml (who the site is) and site/public/ (the content and images).");
  log("     documentation/CONTENT.md describes every field.");
  log("  2. Check it, then see it: cd frontend && npm run site:check && npm run dev");
  log("  3. Deploy it.");
}

// Run as a script, not when the tests import it. Through real paths: a
// symlinked checkout would otherwise do nothing, quietly.
if (process.argv[1] && fs.realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
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
