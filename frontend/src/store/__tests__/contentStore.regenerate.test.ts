import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useContentStore } from "../contentStore";

/**
 * Regeneration is one request per click.
 *
 * It used to be one request per section fired concurrently, which raced the
 * siblings through the server's per-IP cooldown: the loser got a 429, the
 * client required every response to succeed, and the whole regeneration was
 * discarded -- including the section that had worked.
 *
 * These tests pin what came out of that: one click is one request, a partial
 * failure keeps the sections that worked, and a failure never lands in `error`,
 * which drives HomePage's full-page fatal screen and unmounts a page that still
 * has content to show.
 */

const BIO = { display_name: "Christopher Rogers", about_text: "original" };
const realFetch = globalThis.fetch;

const seed = () =>
  useContentStore.setState({
    bio: BIO,
    experience: [],
    education: [],
    isRegenerating: false,
    error: null,
    regenerationError: null,
  });

const respondWith = (body: unknown) => {
  const mock = vi.fn().mockResolvedValue({ json: async () => body });
  globalThis.fetch = mock as unknown as typeof fetch;
  return mock;
};

/** Collect every contentRegenerated event fired during `run`. */
const captureEvents = async (run: () => Promise<void>) => {
  const seen: { section: string; content: unknown }[] = [];
  const listener = (e: Event) =>
    seen.push((e as CustomEvent).detail as { section: string; content: unknown });
  window.addEventListener("contentRegenerated", listener);
  try {
    await run();
  } finally {
    window.removeEventListener("contentRegenerated", listener);
  }
  return seen;
};

describe("regenerateContent", () => {
  beforeEach(seed);
  afterEach(() => {
    globalThis.fetch = realFetch;
    vi.restoreAllMocks();
  });

  it("sends exactly one request carrying every section", async () => {
    const fetchMock = respondWith({
      success: true,
      content: { about: { about_text: "rewritten" }, portfolio: {} },
      failed_sections: [],
    });

    await useContentStore.getState().regenerateContent(true);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(Object.keys(body.sections).sort()).toEqual(["about", "portfolio"]);
  });

  it("applies the sections that succeeded when one fails", async () => {
    respondWith({
      success: true,
      content: { about: { about_text: "rewritten" } },
      failed_sections: ["portfolio"],
    });

    await useContentStore.getState().regenerateContent(true);

    const state = useContentStore.getState();
    expect(state.bio?.about_text).toBe("rewritten");
    expect(state.regenerationError).toBeTruthy();
  });

  it("leaves content untouched for a section the server could not rewrite", async () => {
    respondWith({
      success: true,
      content: { portfolio: { experience: [{ title: "Engineer" }] } },
      failed_sections: ["about"],
    });

    await useContentStore.getState().regenerateContent(true);

    const state = useContentStore.getState();
    expect(state.bio).toEqual(BIO);
    expect(state.experience).toEqual([{ title: "Engineer" }]);
  });

  it("does not announce a section that failed", async () => {
    // Legacy listeners assign event.detail.content straight into their own
    // state, so announcing an absent section blanks the content the store just
    // preserved -- the same collapse, one layer down.
    respondWith({
      success: true,
      content: { about: { about_text: "rewritten" } },
      failed_sections: ["portfolio"],
    });

    const seen = await captureEvents(() =>
      useContentStore.getState().regenerateContent(true),
    );

    expect(seen.map((e) => e.section)).toEqual(["about"]);
    expect(seen.every((e) => e.content !== undefined)).toBe(true);
  });

  it("does not set the fatal error on a failed regeneration", async () => {
    // The white-screen regression: `error` drives HomePage's full-page error
    // screen, so putting a transient failure there unmounted a working page.
    respondWith({ success: false, error: "nope" });

    await useContentStore.getState().regenerateContent(true);

    const state = useContentStore.getState();
    expect(state.error).toBeNull();
    expect(state.regenerationError).toBeTruthy();
    expect(state.bio).toEqual(BIO);
  });

  it("does not set the fatal error when the request itself throws", async () => {
    globalThis.fetch = vi
      .fn()
      .mockRejectedValue(new Error("offline")) as unknown as typeof fetch;

    await useContentStore.getState().regenerateContent(true);

    expect(useContentStore.getState().error).toBeNull();
    expect(useContentStore.getState().regenerationError).toBeTruthy();
  });
});
