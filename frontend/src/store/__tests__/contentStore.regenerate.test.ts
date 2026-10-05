import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import site from "virtual:site-config";
import { useContentStore } from "../contentStore";
import { makeBio } from "../../test/builders";

/**
 * Regeneration is one request per click.
 *
 * It used to be one request per section fired concurrently, which raced the
 * siblings through the server's per-IP cooldown: the loser got a 429, the
 * client required every response to succeed, and the whole regeneration was
 * discarded -- including the section that had worked.
 *
 * These tests pin what came out of that: one click is one request, and a
 * failure never lands in `error`, which drives the home page's full-page fatal
 * screen and unmounts a page that still has content to show.
 */

const BIO = makeBio({
  display_name: "Christopher Rogers",
  about_text: "original",
});
const realFetch = globalThis.fetch;

// The server's real cooldown refusal (api/index.py), sent with a 429.
const ON_COOLDOWN = {
  success: false,
  error: "ability on cooldown",
  cooldown_remaining: 12,
  cooldown_total: 30,
};

const seed = () =>
  useContentStore.setState({
    bio: BIO,
    isRegenerating: false,
    loads: { bio: "ready", timeline: "ready", projects: "ready" },
    regenerationError: null,
    cooldownEndsAt: null,
    cooldownTotal: 0,
    dailyCapReached: false,
    limitsRequested: false,
  });

const respondWith = (body: unknown, status = 200) => {
  const mock = vi
    .fn()
    .mockResolvedValue({ status, ok: status < 400, json: async () => body });
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

describe("regenerateContent", () => {
  beforeEach(seed);
  afterEach(() => {
    globalThis.fetch = realFetch;
    vi.restoreAllMocks();
  });

  it("sends exactly one request, carrying only the section the page shows (#190 M07)", async () => {
    const fetchMock = respondWith({
      success: true,
      content: { about: { about_text: "rewritten" } },
      failed_sections: [],
    });

    await useContentStore.getState().regenerateContent(true);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(Object.keys(body.sections)).toEqual(["about"]);
  });

  it("ignores a failure named for a section it never sent", async () => {
    respondWith({
      success: true,
      content: { about: { about_text: "rewritten" } },
      failed_sections: ["notes"],
    });

    await useContentStore.getState().regenerateContent(true);

    const state = useContentStore.getState();
    expect(state.bio?.about_text).toBe("rewritten");
    expect(state.regenerationError).toBeNull();
  });

  it("changes nothing for a reply that only carries a section it never sent", async () => {
    useContentStore.setState({ hasModifiedContent: false });
    respondWith({
      success: true,
      content: { notes: { text: "Rewritten" } },
      failed_sections: ["about"],
    });

    await useContentStore.getState().regenerateContent(true);

    const state = useContentStore.getState();
    expect(state.bio).toEqual(BIO);
    expect(state).not.toHaveProperty("notes");
    expect(state.hasModifiedContent).toBe(false);
    expect(state.regenerationError).toBe("that one didn't come through. press it again.");
  });

  it("keeps the about when its section failed, and says so", async () => {
    respondWith({ success: true, content: {}, failed_sections: ["about"] });

    await useContentStore.getState().regenerateContent(true);

    expect(useContentStore.getState().bio).toEqual(BIO);
    // The press reached the success path and said so, rather than throwing.
    expect(useContentStore.getState().regenerationError).toBe("that one didn't come through. press it again.");
  });

  it("says so when a success reply carries no about at all", async () => {
    // A 200 that names no failure but applies nothing is still a failed press.
    respondWith({ success: true, content: {}, failed_sections: [] });

    await useContentStore.getState().regenerateContent(true);

    expect(useContentStore.getState().bio).toEqual(BIO);
    expect(useContentStore.getState().regenerationError).toBe("that one didn't come through. press it again.");
  });

  it("applies a good rewrite even if failed_sections is malformed", async () => {
    respondWith({
      success: true,
      content: { about: { about_text: "rewritten" } },
      failed_sections: 5,
    });

    await useContentStore.getState().regenerateContent(true);

    expect(useContentStore.getState().bio?.about_text).toBe("rewritten");
    expect(useContentStore.getState().regenerationError).toBeNull();
  });

  it("applies the rewritten about, and nothing else the reply carries", async () => {
    respondWith({
      success: true,
      content: {
        about: { about_text: "rewritten" },
        notes: { text: "Rewritten" },
      },
      failed_sections: [],
    });

    await useContentStore.getState().regenerateContent(true);

    expect(useContentStore.getState().bio).toEqual({ ...BIO, about_text: "rewritten" });
    expect(useContentStore.getState()).not.toHaveProperty("notes");
  });

  it("does not set the fatal error on a failed regeneration", async () => {
    // The white-screen regression: a failed bio load drives the home page's
    // full-page error screen, so putting a transient failure there unmounted
    // a working page.
    respondWith({ success: false, error: "nope" });

    await useContentStore.getState().regenerateContent(true);

    const state = useContentStore.getState();
    expect(state.loads.bio).toBe("ready");
    expect(state.regenerationError).toBeTruthy();
    expect(state.bio).toEqual(BIO);
  });

  it("does not set the fatal error when the request itself throws", async () => {
    globalThis.fetch = vi
      .fn()
      .mockRejectedValue(new Error("offline")) as unknown as typeof fetch;

    await useContentStore.getState().regenerateContent(true);

    expect(useContentStore.getState().loads.bio).toBe("ready");
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

    it("reports nothing, because the press it duplicates is visibly running", async () => {
      // The two halves of the old guard clause need OPPOSITE treatment, which
      // is why they are no longer one condition. This one is already legible
      // without a message: the button is disabled, reads "Weaving Epic Saga..."
      // and is running its casting animation. A message here would report an
      // error for a button that is working.
      respondWith({
        success: true,
        content: { about: { about_text: "rewritten" } },
        failed_sections: [],
      });

      const first = useContentStore.getState().regenerateContent(true);
      const second = useContentStore.getState().regenerateContent(true);
      await Promise.all([first, second]);

      expect(useContentStore.getState().regenerationError).toBeNull();
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

  it("says why, instead of doing nothing in silence", async () => {
    // The silent no-op, and the only branch here that is genuinely invisible:
    // no request, no message, no state change, and nothing anywhere else on the
    // page that says content has not loaded. Indistinguishable from the button
    // being broken, which is what it was reported as.
    useContentStore.setState({ bio: null, regenerationError: null });
    respondWith({ success: true, content: {} });

    await useContentStore.getState().regenerateContent(true);

    const message = useContentStore.getState().regenerationError;
    expect(message).toBeTruthy();
    expect(message).toMatch(/loading/i);
    // Transient, not fatal: a failed bio load unmounts the page for a
    // full-screen retry screen, and there is nothing wrong with the page.
    expect(useContentStore.getState().loads.bio).toBe("ready");
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
        content: { about: null },
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
      expect(state.loads.bio).toBe("ready");
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
      expect(state.bio).toEqual({ ...BIO, ...long });
      expect(state.regenerationError).toBeNull();
    });

    /**
     * The two below were `it.fails` until the gap closed, with a third for
     * an empty experience list, which went when only `about` was sent
     * (#190). The markers are gone because they had done their job: they
     * reported the day the fix landed, and leaving them would have asserted
     * a bug that no longer exists. The assertions themselves are unchanged.
     *
     * One cause for all of them. The store guarded the applied content with `??`,
     * which only catches null and undefined. An empty object, an empty array
     * and a bare string are all non-nullish, so each one replaced the content
     * the visitor was reading -- a blank section from an HTTP 200 the server
     * called a success. Closed in two layers: the server refuses output that
     * is not the section it rewrites, so it is never reported as a success,
     * and the store validates each field is renderable before it replaces
     * what is on the page.
     *
     * Written up in documentation/archive/evaluations/ai-regeneration-seam-coverage.md
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
      "does not put a bare string where a bio object belongs",
      async () => {
        respondWith({
          success: true,
          content: { about: "a truncated sentence with no shape at all" },
          failed_sections: [],
        });

        await useContentStore.getState().regenerateContent(true);

        // Asserted as its sibling is -- the prior bio intact, not merely
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
   * That a refusal keeps the content and stays out of the fatal `error` is
   * already pinned above. The countdown a refusal starts is pinned in its own
   * block below. What is left here is whether the visitor is told to wait or
   * told to retry.
   */
  describe("cooldown and rate limits", () => {
    it("re-enables the button after a refusal", async () => {
      respondWith(ON_COOLDOWN, 429);

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
     * Same write-up: documentation/archive/evaluations/ai-regeneration-seam-coverage.md
     */
    it(
      "tells the visitor it was a cooldown, not a generic failure",
      async () => {
        respondWith(ON_COOLDOWN, 429);

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
 * server rewrote it and reported success. When the section is refused,
 * nothing on the page changes and the reset button used to appear anyway.
 */
describe("hasModifiedContent reflects what was applied", () => {
  beforeEach(() => {
    seed();
    useContentStore.setState({ hasModifiedContent: false });
  });

  it("stays false when the section is refused by validation", async () => {
    // Shares no key with BIO, so the store declines to apply it.
    respondWith({ success: true, content: { about: { foo: 1 } } });

    await useContentStore.getState().regenerateContent(false);

    const s = useContentStore.getState();
    expect(s.bio).toEqual(BIO); // nothing on the page changed...
    expect(s.hasModifiedContent).toBe(false); // ...so nothing offers to revert
    expect(s.regenerationError).not.toBeNull(); // and the refusal is surfaced
  });

  it("becomes true when a section is actually applied", async () => {
    respondWith({
      success: true,
      content: { about: { about_text: "rewritten" } },
    });

    await useContentStore.getState().regenerateContent(false);

    const s = useContentStore.getState();
    expect(s.bio).toEqual({ ...BIO, about_text: "rewritten" });
    expect(s.hasModifiedContent).toBe(true);
  });

  it("stays true after a later refused attempt", async () => {
    // A previous regeneration did apply, so the content on screen IS modified
    // and the reset button is still legitimate. One refused attempt afterwards
    // must not retract it.
    useContentStore.setState({ hasModifiedContent: true });
    respondWith({ success: true, content: { about: { foo: 1 } } });

    await useContentStore.getState().regenerateContent(false);

    expect(useContentStore.getState().hasModifiedContent).toBe(true);
  });
});


/**
 * A rewrite is often partial, and the store used to take it whole: a one-field
 * `about` erased every field it left out (#196 M16). It's merged over the bio
 * now, taking only non-empty strings for the fields the page shows.
 */
describe("a rewritten bio is merged, not swapped in", () => {
  const FULL = makeBio({
    display_name: "Christopher Rogers",
    tagline: "i build things that build things",
    location: "Brooklyn",
    about_text: "original",
  });

  beforeEach(() => {
    seed();
    useContentStore.setState({ bio: FULL });
  });
  afterEach(() => {
    globalThis.fetch = realFetch;
  });

  it("keeps the fields a one-field rewrite leaves out", async () => {
    respondWith({ success: true, content: { about: { about_text: "lore" } } });

    await useContentStore.getState().regenerateContent(true);

    expect(useContentStore.getState().bio).toEqual({ ...FULL, about_text: "lore" });
  });

  it("ignores a non-string field and the fields the bio doesn't have", async () => {
    respondWith({
      success: true,
      content: {
        about: {
          about_text: { nested: "an object here turned / into the 404 page" },
          tagline: "a new tagline",
          email: "attacker@example.com",
        },
      },
    });

    await useContentStore.getState().regenerateContent(true);

    expect(useContentStore.getState().bio).toEqual({
      ...FULL,
      tagline: "a new tagline",
    });
  });

  it("refuses a rewrite with nothing usable in it", async () => {
    respondWith({ success: true, content: { about: { about_text: "   " } } });

    await useContentStore.getState().regenerateContent(true);

    const s = useContentStore.getState();
    expect(s.bio).toEqual(FULL);
    expect(s.regenerationError).not.toBeNull();
  });
});

/**
 * The cooldown follows the server (#196 M44). The button used to start its own
 * 30 s countdown on every press, whatever the server said, and forgot it when
 * the page unmounted. The store now sets it only from a server response.
 */
describe("the cooldown follows the server", () => {
  const NOW = 1_700_000_000_000;

  beforeEach(() => {
    seed();
    vi.spyOn(Date, "now").mockReturnValue(NOW);
  });
  afterEach(() => {
    globalThis.fetch = realFetch;
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  /** Requests answered by URL: a regenerate reply and a limits reply. */
  const respondByUrl = (
    regenerate: (init?: RequestInit) => Promise<unknown>,
    limits: unknown = { cooldown_remaining: 0, cooldown_total: 30 },
  ) => {
    const mock = vi.fn((url: string, init?: RequestInit) =>
      url.endsWith("/api/limits")
        ? Promise.resolve({ status: 200, ok: true, json: async () => limits })
        : regenerate(init),
    );
    globalThis.fetch = mock as unknown as typeof fetch;
    return mock;
  };

  it("starts the cooldown a successful press reports", async () => {
    respondWith({
      success: true,
      content: { about: { about_text: "lore" } },
      cooldown_total: 30,
    });

    await useContentStore.getState().regenerateContent(true);

    const s = useContentStore.getState();
    expect(s.cooldownEndsAt).toBe(NOW + 30_000);
    expect(s.cooldownTotal).toBe(30);
  });

  it("takes the time left from a cooldown refusal", async () => {
    respondWith(ON_COOLDOWN, 429);

    await useContentStore.getState().regenerateContent(true);

    const s = useContentStore.getState();
    expect(s.cooldownEndsAt).toBe(NOW + 12_000);
    expect(s.cooldownTotal).toBe(30);
    expect(s.dailyCapReached).toBe(false);
  });

  it("names the button when this deployment can't rewrite (#189 M21)", async () => {
    // No OpenAI key, or features.regenerate: off: the server's message says
    // how it's set up, which a visitor can't act on.
    respondWith(
      {
        success: false,
        code: "regeneration_disabled",
        error: "Regeneration isn't set up on this site",
      },
      503,
    );

    await useContentStore.getState().regenerateContent(true);

    expect(useContentStore.getState().regenerationError).toBe(
      `${site.regenerate.labels.button} isn't set up on this site.`,
    );
    // No countdown for a button that can't work.
    expect(useContentStore.getState().cooldownEndsAt).toBeNull();
  });

  it("keeps the button off after the daily cap", async () => {
    // The server's real daily-cap refusal: the cooldown was claimed first, so
    // one is running too.
    respondWith(
      {
        success: false,
        error: "daily limit reached",
        limit: "daily",
        message: "Max 30",
        cooldown_total: 30,
      },
      429,
    );

    await useContentStore.getState().regenerateContent(true);

    const s = useContentStore.getState();
    expect(s.dailyCapReached).toBe(true);
    expect(s.cooldownEndsAt).toBe(NOW + 30_000);
  });

  it("doesn't take another 429 for the daily cap", async () => {
    // An edge rate limit (a Vercel Firewall rule on /api/*, say) answers 429
    // without this API's fields. Only `limit` names the daily cap; reading any
    // bare 429 as it locked the button until a reload.
    respondWith({ error: "Too Many Requests" }, 429);

    await useContentStore.getState().regenerateContent(true);

    expect(useContentStore.getState().dailyCapReached).toBe(false);
  });

  it("is the one gate: no press goes out while the cooldown runs", async () => {
    const fetchMock = respondWith({ success: true, content: {} });
    useContentStore.setState({ cooldownEndsAt: NOW + 5_000, cooldownTotal: 30 });

    await useContentStore.getState().regenerateContent(true);

    expect(fetchMock).not.toHaveBeenCalled();
    expect(useContentStore.getState().isRegenerating).toBe(false);
  });

  it("is the one gate: no press goes out after the daily cap", async () => {
    const fetchMock = respondWith({ success: true, content: {} });
    useContentStore.setState({ dailyCapReached: true });

    await useContentStore.getState().regenerateContent(true);

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("starts the cooldown a failure after metering reports", async () => {
    respondWith(
      {
        success: false,
        error: "that one didn't come through. press it again.",
        failed_sections: ["about"],
        cooldown_total: 30,
      },
      500,
    );

    await useContentStore.getState().regenerateContent(true);

    expect(useContentStore.getState().cooldownEndsAt).toBe(NOW + 30_000);
  });

  it.each([
    [400, { success: false, error: "Invalid section: nope" }],
    [503, { success: false, error: "regeneration temporarily unavailable" }],
  ])("starts nothing on a %i", async (status, body) => {
    respondWith(body, status);

    await useContentStore.getState().regenerateContent(true);

    const s = useContentStore.getState();
    expect(s.cooldownEndsAt).toBeNull();
    expect(s.dailyCapReached).toBe(false);
  });

  it("asks /api/limits when a press gets no answer", async () => {
    const fetchMock = respondByUrl(() => Promise.reject(new TypeError("offline")), {
      cooldown_remaining: 20,
      cooldown_total: 30,
    });

    await useContentStore.getState().regenerateContent(true);
    await vi.waitFor(() =>
      expect(useContentStore.getState().cooldownEndsAt).toBe(NOW + 20_000),
    );

    const limitsCalls = fetchMock.mock.calls.filter(([url]) => url.endsWith("/api/limits"));
    expect(limitsCalls).toHaveLength(1);
  });

  it("gives up after 65 seconds, says so, and asks /api/limits (#195 M37)", async () => {
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
    const fetchMock = respondByUrl(
      (init) =>
        new Promise((_resolve, reject) => {
          init?.signal?.addEventListener("abort", () =>
            reject(new DOMException("The operation was aborted.", "AbortError")),
          );
        }),
    );

    const press = useContentStore.getState().regenerateContent(true);
    await vi.advanceTimersByTimeAsync(64_999);
    expect(useContentStore.getState().isRegenerating).toBe(true);
    await vi.advanceTimersByTimeAsync(1);
    await press;

    const s = useContentStore.getState();
    expect(s.regenerationError).toBe("this is taking too long. try again in a minute.");
    expect(s.isRegenerating).toBe(false);
    expect(fetchMock.mock.calls.some(([url]) => url.endsWith("/api/limits"))).toBe(true);
  });

  it("counts a press's cooldown from the press, not from the reply", async () => {
    // The server starts the cooldown when the press arrives, so 8 s spent on
    // the model calls are 8 s of it already gone.
    vi.spyOn(Date, "now").mockReturnValueOnce(NOW).mockReturnValue(NOW + 8_000);
    respondWith({
      success: true,
      content: { about: { about_text: "lore" } },
      cooldown_total: 30,
    });

    await useContentStore.getState().regenerateContent(true);

    expect(useContentStore.getState().cooldownEndsAt).toBe(NOW + 30_000);
  });

  it("reads /api/limits into the cooldown", async () => {
    respondWith({ cooldown_remaining: 7, cooldown_total: 30 });

    await useContentStore.getState().syncCooldown();

    const s = useContentStore.getState();
    expect(s.cooldownEndsAt).toBe(NOW + 7_000);
    expect(s.limitsRequested).toBe(true);
  });

  it("lets a press answered meanwhile win over a late /api/limits reply", async () => {
    let answer: (value: unknown) => void = () => {};
    globalThis.fetch = vi.fn(
      () => new Promise((resolve) => (answer = resolve)),
    ) as unknown as typeof fetch;

    const sync = useContentStore.getState().syncCooldown();
    useContentStore.setState({ cooldownEndsAt: NOW + 25_000 });
    answer({ json: async () => ({ cooldown_remaining: 0, cooldown_total: 30 }) });
    await sync;

    expect(useContentStore.getState().cooldownEndsAt).toBe(NOW + 25_000);
  });
});
