import { execFileSync, spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { readSiteYaml } from "../../scripts/site-config";
import { repoUrl, siteInit, withSourceRepo } from "../../scripts/site-init";
import { parseSiteConfig } from "./schema";

/** `npm run site:init` (#192): a fork's site/ becomes site.example/. */

const EXAMPLE = path.resolve(__dirname, "../../../site.example");
const SCRIPT = path.resolve(__dirname, "../../scripts/site-init.ts");

// A git hook exports GIT_DIR (a linked worktree's, say). Left set, the
// throwaway repo's commands would act on this one.
const gitEnv = Object.entries(process.env).filter(([key]) => key.startsWith("GIT_"));
beforeAll(() => gitEnv.forEach(([key]) => delete process.env[key]));
afterAll(() => gitEnv.forEach(([key, value]) => (process.env[key] = value)));

describe("repoUrl", () => {
  it.each([
    ["git@github.com:someone/my-site.git", "https://github.com/someone/my-site"],
    ["ssh://git@github.com/someone/my-site.git", "https://github.com/someone/my-site"],
    ["https://github.com/someone/my-site.git", "https://github.com/someone/my-site"],
    ["https://github.com/someone/my-site/", "https://github.com/someone/my-site"],
    ["git@gitlab.com:group/sub/my-site.git", "https://gitlab.com/group/sub/my-site"],
    // A public link never carries a credential or a port.
    ["https://user:token@github.com/someone/my-site.git", "https://github.com/someone/my-site"],
    ["ssh://git@host.example:2222/team/my-site.git", "https://host.example/team/my-site"],
    ["", ""],
    ["file:///tmp/my-site", ""],
    [" git@github.com:someone/my-site.git", ""],
  ])("%j gives %j", (remote, url) => {
    expect(repoUrl(remote)).toBe(url);
  });
});

describe("withSourceRepo", () => {
  it("sets footer.source_repo_url, quoted", () => {
    expect(withSourceRepo('footer:\n  source_repo_url: ""\n', "https://a.example/b")).toBe(
      'footer:\n  source_repo_url: "https://a.example/b"\n',
    );
  });

  it("says so when there's no line to set", () => {
    expect(() => withSourceRepo("footer: {}\n", "x")).toThrow(/no footer\.source_repo_url/);
  });
});

describe("siteInit, in a repo of its own", () => {
  let root: string;
  const git = (...args: string[]) =>
    execFileSync(
      "git",
      ["-c", "user.name=t", "-c", "user.email=t@example.com", "-c", "commit.gpgsign=false", ...args],
      { cwd: root, stdio: "ignore" },
    );
  const run = (force = false) => siteInit({ root, force, log: () => {} });
  const files = (dir: string) =>
    (fs.readdirSync(dir, { recursive: true, encoding: "utf8" }) as string[]).sort();
  const inSite = (...parts: string[]) => path.join(root, "site", ...parts);

  beforeEach(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), "site-init-"));
    fs.cpSync(EXAMPLE, path.join(root, "site.example"), { recursive: true });
    // A README deeper down is the site's own, and is copied.
    fs.writeFileSync(path.join(root, "site.example", "public", "README.md"), "kept\n");
    fs.mkdirSync(inSite());
    fs.writeFileSync(inSite("owner.txt"), "the owner's content\n");
    fs.writeFileSync(path.join(root, ".gitignore"), "*.log\n");
    git("init", "-q");
    git("add", ".");
    git("commit", "-q", "-m", "a fork");
    git("remote", "add", "origin", "git@github.com:someone/my-site.git");
  });
  afterEach(() => fs.rmSync(root, { recursive: true, force: true }));

  it("makes site/ the example, without its LICENSE and README, and keeps the example", () => {
    run();
    expect(fs.existsSync(inSite("owner.txt"))).toBe(false);
    expect(fs.existsSync(inSite("LICENSE"))).toBe(false);
    expect(fs.existsSync(inSite("README.md"))).toBe(false);
    expect(fs.readFileSync(inSite("public", "README.md"), "utf8")).toBe("kept\n");
    expect(files(inSite())).toEqual(
      files(path.join(root, "site.example")).filter((file) => !["LICENSE", "README.md"].includes(file)),
    );
    expect(fs.existsSync(path.join(root, "site.example", "LICENSE"))).toBe(true);
  });

  it("links the footer to the repo, and the result is a valid site with no one's name in it", () => {
    run();
    expect(parseSiteConfig(readSiteYaml(inSite())).footer.source_repo_url).toBe(
      "https://github.com/someone/my-site",
    );
    for (const file of files(inSite())) {
      if (fs.statSync(inSite(file)).isFile() && /\.(ya?ml|json|html|md)$/.test(file)) {
        expect(fs.readFileSync(inSite(file), "utf8"), file).not.toMatch(/chris|crog/i);
      }
    }
  });

  it.each([
    ["an untracked file", () => fs.writeFileSync(inSite("draft.txt"), "unsaved\n")],
    ["an edited file", () => fs.appendFileSync(inSite("owner.txt"), "more\n")],
    ["an ignored file", () => fs.writeFileSync(inSite("notes.log"), "kept out of git\n")],
  ])("refuses with %s in site/, unless forced", (_, dirty) => {
    dirty();
    expect(() => run()).toThrow(/hasn't committed[\s\S]*-- --force/);
    expect(fs.existsSync(inSite("owner.txt"))).toBe(true);

    run(true);
    expect(fs.existsSync(inSite("owner.txt"))).toBe(false);
    expect(fs.existsSync(inSite("site.yaml"))).toBe(true);
  });

  it("doesn't mind changes outside site/", () => {
    fs.writeFileSync(path.join(root, "notes.txt"), "elsewhere\n");
    run();
    expect(fs.existsSync(inSite("site.yaml"))).toBe(true);
  });

  it("never replaces a site/ that's a repo of its own, even forced", () => {
    fs.mkdirSync(inSite(".git"));
    expect(() => run(true)).toThrow(/a git repo of its own/);
    expect(fs.existsSync(inSite("owner.txt"))).toBe(true);
  });

  it("leaves site/ alone when there's no example to copy", () => {
    fs.rmSync(path.join(root, "site.example"), { recursive: true });
    expect(() => run(true)).toThrow(/site\.example\/site\.yaml is missing/);
    expect(fs.existsSync(inSite("owner.txt"))).toBe(true);
  });

  it("runs from the command line as `npm run site:init` runs it", () => {
    fs.mkdirSync(path.join(root, "frontend", "scripts"), { recursive: true });
    fs.copyFileSync(SCRIPT, path.join(root, "frontend", "scripts", "site-init.ts"));
    fs.writeFileSync(path.join(root, "frontend", "package.json"), '{"type":"module"}\n');
    const cli = (...args: string[]) =>
      spawnSync(
        process.execPath,
        ["--experimental-strip-types", "--disable-warning=ExperimentalWarning", "frontend/scripts/site-init.ts", ...args],
        { cwd: root, encoding: "utf8" },
      );

    fs.writeFileSync(inSite("draft.txt"), "unsaved\n");
    const refused = cli();
    expect(refused.status).toBe(1);
    expect(refused.stderr).toMatch(/hasn't committed/);

    const forced = cli("--force");
    expect(forced.status, forced.stderr).toBe(0);
    expect(forced.stdout).toMatch(/site\/ is now a copy of site\.example\//);
    expect(fs.existsSync(inSite("draft.txt"))).toBe(false);
  });
});
