import { create } from "zustand";
import site from "virtual:site-config";
import { API_URL } from "../config/api";
import { devtools } from "zustand/middleware";
import { BioData, Employment, Education, Skill, Project } from "../types";
import { TimelineData } from "../types/Timeline";
import { loadResumeData } from "../data/resume";
import { loadTimeline } from "../utils/timelineLoader";

// ===========================================
// TYPES
// ===========================================

interface ContentState {
  // Data
  bio: BioData | null;
  experience: Employment[];
  education: Education[];
  skills: Skill[];
  projects: Project[];
  timeline: TimelineData | null;

  // Original data for reset functionality
  originalBio: BioData | null;
  originalExperience: Employment[];
  originalEducation: Education[];

  // Loading states
  isLoading: boolean;
  isRegenerating: boolean;
  // Fatal: the page has no content to show. Drives the full-page error screen.
  error: string | null;
  // Transient: the page still has content, one regeneration just did not land.
  regenerationError: string | null;

  // Modification tracking
  hasModifiedContent: boolean;

  // The regenerate button's cooldown, as the server reported it (#196 M44).
  // Set only from server responses, so the page never starts a cooldown the
  // server didn't, and held here so it survives leaving the page.
  cooldownEndsAt: number | null;
  cooldownTotal: number;
  // The server refused a press for the daily cap, so no more presses this visit.
  dailyCapReached: boolean;
  // Whether this page load has asked /api/limits for the cooldown yet.
  limitsRequested: boolean;
}

interface ContentActions {
  // Data loading
  loadContent: () => Promise<void>;

  // Content regeneration
  regenerateContent: (useFantasy: boolean) => Promise<void>;

  // Read the cooldown from /api/limits, when no press has reported it
  syncCooldown: () => Promise<void>;

  // Restore the content captured at load, undoing a regeneration
  resetContent: () => void;
}

type ContentStore = ContentState & ContentActions;

// ===========================================
// INITIAL STATE
// ===========================================

const initialState: ContentState = {
  bio: null,
  experience: [],
  education: [],
  skills: [],
  projects: [],
  timeline: null,
  originalBio: null,
  originalExperience: [],
  originalEducation: [],
  isLoading: true,
  isRegenerating: false,
  error: null,
  regenerationError: null,
  hasModifiedContent: false,
  cooldownEndsAt: null,
  cooldownTotal: 0,
  dailyCapReached: false,
  limitsRequested: false,
};

// ===========================================
// API HELPERS
// ===========================================


// Just above the 60 s the API function is allowed (#195 M37), so the server
// always gets to answer first.
const REGEN_TIMEOUT_MS = 65_000;

/**
 * The cooldown a server response reports, as state this page can count down
 * from (#196 M44). `remaining` seconds from `from` starts or replaces the
 * countdown, 0 clears it, and anything else (no answer, metering down) leaves
 * it alone.
 */
const cooldownFrom = (
  remaining: unknown,
  total: unknown,
  from = Date.now(),
): Partial<ContentState> => {
  if (typeof remaining !== "number") return {};
  if (remaining <= 0) return { cooldownEndsAt: null };
  return {
    cooldownEndsAt: from + remaining * 1000,
    cooldownTotal: typeof total === "number" && total > 0 ? total : remaining,
  };
};

// ===========================================
// REGENERATED CONTENT VALIDATION
// ===========================================

/**
 * A regenerated section is only applied if it still resembles what it replaces.
 * Presence is not enough: `{}`, `[]` and a bare string are all non-nullish, so
 * a nullish guard alone let each of them overwrite the content a visitor was
 * reading -- a blank section from a response the server called a success, with
 * no error raised anywhere to notice it by.
 */
const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

// The bio keys the model never writes (api/index.py's _UNAUTHORED_KEYS). They
// are rendered into links, so the page keeps its own copy whatever comes back.
const UNAUTHORED_BIO_KEYS: ReadonlySet<string> = new Set(["email", "social_links"]);

/**
 * A rewritten bio merged over the one it rewrites, or undefined if it brings
 * nothing usable (#196 M16). The server fills in what a rewrite leaves out;
 * this is the page's own guard, built from the bio it has rather than a list
 * of text fields: only a non-empty string replaces a string. An object in
 * `about_text` turned the page into the 404 page.
 */
const mergeBio = (prior: BioData, incoming: unknown): BioData | undefined => {
  if (!isPlainObject(incoming)) return undefined;
  const accepted: Record<string, string> = {};
  for (const [key, value] of Object.entries(prior)) {
    if (UNAUTHORED_BIO_KEYS.has(key)) continue;
    const next = incoming[key];
    if (typeof value === "string" && typeof next === "string" && next.trim()) {
      accepted[key] = next;
    }
  }
  return Object.keys(accepted).length
    ? ({ ...prior, ...accepted } as BioData)
    : undefined;
};

// ===========================================
// STORE IMPLEMENTATION
// ===========================================

export const useContentStore = create<ContentStore>()(
  devtools(
    (set, get) => ({
      // Initial state
      ...initialState,

      // ===========================================
      // ACTIONS
      // ===========================================

      /**
       * Load all content from YAML files.
       * Called once on app initialization.
       */
      loadContent: async () => {
        try {
          set({ isLoading: true, error: null });

          const [data, timelineData] = await Promise.all([
            loadResumeData(),
            loadTimeline(),
          ]);

          set({
            bio: data.bio,
            experience: data.experience,
            education: data.education,
            skills: data.skills,
            projects: data.projects,
            timeline: timelineData,
            // Store originals for reset
            originalBio: data.bio,
            originalExperience: data.experience,
            originalEducation: data.education,
            isLoading: false,
          });
        } catch (error) {
          console.error("Failed to load content:", error);
          set({
            error: "Failed to load content. Please refresh the page.",
            isLoading: false,
          });
        }
      },

      /**
       * Regenerate content using the AI API.
       *
       * @param useFantasy - Whether to use fantasy/LOTR style
       */
      regenerateContent: async (useFantasy: boolean) => {
        const state = get();

        // A press that cannot do anything has to say so. Both branches below
        // used to share one bare return, which made the whole action a silent
        // no-op: no request, no message, no state change, and nothing on screen
        // that distinguishes it from the button being broken.
        //
        // They are separated because only one of them is actually silent. There
        // is no content to rewrite yet, and nothing else on the page says so.
        if (!state.bio) {
          set({
            regenerationError:
              "Still loading the page content. Give it a second and press again.",
          });
          return;
        }

        // Already in flight, and this one is visible without a message: the
        // button reads "Weaving Epic Saga...", is disabled, and is running the
        // casting animation. A same-tick double tap still arrives here, since
        // `disabled` only applies from the next render -- but the press it
        // duplicates is one the visitor can watch. Saying anything here would
        // report an error for a button that is working.
        if (state.isRegenerating) {
          return;
        }

        // The one gate on a press while the server would refuse it (#196 M44).
        // The button only shows this: it is counting down or reads "Daily limit
        // reached", so here too nothing more needs saying.
        if (
          state.dailyCapReached ||
          (state.cooldownEndsAt !== null && state.cooldownEndsAt > Date.now())
        ) {
          return;
        }

        const bio = state.bio;
        const pressedAt = Date.now();
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), REGEN_TIMEOUT_MS);

        try {
          set({ isRegenerating: true, regenerationError: null });

          // One click is one request. Sending a request per section raced them
          // against each other through the server's per-IP cooldown, so the
          // second was rejected and the whole regeneration was discarded.
          const response = await fetch(`${API_URL}/api/regenerate`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
            },
            mode: "cors",
            credentials: "include",
            signal: controller.signal,
            body: JSON.stringify({
              // Only the section the page shows. The server meters every
              // section sent, so the unseen portfolio cost a second slot of
              // the visitor's daily cap, and the press waited for it (#190 M07).
              sections: { about: bio },
              use_fantasy: useFantasy,
            }),
          });

          const result = await response.json();

          // A refusal says how long the cooldown has left. A press that ran
          // reports the one it started when it arrived, so that's counted from
          // the press, not from this reply (#196 M44).
          const cooldown =
            typeof result.cooldown_remaining === "number"
              ? cooldownFrom(result.cooldown_remaining, result.cooldown_total)
              : cooldownFrom(
                  result.cooldown_total,
                  result.cooldown_total,
                  pressedAt,
                );

          if (!result.success) {
            // The server's refusals are written for a visitor and are the only
            // ones they can act on -- a cooldown says how long to wait. The
            // generic message told them to retry, which is exactly what
            // re-triggers the cooldown.
            //
            // The daily cap keeps the button off until a reload.
            const dailyCap = result.limit === "daily";
            set({
              regenerationError:
                // A deployment with no key, or with it off in site.yaml
                // (#189 M21): say which button, not how the server is set up.
                result.code === "regeneration_disabled"
                  ? `${site.regenerate.labels.button} isn't set up on this site.`
                  : typeof result.error === "string" && result.error
                    ? result.error
                    : "Failed to regenerate content. Please try again.",
              isRegenerating: false,
              ...cooldown,
              ...(dailyCap && { dailyCapReached: true }),
            });
            return;
          }

          // Apply what came back, but only where it still has the shape this UI
          // renders. `??` alone accepted any non-nullish value, so an empty
          // object, an empty array or a bare string replaced what the visitor
          // was reading -- a blank section arriving from an HTTP 200 the server
          // called a success, with no error raised anywhere to notice it by.
          // Only `about` is sent, so only `about` is read: anything else in
          // the reply isn't this press's. A press that applied nothing failed,
          // whatever the reply says about itself: missing, refused by the
          // validation above, or named in failed_sections, keep what was there
          // and say so.
          const about = mergeBio(bio, result.content?.about);
          const failed = about === undefined;

          // The flag claims "your content was modified", and the reset button
          // offers to undo that. Reaching the success path is a different
          // claim: the section can be refused by the validation above, in
          // which case `about` is undefined, the `??` fallback below
          // deliberately keeps what was already on screen, and nothing
          // changed. Deriving the flag from what was applied rather
          // than from where we arrived stops the UI offering to revert a
          // modification that never happened.
          //
          // Sticky, because a previous regeneration that did apply is still
          // modified content: one later all-refused attempt must not retract
          // it and hide a reset the visitor can still legitimately use.
          set({
            bio: about ?? bio,
            hasModifiedContent: state.hasModifiedContent || Boolean(about),
            isRegenerating: false,
            regenerationError: failed
              ? "That one didn't come through. Press it again."
              : null,
            ...cooldown,
          });

          // Legacy components still listen for this instead of reading the
          // store. Only announce a section that actually came back -- these
          // listeners assign the payload straight into their own state, so
          // announcing an absent section would blank the content the set()
          // above just deliberately preserved. For the same reason they are
          // handed the validated value: a shape the store refused would
          // otherwise blank these listeners by the back door.
          if (about) {
            window.dispatchEvent(
              new CustomEvent("contentRegenerated", {
                detail: {
                  section: "about",
                  content: about,
                  use_fantasy: useFantasy,
                },
              }),
            );
          }
        } catch (error) {
          const timedOut = controller.signal.aborted;
          if (!timedOut) console.error("Regeneration failed:", error);
          set({
            regenerationError: timedOut
              ? "This is taking too long. Try again in a minute."
              : "Failed to regenerate content. Please try again.",
            isRegenerating: false,
          });
          // No answer to read the cooldown from, though the server may well
          // have started one, so ask for it.
          void get().syncCooldown();
        } finally {
          clearTimeout(timeout);
        }
      },

      syncCooldown: async () => {
        const before = get().cooldownEndsAt;
        set({ limitsRequested: true });
        try {
          const response = await fetch(`${API_URL}/api/limits`, {
            headers: { Accept: "application/json" },
          });
          const limits = await response.json();
          // A press answered while this was in flight knows better.
          if (get().cooldownEndsAt !== before) return;
          set(cooldownFrom(limits.cooldown_remaining, limits.cooldown_total));
        } catch {
          // Nothing to read it from: the button keeps whatever it had.
        }
      },

      /**
       * Restore the content captured at load, undoing a regeneration.
       *
       * Restores from the originals already held in the store rather than
       * re-reading them. The re-read ran behind the same `isLoading` flag the
       * first page load uses, and the page renders a loading skeleton whenever
       * that flag is set -- so undoing a regeneration replaced the entire page,
       * header and nav and the button that was just clicked included, in order
       * to fetch files whose contents were already in memory.
       *
       * Only the slices a regeneration could touch are restored: the bio, and
       * experience and education until #190's step 2 settles them (a press
       * sends only the bio now). Skills, projects and timeline are never
       * rewritten, so re-reading them was always a no-op.
       */
      resetContent: () => {
        const state = get();

        // Nothing was ever loaded, so there is nothing to restore. Writing the
        // empty originals here would blank the page rather than undo anything.
        if (!state.originalBio) {
          return;
        }

        const data = {
          bio: state.originalBio,
          experience: state.originalExperience,
          education: state.originalEducation,
        };

        set({
          bio: data.bio,
          experience: data.experience,
          education: data.education,
          hasModifiedContent: false,
          error: null,
          regenerationError: null,
        });

        // Dispatch events for legacy components
        window.dispatchEvent(
          new CustomEvent("contentRegenerated", {
            detail: {
              section: "about",
              content: data.bio,
              is_full_regeneration: true,
              use_fantasy: false,
            },
          }),
        );
        window.dispatchEvent(
          new CustomEvent("contentRegenerated", {
            detail: {
              section: "portfolio",
              content: {
                experience: data.experience,
                education: data.education,
              },
              is_full_regeneration: true,
              use_fantasy: false,
            },
          }),
        );
      },
    }),
    { name: "content-store", enabled: import.meta.env.DEV },
  ),
);

// ===========================================
// SELECTORS
// ===========================================

/**
 * Selector hooks for accessing specific parts of the store.
 * Using selectors prevents unnecessary re-renders.
 */

export const useBio = () => useContentStore((state) => state.bio);
export const useProjects = () => useContentStore((state) => state.projects);
export const useIsLoading = () => useContentStore((state) => state.isLoading);
export const useContentError = () => useContentStore((state) => state.error);
export const useRegenerationError = () =>
  useContentStore((state) => state.regenerationError);
export const useTimeline = () => useContentStore((state) => state.timeline);
