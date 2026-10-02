import { describe, expect, it } from "vitest";
import { DEFAULT_SKILL_COLOR, skillColor } from "./skillColor";

describe("skillColor", () => {
  it("keeps #rrggbb as given", () => {
    expect(skillColor("#3178C6")).toBe("#3178C6");
  });

  it("expands #rgb, so an alpha pair can be appended", () => {
    expect(skillColor("#abc")).toBe("#aabbcc");
  });

  it("falls back to the default for anything else", () => {
    for (const raw of [undefined, "", "teal", "#abcd", "3178C6", "#3178C6ff"]) {
      expect(skillColor(raw), String(raw)).toBe(DEFAULT_SKILL_COLOR);
    }
  });
});
