import { describe, it, expect } from "vitest";
import yaml from "js-yaml";
import {
  ABOUT_META,
  HOME_META,
  NOT_FOUND_META,
  PROJECTS_META,
  OG_IMAGE,
  SITE_URL,
  headTags,
  jsonLd,
  pageTitle,
  projectMeta,
  type PageMeta,
} from ".";
import site from "virtual:site-config";
import type { TimelineData } from "../types";
import { createSeo } from "./site";
import ogImageHtml from "@site/og-image.html?raw";
import timelineYaml from "@site/public/content/timeline.yaml?raw";

const tagValue = (meta: PageMeta, key: string) => {
  const found = headTags(meta).find(
    ({ attrs }) => (attrs.name ?? attrs.property ?? attrs.rel) === key,
  );
  return found?.attrs.content ?? found?.attrs.href;
};

describe("headTags", () => {
  it("gives a page every tag a link unfurler reads", () => {
    const title = pageTitle(PROJECTS_META);
    expect(tagValue(PROJECTS_META, "description")).toBe(PROJECTS_META.description);
    expect(tagValue(PROJECTS_META, "canonical")).toBe(`${SITE_URL}/projects`);
    expect(tagValue(PROJECTS_META, "og:title")).toBe(title);
    expect(tagValue(PROJECTS_META, "og:description")).toBe(PROJECTS_META.description);
    expect(tagValue(PROJECTS_META, "og:url")).toBe(`${SITE_URL}/projects`);
    expect(tagValue(PROJECTS_META, "twitter:card")).toBe("summary_large_image");
    expect(tagValue(PROJECTS_META, "twitter:title")).toBe(title);
  });

  it("points og:image and twitter:image at an absolute URL, with its size", () => {
    // Crawlers resolve nothing: a relative og:image is no image.
    const image = `${SITE_URL}${OG_IMAGE.path}`;
    expect(tagValue(HOME_META, "og:image")).toBe(image);
    expect(tagValue(HOME_META, "twitter:image")).toBe(image);
    expect(tagValue(HOME_META, "og:image:width")).toBe("1200");
    expect(tagValue(HOME_META, "og:image:height")).toBe("630");
  });

  it("names the page first, then the site", () => {
    // The front door is Claudlobby's, so its tab and share titles say so.
    expect(pageTitle(HOME_META)).toMatch(/^Claudlobby \| /);
    expect(pageTitle(PROJECTS_META)).toMatch(/^Projects \| /);
  });

  it("keeps canonical and og:url off a page that must not be indexed", () => {
    expect(tagValue(NOT_FOUND_META, "robots")).toBe("noindex, nofollow");
    expect(tagValue(NOT_FOUND_META, "canonical")).toBeUndefined();
    expect(tagValue(NOT_FOUND_META, "og:url")).toBeUndefined();
  });

  it("emits each tag once", () => {
    const keys = headTags(HOME_META).map(
      ({ attrs }) => attrs.name ?? attrs.property ?? attrs.rel,
    );
    expect(new Set(keys).size).toBe(keys.length);
  });
});

describe("OG_IMAGE", () => {
  it("describes what the card actually says", () => {
    // The PNG is rendered from this HTML (scripts/og-image/render.mjs), so a
    // headline edited in one place and not the other fails here.
    const card = new DOMParser().parseFromString(ogImageHtml, "text/html");
    const text = (selector: string) =>
      card.querySelector(selector)?.textContent?.replace(/\s+/g, " ").trim();
    expect(`${text("h1")} ${text(".sub")}`).toBe(OG_IMAGE.alt);
  });
});

describe("ABOUT_META", () => {
  it("gives the Person schema the current role from timeline.yaml", () => {
    // The head is prerendered before any content loads, so the role is written
    // out in site.yaml too (owner.job_title, owner.works_for); a job change
    // edited in one place fails here.
    // timeline.yaml is the career history /about renders.
    const { entries } = yaml.load(timelineYaml) as TimelineData;
    const current = entries.find(
      ({ type, end_date }) => type === "role" && end_date === "present",
    );
    const person = ABOUT_META.schemas?.find(
      (schema) => (schema as { "@type": string })["@type"] === "Person",
    );
    expect(current).toBeDefined();
    expect(person).toMatchObject({
      jobTitle: current?.title,
      worksFor: {
        name: current?.organization,
        url: `https://${current?.domain}`,
      },
    });
  });
});

describe("projectMeta", () => {
  const project = {
    id: "storydump",
    title: "Storydump",
    description: "a telegram bot for managing\ninstagram stories.\n",
    url: "https://storydump.app",
  };

  it("folds a YAML block description onto one line", () => {
    expect(projectMeta(project).description).toBe(
      "a telegram bot for managing instagram stories.",
    );
  });

  it("builds breadcrumb URLs from site-relative paths", () => {
    // The component this replaced prefixed the origin onto URLs that were
    // already absolute and shipped "https://crog.gghttps://crog.gg/".
    const breadcrumbs = projectMeta(project).schemas?.find(
      (schema) => (schema as { "@type": string })["@type"] === "BreadcrumbList",
    ) as { itemListElement: { item: string }[] };
    expect(breadcrumbs.itemListElement.map((crumb) => crumb.item)).toEqual([
      `${SITE_URL}/`,
      `${SITE_URL}/projects`,
      `${SITE_URL}/projects/storydump`,
    ]);
  });
});

describe("jsonLd", () => {
  it("cannot be closed early by a string inside the schema", () => {
    const schema = { name: "</script><script>alert(1)</script>" };
    const serialized = jsonLd(schema);
    expect(serialized).not.toContain("</script");
    expect(JSON.parse(serialized)).toEqual(schema);
  });
});

describe("the Person schema's sameAs", () => {
  it("lists exactly the schema socials, in order", () => {
    const person = ABOUT_META.schemas?.[0] as { sameAs: string[] };
    expect(person.sameAs).toEqual(
      site.socials
        .filter((social) => social.show_in.includes("schema"))
        .map((social) => social.url),
    );
  });
});

describe("createSeo, on a made-up site", () => {
  // Branches the shipped site.yaml doesn't take: no employer, and a social the
  // schema leaves out.
  const madeUp = createSeo({
    ...site,
    site: { url: "https://www.example.org" },
    owner: { ...site.owner, name: "Ada Example", works_for: undefined },
    socials: [
      { id: "a", label: "a", icon: "link", url: "https://a.example", show_in: ["schema"] },
      { id: "b", label: "b", icon: "link", url: "https://b.example", show_in: ["footer"] },
    ],
  });

  it("names the host without www. in the 404 copy", () => {
    expect(madeUp.NOT_FOUND_META.description).toContain("Head back to example.org to");
  });

  it("leaves worksFor out, and the footer-only social out of sameAs", () => {
    const person = madeUp.ABOUT_META.schemas?.[0] as Record<string, unknown>;
    expect(person).not.toHaveProperty("worksFor");
    expect(person.sameAs).toEqual(["https://a.example"]);
    expect(person.name).toBe("Ada Example");
  });

  it("builds every absolute URL on its own origin", () => {
    expect(madeUp.absoluteUrl("/projects")).toBe("https://www.example.org/projects");
  });
});

describe("home: profile (#188)", () => {
  const profile = createSeo({ ...site, home: "profile" });

  it("puts the personal page, and its Person schema, at /", () => {
    expect(profile.ABOUT_META.path).toBe("/");
    expect(profile.ABOUT_META.schemas?.[0]).toMatchObject({ "@type": "Person" });
  });

  it("drops the landing page from the pages the build writes", () => {
    expect(profile.PAGES.map((page) => page.path)).toEqual(["/", "/projects"]);
  });

  it("keeps the landing page first when home is landing", () => {
    const landing = createSeo({ ...site, home: "landing" });
    expect(landing.PAGES.map((page) => page.path)).toEqual(["/", "/about", "/projects"]);
  });
});
