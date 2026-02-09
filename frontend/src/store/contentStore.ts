import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { BioData, Employment, Education, Skill, Project } from "../types";
import { loadResumeData } from "../data/resume";

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

  // Original data for reset functionality
  originalBio: BioData | null;
  originalExperience: Employment[];
  originalEducation: Education[];

  // Loading states
  isLoading: boolean;
  isRegenerating: boolean;
  error: string | null;

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

  // Clear error
  clearError: () => void;

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
  originalBio: null,
  originalExperience: [],
  originalEducation: [],
  isLoading: true,
  isRegenerating: false,
  error: null,
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

          const data = await loadResumeData();

          set({
            bio: data.bio,
            experience: data.experience,
            education: data.education,
            skills: data.skills,
            projects: data.projects,
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
          set({ isRegenerating: true, error: null });

          // Regenerate about and portfolio sections
          const sectionsToRegenerate = ["about", "portfolio"];
          const regenerationPromises = sectionsToRegenerate.map((section) =>
            fetch(`${API_URL}/api/regenerate`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
              },
              mode: "cors",
              credentials: "include",
              body: JSON.stringify({
                section,
                content:
                  section === "about"
                    ? state.bio
                    : {
                        experience: state.experience,
                        education: state.education,
                      },
                is_full_regeneration: true,
                use_fantasy: useFantasy,
              }),
            }),
          );

          const responses = await Promise.all(regenerationPromises);
          const results = await Promise.all(responses.map((r) => r.json()));

          if (results.every((result) => result.success)) {
            // Update state with regenerated content
            const aboutResult = results[0];
            const portfolioResult = results[1];

            set({
              bio: aboutResult.content || state.bio,
              experience:
                portfolioResult.content?.experience || state.experience,
              education: portfolioResult.content?.education || state.education,
              hasModifiedContent: true,
              isRegenerating: false,
            });

            // Dispatch events for legacy components that still use CustomEvent
            window.dispatchEvent(
              new CustomEvent("contentRegenerated", {
                detail: {
                  section: "about",
                  content: aboutResult.content,
                  is_full_regeneration: true,
                  use_fantasy: useFantasy,
                },
              }),
            );
            window.dispatchEvent(
              new CustomEvent("contentRegenerated", {
                detail: {
                  section: "portfolio",
                  content: portfolioResult.content,
                  is_full_regeneration: true,
                  use_fantasy: useFantasy,
                },
              }),
            );
          } else {
            throw new Error("Failed to regenerate some content");
          }
        } catch (error) {
          console.error("Regeneration failed:", error);
          set({
            error: "Failed to regenerate content. Please try again.",
            isRegenerating: false,
          });
        } finally {
          // Ensure isRegenerating is set to false after a delay
          setTimeout(() => {
            set({ isRegenerating: false });
          }, 1000);
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
      clearError: () => {
        set({ error: null });
      },

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
export const useHasModifiedContent = () =>
  useContentStore((state) => state.hasModifiedContent);
