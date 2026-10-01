import { describe, it, expect } from "vitest";
import { isLocalDevUrl, readmeHref, readmeImageSrc } from "./readmeLinks";

// What githubService.getReadme returns for Storydump's root README.
const ROOT_README = {
  text: "",
  htmlUrl: "https://github.com/chrisrogers37/storydump/blob/main/README.md",
  downloadUrl:
    "https://raw.githubusercontent.com/chrisrogers37/storydump/main/README.md",
};
const BLOB = "https://github.com/chrisrogers37/storydump/blob/main";
const RAW = "https://raw.githubusercontent.com/chrisrogers37/storydump/main";

describe("readmeHref", () => {
  // The first four are links the Storydump and Shitpost Alpha READMEs carry
  // today, each of which used to land on the crog.gg 404 page.
  it.each([
    ["AGENTS.md", `${BLOB}/AGENTS.md`],
    ["documentation/guides/quickstart.md", `${BLOB}/documentation/guides/quickstart.md`],
    ["LICENSE", `${BLOB}/LICENSE`],
    [".claude/", `${BLOB}/.claude/`],
    ["./docs/setup.md", `${BLOB}/docs/setup.md`],
    ["docs/../CHANGELOG.md", `${BLOB}/CHANGELOG.md`],
    ["/root.md", `${BLOB}/root.md`],
    ["AGENTS.md#setup", `${BLOB}/AGENTS.md#setup`],
  ])("sends %s to the file on GitHub", (href, expected) => {
    expect(readmeHref(href, ROOT_README)).toBe(expected);
  });

  it("resolves against the README's own folder, not the repo root", () => {
    const nested = {
      ...ROOT_README,
      htmlUrl: `${BLOB}/docs/README.md`,
    };
    expect(readmeHref("setup.md", nested)).toBe(`${BLOB}/docs/setup.md`);
    expect(readmeHref("/LICENSE", nested)).toBe(`${BLOB}/LICENSE`);
  });

  it.each([
    "https://storydump.app",
    "http://example.com/a",
    "mailto:someone@example.com",
    "//cdn.example.com/x",
    "#quick-start",
    undefined,
  ])("leaves %s as written", (href) => {
    expect(readmeHref(href, ROOT_README)).toBe(href);
  });
});

describe("readmeImageSrc", () => {
  it("loads a relative image from the raw file host", () => {
    expect(readmeImageSrc("docs/screenshot.png", ROOT_README)).toBe(
      `${RAW}/docs/screenshot.png`,
    );
    expect(readmeImageSrc("./img/a.png", ROOT_README)).toBe(`${RAW}/img/a.png`);
    expect(readmeImageSrc("/img/a.png", ROOT_README)).toBe(`${RAW}/img/a.png`);
  });

  it("leaves an absolute image URL alone", () => {
    const src = "https://raw.githubusercontent.com/x/y/main/a.png";
    expect(readmeImageSrc(src, ROOT_README)).toBe(src);
  });
});

describe("isLocalDevUrl", () => {
  it.each([
    "http://localhost:3000",
    "http://localhost",
    "https://app.localhost:8443/x",
    "http://127.0.0.1:8000/docs",
    "http://0.0.0.0:5173",
    "http://[::1]:3000",
  ])("flags %s", (href) => {
    expect(isLocalDevUrl(href)).toBe(true);
  });

  it.each([
    "https://storydump.app",
    "https://localhost.example.com",
    "AGENTS.md",
    "#anchor",
    undefined,
  ])("does not flag %s", (href) => {
    expect(isLocalDevUrl(href)).toBe(false);
  });
});
