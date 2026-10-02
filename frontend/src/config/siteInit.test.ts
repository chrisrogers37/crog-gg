import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { readSiteYaml } from "../../scripts/site-config";
import { FIXTURE_ONLY, repoUrl, siteInit, withSourceRepo } from "../../scripts/site-init";
import { parseSiteConfig } from "./schema";

/** `npm run site:init` (#192): a fork's site/ becomes site.example/. */

const EXAMPLE = path.resolve(__dirname, "../../../site.example");

describe("repoUrl", () => {
  it.each([
    ["git@github.com:someone/my-site.git", "https://github.com/someone/my-site"],
    ["ssh://git@github.com/someone/my-site.git", "https://github.com/someone/my-site"],
    ["https://github.com/someone/my-site.git", "https://github.com/someone/my-site"],
    ["https://github.com/someone/my-site", "https://github.com/someone/my-site"],
    ["git@gitlab.com:group/sub/my-site.git", "https://gitlab.com/group/sub/my-site"],
    ["", ""],
    ["file:///tmp/my-site", ""],
  ])("%s gives %s", (remote, url) => {
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
    execFileSync("git", ["-c", "user.name=t", "-c", "user.email=t@example.com", ...args], {
      cwd: root,
      stdio: "ignore",
    });
  const run = (force = false) => siteInit({ root, force, log: () => {} });
  const files = (dir: string) =>
    (fs.readdirSync(dir, { recursive: true, encoding: "utf8" }) as string[]).sort();

  beforeEach(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), "site-init-"));
    fs.cpSync(EXAMPLE, path.join(root, "site.example"), { recursive: true });
    fs.mkdirSync(path.join(root, "site"));
    fs.writeFileSync(path.join(root, "site", "owner.txt"), "the owner's content\n");
    git("init", "-q");
    git("add", ".");
    git("commit", "-q", "-m", "a fork");
    git("remote", "add", "origin", "git@github.com:someone/my-site.git");
  });
  afterEach(() => fs.rmSync(root, { recursive: true, force: true }));

  it("makes site/ the example, without its LICENSE and README, and keeps the example", () => {
    run();
    const site = path.join(root, "site");
    expect(files(site)).toEqual(
      files(EXAMPLE).filter((file) => !FIXTURE_ONLY.includes(file)),
    );
    expect(fs.existsSync(path.join(site, "owner.txt"))).toBe(false);
    expect(files(path.join(root, "site.example"))).toEqual(files(EXAMPLE));
  });

  it("links the footer to the repo, and the result is a valid site with no one's name in it", () => {
    run();
    const site = path.join(root, "site");
    const config = parseSiteConfig(readSiteYaml(site));
    expect(config.footer.source_repo_url).toBe("https://github.com/someone/my-site");
    for (const file of files(site)) {
      const full = path.join(site, file);
      if (fs.statSync(full).isFile() && /\.(ya?ml|json|html|md)$/.test(file)) {
        expect(fs.readFileSync(full, "utf8"), file).not.toMatch(/chris|crog/i);
      }
    }
  });

  it("refuses while site/ has changes git hasn't committed, unless forced", () => {
    fs.writeFileSync(path.join(root, "site", "draft.txt"), "unsaved\n");
    expect(() => run()).toThrow(/hasn't committed/);
    expect(fs.existsSync(path.join(root, "site", "owner.txt"))).toBe(true);

    run(true);
    expect(fs.existsSync(path.join(root, "site", "draft.txt"))).toBe(false);
    expect(fs.existsSync(path.join(root, "site", "site.yaml"))).toBe(true);
  });
});
