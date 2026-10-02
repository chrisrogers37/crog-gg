import { afterEach, describe, expect, it, vi } from "vitest";
import { loadTimeline } from "./timelineLoader";
import { DEFAULT_SKILL_COLOR } from "./skillColor";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("loadTimeline", () => {
  it("checks each skill category's colour once, as the YAML loads (#193)", async () => {
    const yaml = [
      "entries: []",
      "skill_categories:",
      "  six:",
      '    color: "#3178C6"',
      "    skills: [python]",
      "  three:",
      '    color: "#abc"',
      "    skills: [sql]",
      "  named:",
      "    color: teal",
      "    skills: [dbt]",
    ].join("\n");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(yaml, { status: 200 })),
    );

    const { skill_categories } = await loadTimeline();

    expect(skill_categories.six.color).toBe("#3178C6");
    expect(skill_categories.three.color).toBe("#aabbcc");
    expect(skill_categories.named.color).toBe(DEFAULT_SKILL_COLOR);
  });

  const ENTRY = [
    "  - type: role",
    "    title: A role",
    "    organization: Somewhere",
    "    start_date: 2021",
    "    end_date: Present",
    "    one_liner: did a thing",
  ];
  const serving = (lines: string[]) =>
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(lines.join("\n"), { status: 200 })),
    );

  it("reads a bare year and Present, and no skills or categories as none (#190 M22)", async () => {
    serving(["entries:", ...ENTRY]);
    const { entries, skill_categories } = await loadTimeline();
    expect(entries[0]).toMatchObject({ start_date: "2021", end_date: "present", skills: [] });
    expect(skill_categories).toEqual({});
  });

  it.each([
    ["a full month name", "    end_date: March 2026"],
    ["an ISO date, which YAML reads as a Date", "    end_date: 2025-03-01"],
    ["a year and month", '    end_date: "2025-03"'],
  ])("rejects %s, naming the file and the field (#190 M22)", async (_, line) => {
    serving(["entries:", ...ENTRY.slice(0, 4), line, ENTRY[5]]);
    await expect(loadTimeline()).rejects.toThrow(
      /content\/timeline\.yaml has 1 problem\(s\):\n {2}- entries\.0\.end_date: expected a date: "Mon YYYY", "YYYY" or present/,
    );
  });

  it("rejects a category with no body, naming it", async () => {
    serving(["entries:", ...ENTRY, "skill_categories:", "  tools:"]);
    await expect(loadTimeline()).rejects.toThrow(/skill_categories\.tools: expected a mapping/);
  });

  it("rejects a file that won't load, naming it", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("", { status: 404 })));
    await expect(loadTimeline()).rejects.toThrow("content/timeline.yaml didn't load (404)");
  });
});
