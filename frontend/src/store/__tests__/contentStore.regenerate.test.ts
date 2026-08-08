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

/** A 200 whose body is not JSON at all -- an HTML error page from the edge, say. */
const respondWithUnparseableBody = () => {
  const mock = vi.fn().mockResolvedValue({
    json: async () => {
      throw new SyntaxError("Unexpected token < in JSON at position 0");
    },
  });
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

  /**
   * One click is one request; the in-flight guard is what keeps it that way.
   * The request count above proves a single call sends a single request, which
   * is a different claim from a second call being refused while the first is
   * still open -- that is the one a double-click actually exercises.
   */
  describe("a second click while one is in flight", () => {
    it("does not send a second request", async () => {
      const fetchMock = respondWith({
        success: true,
        content: { about: { about_text: "rewritten" } },
        failed_sections: [],
      });

      // regenerateContent sets isRegenerating before its first await, so two
      // synchronous calls are the faithful shape of a rapid double-click.
      const first = useContentStore.getState().regenerateContent(true);
      const second = useContentStore.getState().regenerateContent(true);
      await Promise.all([first, second]);

      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it("accepts a new click once the first has finished", async () => {
      const fetchMock = respondWith({
        success: true,
        content: { about: { about_text: "rewritten" } },
        failed_sections: [],
      });

      await useContentStore.getState().regenerateContent(true);
      await useContentStore.getState().regenerateContent(true);

      expect(fetchMock).toHaveBeenCalledTimes(2);
    });

  });

  it("sends nothing at all before content has loaded", async () => {
    // The other half of the same guard clause, and not a concurrency case --
    // it belongs beside the in-flight tests, not inside them.
    useContentStore.setState({ bio: null });
    const fetchMock = respondWith({ success: true, content: {} });

    await useContentStore.getState().regenerateContent(true);

    expect(fetchMock).not.toHaveBeenCalled();
  });

  /**
   * A model swap is exactly when the shape of what comes back changes, and it
   * is the class of failure CI cannot see: every one of these responses is a
   * well-formed HTTP 200 that the server called a success.
   */
  describe("unexpected model output", () => {
    it("keeps the prior bio when about comes back null", async () => {
      respondWith({
        success: true,
        content: { about: null, portfolio: null },
        failed_sections: [],
      });

      await useContentStore.getState().regenerateContent(true);

      expect(useContentStore.getState().bio).toEqual(BIO);
    });

    it("keeps the prior bio when the content key is missing entirely", async () => {
      respondWith({ success: true, failed_sections: [] });

      await useContentStore.getState().regenerateContent(true);

      expect(useContentStore.getState().bio).toEqual(BIO);
    });

    it("keeps the prior content when the response body is not JSON", async () => {
      respondWithUnparseableBody();

      await useContentStore.getState().regenerateContent(true);

      const state = useContentStore.getState();
      expect(state.bio).toEqual(BIO);
      expect(state.error).toBeNull();
      expect(state.regenerationError).toBeTruthy();
    });

    it("applies a longer generation than the site was written for", async () => {
      // Worth stating the limit of this one: the store has no size branch, so
      // it pins that nothing truncates or rejects on length, and nothing more.
      // Whether the page survives rendering it is a component-level question
      // this seam cannot see.
      const long = { about_text: "lore ".repeat(200) };
      respondWith({
        success: true,
        content: { about: long },
        failed_sections: [],
      });

      await useContentStore.getState().regenerateContent(true);

      const state = useContentStore.getState();
      expect(state.bio).toEqual(long);
      expect(state.regenerationError).toBeNull();
    });

    /**
     * The three below were `it.fails` until the gap closed. The markers are
     * gone because they had done their job: they reported the day the fix
     * landed, and leaving them would have asserted a bug that no longer
     * exists. The assertions themselves are unchanged.
     *
     * One cause for all three. The store guarded the applied content with `??`,
     * which only catches null and undefined. An empty object, an empty array
     * and a bare string are all non-nullish, so each one replaced the content
     * the visitor was reading -- a blank section from an HTTP 200 the server
     * called a success. Closed in two layers: the server refuses output that
     * is not the section it rewrites, so it is never reported as a success,
     * and the store validates each field is renderable before it replaces
     * what is on the page.
     *
     * Written up in documentation/evaluations/ai-regeneration-seam-coverage.md
     * (issue #105). If one of these starts failing again, that write-up is
     * where the reasoning lives.
     */
    it(
      "keeps the prior bio when about comes back as an empty object",
      async () => {
        respondWith({
          success: true,
          content: { about: {} },
          failed_sections: [],
        });

        await useContentStore.getState().regenerateContent(true);

        expect(useContentStore.getState().bio).toEqual(BIO);
      },
    );

    it(
      "keeps the prior experience when the list comes back empty",
      async () => {
        useContentStore.setState({ experience: [{ title: "Engineer" }] });
        respondWith({
          success: true,
          content: { portfolio: { experience: [] } },
          failed_sections: [],
        });

        await useContentStore.getState().regenerateContent(true);

        expect(useContentStore.getState().experience).toEqual([
          { title: "Engineer" },
        ]);
      },
    );

    it(
      "does not put a bare string where a bio object belongs",
      async () => {
        respondWith({
          success: true,
          content: { about: "a truncated sentence with no shape at all" },
          failed_sections: [],
        });

        await useContentStore.getState().regenerateContent(true);

        // Asserted as its two siblings are -- the prior bio intact, not merely
        // "not a string", which any other wrong non-object would also satisfy
        // while the visitor's bio was still gone.
        expect(useContentStore.getState().bio).toEqual(BIO);
      },
    );
  });

  /**
   * The paid endpoint refuses far more often than it errors: a per-IP cooldown
   * is the common response, not the exceptional one.
   *
   * Deliberately thin. That a refusal keeps the content and stays out of the
   * fatal `error` is already pinned above, and a cooldown reaches the store
   * through the same `!result.success` branch as any other refusal -- there is
   * no status-code or Retry-After handling to test, because there is none in
   * the store. Restating those here under a rate-limit name would inflate what
   * a reader thinks is covered. What is left is the part genuinely untested:
   * whether the visitor is told to wait or told to retry.
   */
  describe("cooldown and rate limits", () => {
    const RATE_LIMITED = {
      success: false,
      error: "Rate limit exceeded. Try again in 30 seconds.",
    };

    it("re-enables the button after a refusal", async () => {
      respondWith(RATE_LIMITED);

      await useContentStore.getState().regenerateContent(true);

      expect(useContentStore.getState().isRegenerating).toBe(false);
    });

    /**
     * Also formerly `it.fails`, and the one with the clearest cost. The store
     * threw `new Error(result.error)` -- carrying the server's "try again in
     * 30 seconds" -- and the catch discarded it for a fixed "Failed to
     * regenerate content. Please try again." So the one refusal the visitor
     * could act on was the one phrased as if retrying were the answer, which
     * is precisely what re-triggers the cooldown. Server refusals now reach
     * the visitor; unexpected exceptions still get the generic message.
     *
     * Same write-up: documentation/evaluations/ai-regeneration-seam-coverage.md
     */
    it(
      "tells the visitor it was a cooldown, not a generic failure",
      async () => {
        respondWith(RATE_LIMITED);

        await useContentStore.getState().regenerateContent(true);

        expect(useContentStore.getState().regenerationError).toMatch(
          /rate limit|cooldown|try again in/i,
        );
      },
    );
  });
});

/**
 * hasModifiedContent drives DISPEL ENCHANTMENT, which offers to revert a
 * modification. It used to be set on arrival at the success path, so it
 * answered "the request succeeded" while claiming to answer "your content
 * changed" -- the two things it exists to tell apart.
 *
 * The gap is reachable because the store validates sections itself: a
 * well-formed but wrongly-shaped section is refused here even though the
 * server rewrote it and reported success. When every section is refused,
 * nothing on the page changes and the reset button used to appear anyway.
 */
describe("hasModifiedContent reflects what was applied", () => {
  beforeEach(() => {
    seed();
    useContentStore.setState({ hasModifiedContent: false });
  });

  it("stays false when every section is refused by validation", async () => {
    // Shares no key with BIO, so the store declines to apply it.
    respondWith({ success: true, content: { about: { foo: 1 } } });

    await useContentStore.getState().regenerateContent(false);

    const s = useContentStore.getState();
    expect(s.bio).toEqual(BIO); // nothing on the page changed...
    expect(s.hasModifiedContent).toBe(false); // ...so nothing offers to revert
    expect(s.regenerationError).not.toBeNull(); // and the refusal is surfaced
  });

  it("becomes true when a section is actually applied", async () => {
    // The store assigns a validated section wholesale rather than merging, so
    // a realistic success carries the whole section -- the server restores the
    // fields the model is not allowed to author.
    respondWith({
      success: true,
      content: {
        about: { display_name: BIO.display_name, about_text: "rewritten" },
      },
    });

    await useContentStore.getState().regenerateContent(false);

    const s = useContentStore.getState();
    expect(s.bio).toEqual({ ...BIO, about_text: "rewritten" });
    expect(s.hasModifiedContent).toBe(true);
  });

  it("stays true after a later all-refused attempt", async () => {
    // A previous regeneration did apply, so the content on screen IS modified
    // and the reset button is still legitimate. One refused attempt afterwards
    // must not retract it.
    useContentStore.setState({ hasModifiedContent: true });
    respondWith({ success: true, content: { about: { foo: 1 } } });

    await useContentStore.getState().regenerateContent(false);

    expect(useContentStore.getState().hasModifiedContent).toBe(true);
  });
});
