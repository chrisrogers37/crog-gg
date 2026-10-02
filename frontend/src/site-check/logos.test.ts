import { describe, expect, it } from "vitest";
import timelineYaml from "@site/public/content/timeline.yaml?raw";
import { timelineShape } from "../config/contentSchema";
import { inSite } from "../test/site";
import { parseYaml } from "../utils/contentFile";
import { logoUrl } from "../utils/logos";

const logoFiles = import.meta.glob("@site/public/logos/*.png", {
  query: "?url",
  eager: true,
});

// Held to its shape, as the page holds it (#190).
const { entries } = parseYaml(timelineShape, timelineYaml, "content/timeline.yaml");
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
