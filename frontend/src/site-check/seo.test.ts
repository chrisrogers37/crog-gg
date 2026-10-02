import { describe, expect, it } from "vitest";
import yaml from "js-yaml";
import site from "virtual:site-config";
import timelineYaml from "@site/public/content/timeline.yaml?raw";
import type { TimelineData } from "../types";

// The card's source, when the site keeps one: the PNG is rendered from it.
const [cardHtml] = Object.values(
  import.meta.glob<string>("@site/og-image.html", { query: "?raw", import: "default", eager: true }),
);

describe("the site's head", () => {
  it.skipIf(cardHtml === undefined)("describes what the card actually says", () => {
    // The PNG is rendered from og-image.html (scripts/og-image/render.mjs), so
    // a headline edited in one place and not the other fails here.
    const card = new DOMParser().parseFromString(cardHtml!, "text/html");
    const text = (selector: string) =>
      card.querySelector(selector)?.textContent?.replace(/\s+/g, " ").trim();
    expect(`${text("h1")} ${text(".sub")}`).toBe(site.seo.image.alt);
  });

  it("gives the Person schema the current role from timeline.yaml", () => {
    // The head is prerendered before any content loads, so the role is written
    // out in site.yaml too (owner.job_title, owner.works_for); a job change
    // edited in one place fails here.
    const { entries } = yaml.load(timelineYaml) as TimelineData;
    const current = entries.find(
      ({ type, end_date }) => type === "role" && end_date === "present",
    );
    expect(current, "a role that runs to the present").toBeDefined();
    expect(site.owner.job_title).toBe(current?.title);
    if (site.owner.works_for) {
      expect(site.owner.works_for.name).toBe(current?.organization);
    }
  });
});
