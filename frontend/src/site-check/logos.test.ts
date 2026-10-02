import { describe, expect, it } from "vitest";
import yaml from "js-yaml";
import timelineYaml from "@site/public/content/timeline.yaml?raw";
import { inSite } from "../test/site";
import type { TimelineData } from "../types/Timeline";
import { logoUrl } from "../utils/logos";

const logoFiles = import.meta.glob("@site/public/logos/*.png", {
  query: "?url",
  eager: true,
});

const { entries } = yaml.load(timelineYaml) as TimelineData;
const domains = new Set(entries.flatMap((entry) => entry.domain ?? []));

describe("the timeline's logos", () => {
  // A timeline with no domains has nothing to check.
  it.skipIf(domains.size === 0)("has a logo for every organisation that names a domain", () => {
    // A new timeline entry with a new domain would show a placeholder until
    // its logo is added to public/logos/, so the gap is caught here instead.
    for (const domain of domains) {
      expect(inSite(logoFiles, `/public${logoUrl(domain)}`), `public${logoUrl(domain)}`).toBeDefined();
    }
  });
});
