import { create } from "zustand";
import { persist, devtools, createJSONStorage } from "zustand/middleware";
import { applyTheme, type Theme } from "./theme";
import { NO_FEATURES, type Features } from "../config/features";

// ===========================================
// TYPES
// ===========================================

interface UIState {
  // Theme
  theme: Theme;

  // Mobile
  isMobileMenuOpen: boolean;

  // What this deployment serves (GET /api/features). Not persisted: each
  // visit asks again.
  features: Features;
}

interface UIActions {
  // Theme
  setTheme: (theme: Theme) => void;

  // Mobile
  toggleMobileMenu: () => void;
  closeMobileMenu: () => void;

  setFeatures: (features: Features) => void;
}

type UIStore = UIState & UIActions;

// ===========================================
// INITIAL STATE
// ===========================================

const initialState: UIState = {
  theme: "light", // Default to light as per user preference
  isMobileMenuOpen: false,
  features: NO_FEATURES,
};

// ===========================================
// STORE IMPLEMENTATION
// ===========================================

export const useUIStore = create<UIStore>()(
  devtools(
    persist(
      (set) => ({
        // Initial state
        ...initialState,

        // ===========================================
        // THEME ACTIONS
        // ===========================================

        /**
         * Set the theme preference.
         */
        setTheme: (theme: Theme) => {
          // Applied before it's stored: a storage write that throws (a full
          // quota, say) mustn't leave the page and the toggle disagreeing.
          applyTheme(theme);
          set({ theme });
        },

        // ===========================================
        // MOBILE ACTIONS
        // ===========================================

        /**
         * Toggle mobile menu visibility.
         */
        toggleMobileMenu: () => {
          set((state) => ({ isMobileMenuOpen: !state.isMobileMenuOpen }));
        },

        /**
         * Close mobile menu.
         */
        closeMobileMenu: () => {
          set({ isMobileMenuOpen: false });
        },

        setFeatures: (features: Features) => {
          set({ features });
        },
      }),
      {
        name: "ui-storage",
        // A null localStorage (Firefox with storage turned off) counts as
        // unavailable, like one that throws, so the store runs in memory. Then
        // useUIStore.persist is undefined: nothing may call rehydrate() at
        // startup.
        storage: createJSONStorage(() => {
          if (!window.localStorage) throw new Error("localStorage is unavailable");
          return window.localStorage;
        }),
        // Only persist theme preference
        partialize: (state) => ({ theme: state.theme }),
      },
    ),
    { name: "ui-store", enabled: import.meta.env.DEV },
  ),
);

// ===========================================
// SELECTORS
// ===========================================

export const useTheme = () => useUIStore((state) => state.theme);
export const useIsMobileMenuOpen = () =>
  useUIStore((state) => state.isMobileMenuOpen);
