import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { makeBio, makeEducation, makeEmployment } from "../../test/builders";

/**
 * The load -> revert round trip, which is the half of the critical path the
 * regenerate suite does not reach.
 *
 * These two actions are coupled in a way that hides bugs: `loadContent` is the
 * only writer of originalBio/originalExperience/originalEducation, and
 * `resetContent` is their only reader. So a fault in the load is invisible
 * until a visitor presses DISPEL ENCHANTMENT, possibly much later and with no
 * error anywhere in between. Pinning them apart is not enough -- the round
 * trip itself is asserted below.
 *
 * Each test sets up its own state explicitly. There is deliberately no shared
 * seed helper beyond the module mocks: a change to a shared stub is what broke
 * two tests in layout-stability.spec.ts through exactly this file's sibling,
 * and the duplication here is a few lines.
 */

const loadBio = vi.fn();
const loadTimeline = vi.fn();
const loadProjects = vi.fn();
const loadResume = vi.fn();
const loadShowcase = vi.fn();

vi.mock("../../utils/bioLoader", () => ({ loadBio: () => loadBio() }));
vi.mock("../../utils/timelineLoader", () => ({ loadTimeline: () => loadTimeline() }));
vi.mock("../../utils/projectLoader", () => ({ loadProjects: () => loadProjects() }));
vi.mock("../../data/resume", () => ({ loadResume: () => loadResume() }));
vi.mock("../../utils/showcaseLoader", () => ({ loadShowcase: () => loadShowcase() }));

const { useContentStore } = await import("../contentStore");

const BIO = makeBio({
  display_name: "Christopher Rogers",
  about_text: "the original",
});
const EXPERIENCE = [
  makeEmployment({
    title: "Engineer",
    company: "Somewhere",
  }),
];
const EDUCATION = [makeEducation({ degree: "BSc", school: "Somewhere Else" })];
const TIMELINE = { entries: [], skill_categories: {} };
const PROJECTS = [{ id: "shuffify" }];
const RESUME = { experience: EXPERIENCE, education: EDUCATION, skills: [] };

/** Return the store to the shape it has before anything has ever loaded. */
const blankStore = () =>
  useContentStore.setState({
    bio: null,
    experience: [],
    education: [],
    timeline: null,
    projects: [],
    showcase: null,
    originalBio: null,
    originalExperience: [],
    originalEducation: [],
    loads: { bio: "loading", timeline: "loading", projects: "loading" },
    regenerationError: null,
    hasModifiedContent: false,
  });

describe("loadContent", () => {
  beforeEach(() => {
    blankStore();
    vi.clearAllMocks();
    loadShowcase.mockResolvedValue([]);
    vi.spyOn(console, "error").mockImplementation(() => {});
  });
  afterEach(() => vi.restoreAllMocks());

  it("captures the loaded content as the originals, which is the only thing that makes revert possible", async () => {
    loadBio.mockResolvedValue(BIO);
    loadTimeline.mockResolvedValue(TIMELINE);
    loadProjects.mockResolvedValue(PROJECTS);
    loadResume.mockResolvedValue(RESUME);

    await useContentStore.getState().loadContent();

    const s = useContentStore.getState();
    // The visible content...
    expect(s.bio).toEqual(BIO);
    expect(s.experience).toEqual(EXPERIENCE);
    // ...and the copy DISPEL ENCHANTMENT will restore from. A load that
    // populated the page but not these would look completely healthy and
    // break only on a revert, later.
    expect(s.originalBio).toEqual(BIO);
    expect(s.originalExperience).toEqual(EXPERIENCE);
    expect(s.originalEducation).toEqual(EDUCATION);
    expect(s.loads).toEqual({ bio: "ready", timeline: "ready", projects: "ready" });
  });

  it("makes a failed bio the page's failure, naming the file, and leaves no half page", async () => {
    // Unlike a regeneration failure, this one SHOULD reach the page: there is
    // no content to show, so the full-page error screen is the right outcome.
    loadBio.mockRejectedValue(new Error("content/bio.yaml answered 404"));
    loadTimeline.mockResolvedValue(TIMELINE);
    loadProjects.mockResolvedValue(PROJECTS);
    loadResume.mockResolvedValue(RESUME);

    await useContentStore.getState().loadContent();

    const s = useContentStore.getState();
    expect(s.loads.bio).toEqual({ error: "content/bio.yaml answered 404" });
    expect(s.bio).toBeNull();
    expect(s.originalBio).toBeNull();
  });

  it("keeps the rest when the timeline fails, and says which file (#190 M23)", async () => {
    // These used to be awaited together, so one rejecting took the page.
    loadBio.mockResolvedValue(BIO);
    loadTimeline.mockRejectedValue(
      new Error("content/timeline.yaml has 1 problem(s):\n  - entries.0.end_date: expected a date"),
    );
    loadProjects.mockResolvedValue(PROJECTS);
    loadResume.mockResolvedValue(RESUME);

    await useContentStore.getState().loadContent();

    const s = useContentStore.getState();
    expect(s.loads).toEqual({
      bio: "ready",
      timeline: { error: "content/timeline.yaml has 1 problem(s)" },
      projects: "ready",
    });
    expect(s.bio).toEqual(BIO);
    expect(s.projects).toEqual(PROJECTS);
  });

  it("keeps the rest when the projects fail", async () => {
    loadBio.mockResolvedValue(BIO);
    loadTimeline.mockResolvedValue(TIMELINE);
    loadProjects.mockRejectedValue(new Error("content/projects/index.yaml answered 500"));
    loadResume.mockResolvedValue(RESUME);

    await useContentStore.getState().loadContent();

    expect(useContentStore.getState().loads).toEqual({
      bio: "ready",
      timeline: "ready",
      projects: { error: "content/projects/index.yaml answered 500" },
    });
  });

  it("shows each part as soon as its own file is in", async () => {
    loadBio.mockResolvedValue(BIO);
    loadTimeline.mockResolvedValue(TIMELINE);
    loadProjects.mockReturnValue(new Promise(() => {})); // never answers
    loadResume.mockResolvedValue(RESUME);

    void useContentStore.getState().loadContent();
    await vi.waitFor(() => expect(useContentStore.getState().loads.bio).toBe("ready"));

    expect(useContentStore.getState().bio).toEqual(BIO);
    expect(useContentStore.getState().loads.projects).toBe("loading");
  });

  it("loads the photo strip's images with the rest, so a link below the strip can wait for them", async () => {
    const IMAGES = [{ src: "/profile-photos/a", alt: "a" }];
    let resolve!: (value: typeof IMAGES) => void;
    loadShowcase.mockReturnValue(new Promise((r) => (resolve = r)));
    loadBio.mockResolvedValue(BIO);
    loadTimeline.mockResolvedValue(TIMELINE);
    loadProjects.mockResolvedValue(PROJECTS);
    loadResume.mockResolvedValue(RESUME);

    const loading = useContentStore.getState().loadContent();
    expect(loadShowcase).toHaveBeenCalledTimes(1);
    // Null until the file settles: the home page's hash scroll waits on it.
    expect(useContentStore.getState().showcase).toBeNull();
    resolve(IMAGES);
    await loading;
    expect(useContentStore.getState().showcase).toEqual(IMAGES);
  });

  it("takes nothing down when a résumé file no page renders fails (#159)", async () => {
    loadBio.mockResolvedValue(BIO);
    loadTimeline.mockResolvedValue(TIMELINE);
    loadProjects.mockResolvedValue(PROJECTS);
    loadResume.mockRejectedValue(new Error("content/skills.yaml answered 404"));

    await useContentStore.getState().loadContent();

    const s = useContentStore.getState();
    expect(s.loads).toEqual({ bio: "ready", timeline: "ready", projects: "ready" });
    expect(s.experience).toEqual([]);
  });
});

describe("reloading one part (#190 M23)", () => {
  beforeEach(() => {
    blankStore();
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });
  afterEach(() => vi.restoreAllMocks());

  it("shows the timeline's wait, then what came", async () => {
    useContentStore.setState({ loads: { bio: "ready", timeline: { error: "x" }, projects: "ready" } });
    let resolve!: (value: typeof TIMELINE) => void;
    loadTimeline.mockReturnValue(new Promise((r) => (resolve = r)));

    const reloading = useContentStore.getState().reloadTimeline();
    expect(useContentStore.getState().loads.timeline).toBe("loading");
    resolve(TIMELINE);
    await reloading;

    expect(useContentStore.getState().timeline).toEqual(TIMELINE);
    expect(useContentStore.getState().loads).toEqual({ bio: "ready", timeline: "ready", projects: "ready" });
    expect(loadBio).not.toHaveBeenCalled();
  });

  it("brings the projects back alone", async () => {
    useContentStore.setState({ loads: { bio: "ready", timeline: "ready", projects: { error: "x" } } });
    loadProjects.mockResolvedValue(PROJECTS);

    await useContentStore.getState().reloadProjects();

    expect(useContentStore.getState().projects).toEqual(PROJECTS);
    expect(useContentStore.getState().loads.projects).toBe("ready");
    expect(loadBio).not.toHaveBeenCalled();
    expect(loadTimeline).not.toHaveBeenCalled();
  });

  it("says when the projects fail again", async () => {
    useContentStore.setState({ loads: { bio: "ready", timeline: "ready", projects: { error: "x" } } });
    loadProjects.mockRejectedValue(new Error("content/projects/a.yaml has 2 problem(s):\n  - id: missing"));

    await useContentStore.getState().reloadProjects();

    expect(useContentStore.getState().loads.projects).toEqual({
      error: "content/projects/a.yaml has 2 problem(s)",
    });
  });
});

describe("resetContent", () => {
  beforeEach(() => {
    blankStore();
    vi.clearAllMocks();
  });
  afterEach(() => vi.restoreAllMocks());

  it("restores the originals and clears the regeneration's error", () => {
    useContentStore.setState({
      bio: makeBio({
        display_name: "Christopher Rogers",
        about_text: "rewritten",
      }),
      experience: [makeEmployment({ title: "Wizard", company: "Elsewhere" })],
      education: [],
      originalBio: BIO,
      originalExperience: EXPERIENCE,
      originalEducation: EDUCATION,
      hasModifiedContent: true,
      regenerationError: "stale transient",
    });

    useContentStore.getState().resetContent();

    const s = useContentStore.getState();
    expect(s.bio).toEqual(BIO);
    expect(s.experience).toEqual(EXPERIENCE);
    expect(s.education).toEqual(EDUCATION);
    expect(s.hasModifiedContent).toBe(false);
    expect(s.regenerationError).toBeNull();
  });

  it("refuses when nothing has loaded, rather than blanking the page", () => {
    // POSITIVE CONTROL. "Content unchanged" is satisfied trivially by a store
    // that never had content, so the store is given visible content with NO
    // originals -- the state a reset would actually damage. Without this
    // setup the assertion below passes against a resetContent that writes
    // empty originals straight over the page.
    const onScreen = makeBio({
      display_name: "Christopher Rogers",
      about_text: "live",
    });
    useContentStore.setState({
      bio: onScreen,
      experience: EXPERIENCE,
      originalBio: null,
      originalExperience: [],
      hasModifiedContent: true,
    });

    useContentStore.getState().resetContent();

    const s = useContentStore.getState();
    expect(s.bio).toEqual(onScreen); // not blanked
    expect(s.experience).toEqual(EXPERIENCE);
    expect(s.hasModifiedContent).toBe(true); // and it did not pretend to act
  });
});

describe("the round trip a visitor actually performs", () => {
  beforeEach(() => {
    blankStore();
    vi.clearAllMocks();
  });
  afterEach(() => vi.restoreAllMocks());

  it("load, regenerate, revert lands back on exactly what was loaded", async () => {
    loadBio.mockResolvedValue(BIO);
    loadTimeline.mockResolvedValue(TIMELINE);
    loadProjects.mockResolvedValue(PROJECTS);
    loadResume.mockResolvedValue(RESUME);
    await useContentStore.getState().loadContent();

    const asLoaded = useContentStore.getState().bio;

    const realFetch = globalThis.fetch;
    globalThis.fetch = vi.fn().mockResolvedValue({
      json: async () => ({
        success: true,
        content: {
          about: { display_name: BIO.display_name, about_text: "rewritten" },
        },
      }),
    }) as unknown as typeof fetch;

    await useContentStore.getState().regenerateContent(false);

    // POSITIVE CONTROL. If the regeneration silently did nothing, the revert
    // below would "restore" content that never changed and the final assertion
    // would pass having tested nothing.
    expect(useContentStore.getState().bio).not.toEqual(asLoaded);
    expect(useContentStore.getState().hasModifiedContent).toBe(true);

    useContentStore.getState().resetContent();
    globalThis.fetch = realFetch;

    expect(useContentStore.getState().bio).toEqual(asLoaded);
    expect(useContentStore.getState().hasModifiedContent).toBe(false);
  });
});
