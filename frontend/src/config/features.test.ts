import { describe, expect, it } from "vitest";
import { NO_FEATURES, isOn, parseFeatures } from "./features";

describe("parseFeatures", () => {
  it("reads the API's answer", () => {
    expect(parseFeatures({ regenerate: true, github: false })).toEqual({
      regenerate: true,
      github: false,
    });
  });

  it.each([
    ["null", null],
    ["a string (an HTML page read as text)", "<!doctype html>"],
    ["an array", []],
    ["a flag that isn't a boolean", { regenerate: "true", github: true }],
    ["a flag left out", { regenerate: true }],
  ])("serves nothing for %s", (_, body) => {
    expect(parseFeatures(body)).toEqual(NO_FEATURES);
  });
});

describe("isOn", () => {
  it.each([
    ["on", false, true],
    ["on", true, true],
    ["off", true, false],
    ["off", false, false],
    ["auto", true, true],
    ["auto", false, false],
    [undefined, true, true],
    [undefined, false, false],
  ] as const)("%s, served %s: %s", (mode, served, expected) => {
    expect(isOn(mode, served)).toBe(expected);
  });
});
