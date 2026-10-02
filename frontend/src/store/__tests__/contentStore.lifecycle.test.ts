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

const loadResumeData = vi.fn();
const loadTimeline = vi.fn();

vi.mock("../../data/resume", () => ({
  loadResumeData: () => loadResumeData(),
}));
vi.mock("../../utils/timelineLoader", () => ({
  loadTimeline: () => loadTimeline(),
}));

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
const TIMELINE = { entries: [] };

const resumePayload = () => ({
  bio: BIO,
  experience: EXPERIENCE,
  education: EDUCATION,
  skills: [{ name: "TypeScript" }],
  projects: [{ id: "shuffify" }],
});

/** Return the store to the shape it has before anything has ever loaded. */
const blankStore = () =>
  useContentStore.setState({
    bio: null,
    experience: [],
    education: [],
    originalBio: null,
    originalExperience: [],
    originalEducation: [],
    isLoading: false,
    error: null,
    regenerationError: null,
    hasModifiedContent: false,
  });

describe("loadContent", () => {
  beforeEach(() => {
    blankStore();
    vi.clearAllMocks();
  });
  afterEach(() => vi.restoreAllMocks());

  it("captures the loaded content as the originals, which is the only thing that makes revert possible", async () => {
    loadResumeData.mockResolvedValue(resumePayload());
    loadTimeline.mockResolvedValue(TIMELINE);

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
    expect(s.isLoading).toBe(false);
    expect(s.error).toBeNull();
  });

  it("surfaces a load failure as the fatal error and stops loading", async () => {
    // Unlike a regeneration failure, this one SHOULD reach `error`: there is
    // no content to show, so the full-page error screen is the right outcome.
    loadResumeData.mockRejectedValue(new Error("content unreachable"));
    loadTimeline.mockResolvedValue(TIMELINE);
    vi.spyOn(console, "error").mockImplementation(() => {});

    await useContentStore.getState().loadContent();

    const s = useContentStore.getState();
    expect(s.error).toBeTruthy();
    expect(s.isLoading).toBe(false);
    // and it must not leave a half-populated page behind
    expect(s.bio).toBeNull();
    expect(s.originalBio).toBeNull();
  });

  it("does not strand the page in a loading state when the timeline is what fails", async () => {
    // Both loads are awaited together, so either one rejecting takes the pair.
    loadResumeData.mockResolvedValue(resumePayload());
    loadTimeline.mockRejectedValue(new Error("timeline unreachable"));
    vi.spyOn(console, "error").mockImplementation(() => {});

    await useContentStore.getState().loadContent();

    expect(useContentStore.getState().isLoading).toBe(false);
    expect(useContentStore.getState().error).toBeTruthy();
  });
});

describe("resetContent", () => {
  beforeEach(() => {
    blankStore();
    vi.clearAllMocks();
  });
  afterEach(() => vi.restoreAllMocks());

  it("restores the originals and clears both error channels", () => {
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
      error: "stale fatal",
      regenerationError: "stale transient",
    });

    useContentStore.getState().resetContent();

    const s = useContentStore.getState();
    expect(s.bio).toEqual(BIO);
    expect(s.experience).toEqual(EXPERIENCE);
    expect(s.education).toEqual(EDUCATION);
    expect(s.hasModifiedContent).toBe(false);
    expect(s.error).toBeNull();
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

  it("announces the restored content to legacy listeners", async () => {
    // Components that never migrated to the store assign event.detail.content
    // into their own state. If the revert does not reach them they keep
    // rendering the regenerated text while the store says it is original.
    useContentStore.setState({
      bio: makeBio({
        display_name: "Christopher Rogers",
        about_text: "rewritten",
      }),
      originalBio: BIO,
      originalExperience: EXPERIENCE,
      originalEducation: EDUCATION,
      hasModifiedContent: true,
    });

    const seen: { section: string; content: unknown }[] = [];
    const listener = (e: Event) =>
      seen.push(
        (e as CustomEvent).detail as { section: string; content: unknown },
      );
    window.addEventListener("contentRegenerated", listener);
    try {
      useContentStore.getState().resetContent();
    } finally {
      window.removeEventListener("contentRegenerated", listener);
    }

    expect(seen.map((e) => e.section).sort()).toEqual(["about", "portfolio"]);
    expect(seen.find((e) => e.section === "about")?.content).toEqual(BIO);
  });
});

describe("the round trip a visitor actually performs", () => {
  beforeEach(() => {
    blankStore();
    vi.clearAllMocks();
  });
  afterEach(() => vi.restoreAllMocks());

  it("load, regenerate, revert lands back on exactly what was loaded", async () => {
    loadResumeData.mockResolvedValue(resumePayload());
    loadTimeline.mockResolvedValue(TIMELINE);
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
