import { describe, expect, it } from "vitest";
import site from "virtual:site-config";
import timelineYaml from "@site/public/content/timeline.yaml?raw";
import { timelineShape } from "../config/contentSchema";
import { shareCard, textOf } from "../test/site";
import { parseYaml } from "../utils/contentFile";

const card = shareCard();

const { entries } = parseYaml(timelineShape, timelineYaml, "content/timeline.yaml");
const current = entries.find(
  ({ type, end_date }) => type === "role" && end_date === "present",
);

describe("the site's head", () => {
  it.skipIf(!card)("describes what the card actually says", () => {
    // The PNG is rendered from og-image.html (scripts/og-image/render.mjs), so
    // a headline edited in one place and not the other fails here.
    const text = (selector: string) => textOf(card!.querySelector(selector));
    expect(`${text("h1")} ${text(".sub")}`).toBe(site.seo.image.alt);
  });

  // Between jobs, the timeline has no current role to hold job_title to.
  it.skipIf(!current)("gives the Person schema the current role from timeline.yaml", () => {
    // The head is prerendered before any content loads, so the role is written
    // out in site.yaml too (owner.job_title, owner.works_for); a job change
    // edited in one place fails here. src/seo/site.test.ts holds the schema
    // to site.yaml.
    expect(site.owner.job_title).toBe(current!.title);
    if (site.owner.works_for) {
      expect(site.owner.works_for.name).toBe(current!.organization);
      if (current!.domain) {
        expect(site.owner.works_for.url).toBe(`https://${current!.domain}`);
      }
    }
  });
});
