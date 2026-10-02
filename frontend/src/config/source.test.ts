import { describe, expect, it } from "vitest";
import { sourceUrl } from "./source";

describe("sourceUrl", () => {
  it("pins the repo to the commit the build is from", () => {
    expect(sourceUrl("https://github.com/you/site", "abc123")).toBe(
      "https://github.com/you/site/tree/abc123",
    );
    expect(sourceUrl("https://github.com/you/site/", "abc123")).toBe(
      "https://github.com/you/site/tree/abc123",
    );
  });

  it("leaves a URL it can't pin as it is: another host, or a path inside a repo", () => {
    expect(sourceUrl("https://gitlab.com/you/site", "abc123")).toBe(
      "https://gitlab.com/you/site",
    );
    expect(sourceUrl("https://github.com/you/mono/tree/main/site", "abc123")).toBe(
      "https://github.com/you/mono/tree/main/site",
    );
  });

  it("links the repo itself when the build doesn't know its commit", () => {
    expect(sourceUrl("https://github.com/you/site", "")).toBe(
      "https://github.com/you/site",
    );
  });
});
