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

  it("keeps the entries when there are no skill categories, or one has no body", async () => {
    const yaml = [
      "entries:",
      "  - title: A role",
      "    type: role",
      "skill_categories:",
      "  tools:",
    ].join("\n");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(yaml, { status: 200 })),
    );
    const timeline = await loadTimeline();
    expect(timeline.entries).toHaveLength(1);

    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          new Response("entries:\n  - title: A role\n", { status: 200 }),
        ),
    );
    const bare = await loadTimeline();
    expect(bare.entries).toHaveLength(1);
    expect(bare.skill_categories).toEqual({});
  });
});
