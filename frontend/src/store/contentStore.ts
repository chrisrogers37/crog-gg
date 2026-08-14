import { create } from "zustand";
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
}

interface ContentActions {
  // Data loading
  loadContent: () => Promise<void>;

  // Content regeneration
  regenerateContent: (useFantasy: boolean) => Promise<void>;

  // Restore the content captured at load, undoing a regeneration
  resetContent: () => void;

  // Update specific content (for compatibility with existing components)
  updateBio: (bio: BioData) => void;
  updateExperience: (experience: Employment[]) => void;
  updateEducation: (education: Education[]) => void;
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
};

// ===========================================
// API HELPERS
// ===========================================

const API_URL = import.meta.env.VITE_API_URL || "";

// ===========================================
// REGENERATED CONTENT VALIDATION
// ===========================================

/**
 * A regenerated section is only applied if it still resembles what it replaces.
 * Presence is not enough: `{}`, `[]` and a bare string are all non-nullish, so
 * a nullish guard alone let each of them overwrite the content a visitor was
 * reading -- a blank section from a response the server called a success, with
 * no error raised anywhere to notice it by.
 *
 * The bar is deliberately "recognisably the same thing", not "a complete
 * BioData". The server rewrites a section and restores only the fields the
 * model must not author, so a legitimate response is often partial; requiring
 * every required key of BioData would reject real rewrites, and does reject the
 * partial this store is already pinned to apply. Sharing a key with the value
 * being replaced separates a partial rewrite from an unrelated object, which a
 * non-empty check alone would wave through.
 */
const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const asBioData = (
  value: unknown,
  prior: BioData | null,
): BioData | undefined =>
  isPlainObject(value) &&
  (prior
    ? Object.keys(value).some((key) => key in prior)
    : Object.keys(value).length > 0)
    ? (value as unknown as BioData)
    : undefined;

/**
 * A non-empty list of objects, or undefined. An empty list is rejected rather
 * than applied: the model returning nothing to say is not a reason to erase
 * the experience or education a visitor was reading.
 */
const asPopulatedList = <T>(value: unknown): T[] | undefined =>
  Array.isArray(value) && value.length > 0 && value.every(isPlainObject)
    ? (value as T[])
    : undefined;

/** True when the server sent something for a section and validation refused it. */
const wasRejected = (received: unknown, accepted: unknown): boolean =>
  received !== undefined && accepted === undefined;

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
            body: JSON.stringify({
              sections: {
                about: state.bio,
                portfolio: {
                  experience: state.experience,
                  education: state.education,
                },
              },
              use_fantasy: useFantasy,
            }),
          });

          const result = await response.json();

          if (!result.success) {
            // The server's refusals are written for a visitor and are the only
            // ones they can act on -- a cooldown says how long to wait. The
            // generic message told them to retry, which is exactly what
            // re-triggers the cooldown.
            set({
              regenerationError:
                typeof result.error === "string" && result.error
                  ? result.error
                  : "Failed to regenerate content. Please try again.",
              isRegenerating: false,
            });
            return;
          }

          // Apply what came back, but only where it still has the shape this UI
          // renders. `??` alone accepted any non-nullish value, so an empty
          // object, an empty array or a bare string replaced what the visitor
          // was reading -- a blank section arriving from an HTTP 200 the server
          // called a success, with no error raised anywhere to notice it by.
          // A section that fails validation is treated exactly like one the
          // server named in failed_sections: keep what was there and say so.
          const about = asBioData(result.content?.about, state.bio);
          const portfolio = result.content?.portfolio;
          const experience = asPopulatedList<Employment>(portfolio?.experience);
          const education = asPopulatedList<Education>(portfolio?.education);

          const rejected =
            wasRejected(result.content?.about, about) ||
            wasRejected(portfolio?.experience, experience) ||
            wasRejected(portfolio?.education, education);
          const anyFailed =
            (result.failed_sections ?? []).length > 0 || rejected;

          // The flag claims "your content was modified", and the reset button
          // offers to undo that. Reaching the success path is a different
          // claim: every section can be refused by the validation above, in
          // which case about/experience/education are all undefined, the `??`
          // fallbacks below deliberately keep what was already on screen, and
          // nothing changed. Deriving the flag from what was applied rather
          // than from where we arrived stops the UI offering to revert a
          // modification that never happened.
          //
          // Sticky, because a previous regeneration that did apply is still
          // modified content: one later all-refused attempt must not retract
          // it and hide a reset the visitor can still legitimately use.
          const applied = Boolean(about || experience || education);

          set({
            bio: about ?? state.bio,
            experience: experience ?? state.experience,
            education: education ?? state.education,
            hasModifiedContent: state.hasModifiedContent || applied,
            isRegenerating: false,
            regenerationError: anyFailed
              ? "Some of that didn't come through. Press it again for the rest."
              : null,
          });

          // Legacy components still listen for this instead of reading the
          // store. Only announce a section that actually came back -- these
          // listeners assign the payload straight into their own state, so
          // announcing an absent section would blank the content the set()
          // above just deliberately preserved. For the same reason they are
          // handed the validated values: a shape the store refused would
          // otherwise blank these listeners by the back door.
          const announce = (section: string, content: unknown) => {
            if (content === undefined) return;
            window.dispatchEvent(
              new CustomEvent("contentRegenerated", {
                detail: { section, content, use_fantasy: useFantasy },
              }),
            );
          };
          announce("about", about);
          announce(
            "portfolio",
            experience || education
              ? {
                  ...(experience && { experience }),
                  ...(education && { education }),
                }
              : undefined,
          );
        } catch (error) {
          console.error("Regeneration failed:", error);
          set({
            regenerationError:
              "Failed to regenerate content. Please try again.",
            isRegenerating: false,
          });
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
       * Only the three sections a regeneration can touch are restored. Skills,
       * projects and timeline are never rewritten, so re-reading them was
       * always a no-op.
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

      /**
       * Clear the current error message.
       */
      /**
       * Update bio content directly.
       */
      updateBio: (bio: BioData) => {
        set({ bio, hasModifiedContent: true });
      },

      /**
       * Update experience content directly.
       */
      updateExperience: (experience: Employment[]) => {
        set({ experience, hasModifiedContent: true });
      },

      /**
       * Update education content directly.
       */
      updateEducation: (education: Education[]) => {
        set({ education, hasModifiedContent: true });
      },
    }),
    { name: "content-store" },
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
export const useExperience = () => useContentStore((state) => state.experience);
export const useEducation = () => useContentStore((state) => state.education);
export const useSkills = () => useContentStore((state) => state.skills);
export const useProjects = () => useContentStore((state) => state.projects);
export const useIsLoading = () => useContentStore((state) => state.isLoading);
export const useIsRegenerating = () =>
  useContentStore((state) => state.isRegenerating);
export const useContentError = () => useContentStore((state) => state.error);
export const useRegenerationError = () =>
  useContentStore((state) => state.regenerationError);
export const useHasModifiedContent = () =>
  useContentStore((state) => state.hasModifiedContent);
export const useTimeline = () => useContentStore((state) => state.timeline);
