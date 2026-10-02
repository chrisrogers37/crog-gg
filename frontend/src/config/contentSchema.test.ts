import { describe, expect, it } from "vitest";
import { DEFAULT_SKILL_COLOR } from "../utils/skillColor";
import { parseContent, projectIndexShape, projectShape, showcaseShape, timelineShape } from "./contentSchema";

/** The content files' shapes (#190 M22), field by field. */

const problems = (shape: Parameters<typeof parseContent>[0], raw: unknown) => {
  try {
    parseContent(shape, raw, "content/x.yaml");
    return "";
  } catch (error) {
    return (error as Error).message;
  }
};

const PROJECT = { id: "a", title: "A", description: "d", icon: "x", category: "c" };
const ENTRY = {
  type: "role",
  title: "T",
  organization: "O",
  start_date: "Jan 2020",
  end_date: "present",
  one_liner: "o",
};

describe("projects/index.yaml", () => {
  it.each([
    ["my-project.yaml", ""],
    ["My-Project.yaml", "projects.0: expected a file name"],
    ["my-project.yml", "projects.0: expected a file name"],
    ["../secrets.yaml", "projects.0: expected a file name"],
    ["my project.yaml", "projects.0: expected a file name"],
  ])("%s", (file, problem) => {
    expect(problems(projectIndexShape, { projects: [file] })).toContain(problem);
  });
});

describe("a project file", () => {
  it.each([
    [{ status: "archived" }, ""],
    [{ status: "done" }, "status: expected one of active, archived, experimental"],
    [{ demo: "http://a.example" }, "demo: expected an https URL"],
    [{ technologies: undefined }, ""],
    [{ share_card: { path: "/c.png", width: 1200, height: 630, alt: "a" } }, ""],
    [
      { share_card: { path: "c.png", width: 1200, height: 630, alt: "a" } },
      'share_card.path: expected a path that starts with one "/"',
    ],
    [{ share_card: { path: "/c.png", width: 0, height: 630, alt: "a" } }, "share_card.width"],
  ])("%j", (fields, problem) => {
    expect(problems(projectShape, { ...PROJECT, ...fields })).toContain(problem);
  });
});

describe("timeline.yaml", () => {
  it.each([
    ["example.com", ""],
    ["https://example.com", "entries.0.domain: expected a domain"],
    ["example", "entries.0.domain: expected a domain"],
  ])("domain %s", (domain, problem) => {
    expect(problems(timelineShape, { entries: [{ ...ENTRY, domain }] })).toContain(problem);
  });

  it("gives a colour that isn't hex, or none, the default grey, and a category no skills", () => {
    const { skill_categories: categories } = parseContent(
      timelineShape,
      {
        entries: [],
        skill_categories: {
          short: { color: "#abc" },
          named: { color: "teal", skills: ["a"] },
          number: { color: 123456 },
          none: { skills: [] },
        },
      },
      "content/timeline.yaml",
    );
    expect(categories.short).toEqual({ color: "#aabbcc", skills: [] });
    expect(categories.named.color).toBe(DEFAULT_SKILL_COLOR);
    expect(categories.number.color).toBe(DEFAULT_SKILL_COLOR);
    expect(categories.none.color).toBe(DEFAULT_SKILL_COLOR);
  });
});

describe("showcase.yaml", () => {
  it.each([
    [{ src: "/profile-photos/a", alt: "A" }, ""],
    [{ src: "profile-photos/a", alt: "A" }, 'images.0.src: expected a path that starts with one "/"'],
    [{ src: "/profile-photos/a" }, "images.0.alt: missing"],
  ])("%j", (image, problem) => {
    expect(problems(showcaseShape, { images: [image] })).toContain(problem);
  });
});
