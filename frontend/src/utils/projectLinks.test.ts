import { describe, expect, it } from "vitest";
import type { Project } from "../types/Project";
import { githubRepo, hasLiveDemo } from "./projectLinks";

const project = (fields: Partial<Project>): Project => ({
  id: "p",
  title: "P",
  description: "d",
  url: "https://example.com",
  icon: "\u{1F680}",
  category: "web-app",
  technologies: [],
  ...fields,
});

describe("githubRepo", () => {
  it.each([
    [
      "takes `github` over `url`",
      { github: "https://github.com/a/one", url: "https://github.com/b/two" },
      { owner: "a", name: "one" },
    ],
    [
      "falls back to a `url` that's a repo",
      { url: "https://github.com/b/two" },
      { owner: "b", name: "two" },
    ],
    [
      "keeps a dotted name",
      { github: "https://github.com/a/one.github.io" },
      { owner: "a", name: "one.github.io" },
    ],
    [
      "drops a trailing .git",
      { github: "https://github.com/a/one.git" },
      { owner: "a", name: "one" },
    ],
    [
      "stops at a path, query or fragment",
      { github: "https://github.com/a/one/tree/main?x=1#readme" },
      { owner: "a", name: "one" },
    ],
    ["is null for a `url` that isn't GitHub", {}, null],
    ["is null for a profile `url`", { url: "https://github.com/b" }, null],
  ])("%s", (_, fields, expected) => {
    expect(githubRepo(project(fields))).toEqual(expected);
  });
});

describe("hasLiveDemo", () => {
  it.each([
    ["no demo", {}, false],
    ["a demo that is the url", { demo: "https://example.com" }, false],
    ["the url with a trailing slash", { demo: "https://example.com/" }, false],
    ["a demo on github.com", { demo: "https://github.com/a/one" }, false],
    ["a demo that goes elsewhere", { demo: "https://demo.example.com" }, true],
  ])("%s: %s", (_, fields, expected) => {
    expect(hasLiveDemo(project(fields))).toBe(expected);
  });
});
