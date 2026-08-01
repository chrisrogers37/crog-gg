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

  // Reset to original
  resetContent: () => Promise<void>;

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

        // Don't regenerate if no content or already regenerating
        if (!state.bio || state.isRegenerating) {
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
            throw new Error(result.error || "Failed to regenerate content");
          }

          // Apply whatever came back. A section the server could not rewrite is
          // named in failed_sections and simply keeps the content it had, so a
          // partial failure never discards the sections that did succeed.
          const about = result.content?.about;
          const portfolio = result.content?.portfolio;
          const anyFailed = (result.failed_sections ?? []).length > 0;

          set({
            bio: about ?? state.bio,
            experience: portfolio?.experience ?? state.experience,
            education: portfolio?.education ?? state.education,
            hasModifiedContent: true,
            isRegenerating: false,
            regenerationError: anyFailed
              ? "Some of that didn't come through. Press it again for the rest."
              : null,
          });

          // Legacy components still listen for this instead of reading the
          // store. Only announce a section that actually came back -- these
          // listeners assign the payload straight into their own state, so
          // announcing an absent section would blank the content the set()
          // above just deliberately preserved.
          const announce = (section: string, content: unknown) => {
            if (content === undefined) return;
            window.dispatchEvent(
              new CustomEvent("contentRegenerated", {
                detail: { section, content, use_fantasy: useFantasy },
              }),
            );
          };
          announce("about", about);
          announce("portfolio", portfolio);
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
       * Reset content to original values from YAML files.
       */
      resetContent: async () => {
        try {
          set({ isLoading: true });

          const data = await loadResumeData();

          set({
            bio: data.bio,
            experience: data.experience,
            education: data.education,
            skills: data.skills,
            projects: data.projects,
            hasModifiedContent: false,
            error: null,
            regenerationError: null,
            isLoading: false,
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
        } catch (error) {
          console.error("Reset failed:", error);
          set({
            error: "Failed to reset content. Please refresh the page.",
            isLoading: false,
          });
        }
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
