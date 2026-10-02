import { create } from "zustand";
import { persist, devtools } from "zustand/middleware";
import { applyTheme, type Theme } from "./theme";

// ===========================================
// TYPES
// ===========================================

interface UIState {
  // Theme
  theme: Theme;

  // Mobile
  isMobileMenuOpen: boolean;
}

interface UIActions {
  // Theme
  setTheme: (theme: Theme) => void;

  // Mobile
  toggleMobileMenu: () => void;
  closeMobileMenu: () => void;
}

type UIStore = UIState & UIActions;

// ===========================================
// INITIAL STATE
// ===========================================

const initialState: UIState = {
  theme: "light", // Default to light as per user preference
  isMobileMenuOpen: false,
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
          set({ theme });
          applyTheme(theme);
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
      }),
      {
        name: "ui-storage",
        // Only persist theme preference
        partialize: (state) => ({ theme: state.theme }),
      },
    ),
    { name: "ui-store" },
  ),
);

// ===========================================
// SELECTORS
// ===========================================

export const useTheme = () => useUIStore((state) => state.theme);
export const useIsMobileMenuOpen = () =>
  useUIStore((state) => state.isMobileMenuOpen);
