import { describe, it, expect } from "vitest";
import { claudfather } from "./claudfather";
import { PLANNED, strings } from "../test/claudfatherRules";

describe("Claudfather portfolio copy", () => {
  it("keeps the plain voice and leaves provider inventories to their owners", () => {
    for (const text of strings(claudfather)) {
      expect(text).toMatch(/\S/);
      expect(text).not.toContain("—");
      expect(text).not.toMatch(PLANNED);
      expect((text.match(/`/g) ?? []).length % 2).toBe(0);
    }
    expect(strings(claudfather.hero).join(" ")).not.toMatch(/artemis/i);
  });

  it("pins every role to public evidence and dates it", () => {
    expect(claudfather.family).toHaveLength(4);
    for (const role of claudfather.family) {
      expect(role.source).toMatch(
        /^https:\/\/github\.com\/Claudfather\/\.github\/blob\/[0-9a-f]{40}\/BRAND\.md/,
      );
      expect(role.asOf).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(Number.isNaN(Date.parse(role.asOf))).toBe(false);
    }
  });

  it("does not offer the private evaluation repository or an ecosystem-wide license", () => {
    expect(
      claudfather.family.find(({ id }) => id === "claudosseum")?.repo,
    ).toBeNull();
    expect(strings(claudfather).join(" ")).not.toMatch(
      /everything is open source|github\.com\/Claudfather\/Claudosseum/i,
    );
  });

  it("labels the current preview and conceptual walkthrough honestly", () => {
    expect(claudfather.hero.status).toMatch(/alpha/i);
    expect(claudfather.workflow.label).toMatch(/illustrative/i);
    expect(claudfather.workflow.caveat).toMatch(
      /not a recorded run or an automatic integration/,
    );
    if (claudfather.website?.state === "preview") {
      expect(claudfather.website.caveat).toMatch(/synthetic/i);
      expect(claudfather.website.caveat).toMatch(/does not run a real team/i);
    }
  });
});
