import { describe, expect, it } from "vitest";
import { readSiteYaml } from "../../scripts/site-config";
import { parseSiteConfig } from "./schema";

type Data = Record<string, unknown>;

/** The active site.yaml as plain data, fresh for each test to break. */
const shipped = () => readSiteYaml() as Data;

/** The mapping (or list) at a dotted path: "socials.0". */
const at = (data: Data, path: string) =>
  path.split(".").reduce<Data>((node, key) => node[key] as Data, data);

const listAt = (data: Data, path: string) => at(data, path) as unknown as unknown[];

const problems = (raw: unknown) => {
  try {
    parseSiteConfig(raw, "site.yaml");
  } catch (error) {
    return (error as Error).message;
  }
  throw new Error("parseSiteConfig accepted it");
};

describe("parseSiteConfig", () => {
  it("accepts the shipped site.yaml", () => {
    expect(() => parseSiteConfig(shipped())).not.toThrow();
  });

  it("names the file and each problem's key, all of them in one run", () => {
    const raw = shipped();
    at(raw, "owner").name = "";
    at(raw, "socials.0").url = "http://insecure.example";
    delete at(raw, "contact").text;

    const message = problems(raw);
    expect(message).toContain("site.yaml has 3 problem(s)");
    expect(message).toContain("owner.name: expected text");
    expect(message).toContain("socials.0.url: expected an https URL");
    expect(message).toContain("contact.text: missing");
  });

  it("refuses a key it doesn't know, so a misspelling can't be ignored", () => {
    const raw = shipped();
    at(raw, "footer").source_repo = at(raw, "footer").source_repo_url;
    expect(problems(raw)).toContain("footer.source_repo: unknown key");
  });

  it("wants the site's origin, with no path or trailing slash", () => {
    const raw = shipped();
    at(raw, "site").url = "https://example.com/";
    expect(problems(raw)).toContain("site.url: expected an https origin");
  });

  it("only knows the sections it has components for, each once", () => {
    const raw = shipped();
    const added = listAt(raw, "sections").push({ id: "blog", label: "Blog" }) - 1;
    expect(problems(raw)).toContain(
      `sections.${added}.id: expected one of about, journey, projects, music`,
    );

    const twice = shipped();
    listAt(twice, "sections").push({ ...at(twice, "sections.0") });
    expect(problems(twice)).toContain(`sections: "${at(twice, "sections.0").id}" is listed twice`);
  });

  it("keeps social ids unique, and their places and icons to the known ones", () => {
    const raw = shipped();
    listAt(raw, "socials").push({ ...at(raw, "socials.0") });
    expect(problems(raw)).toContain(`socials: the id "${at(raw, "socials.0").id}" is used twice`);

    const unknown = shipped();
    at(unknown, "socials.0").show_in = ["sidebar"];
    at(unknown, "socials.0").icon = "myspace";
    const message = problems(unknown);
    expect(message).toContain("socials.0.show_in.0: expected one of footer");
    expect(message).toContain("socials.0.icon: expected one of github");
  });

  it("needs About among the sections, since the preview is About's", () => {
    const raw = shipped();
    listAt(raw, "sections").splice(
      listAt(raw, "sections").findIndex((section) => (section as Data).id === "about"),
      1,
    );
    expect(problems(raw)).toContain('sections: "about" is required');
  });

  it("refuses a path that leaves the site, like //host/x", () => {
    const raw = shipped();
    at(raw, "owner").image = "//evil.example/p.jpg";
    expect(problems(raw)).toContain("owner.image: expected a path that starts with one");
  });

  it("needs {artist} in the music intro, once", () => {
    const raw = shipped();
    at(raw, "music").intro = "i make music.";
    expect(problems(raw)).toContain('music.intro: expected "{artist}" exactly once');
  });

  it("reads an empty optional value as not set", () => {
    const raw = shipped();
    at(raw, "footer").source_repo_url = "";
    at(raw, "music").embed = null;
    delete at(raw, "owner").works_for;

    const config = parseSiteConfig(raw);
    expect(config.footer.source_repo_url).toBeUndefined();
    expect(config.music.embed).toBeUndefined();
    expect(config.owner.works_for).toBeUndefined();
  });

  it("refuses a file that isn't a mapping", () => {
    expect(problems("just text")).toContain("the file: expected a mapping");
  });
});
