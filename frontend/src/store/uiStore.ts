import { create } from "zustand";
import { persist, devtools } from "zustand/middleware";

// ===========================================
// TYPES
// ===========================================

type Theme = "light" | "dark" | "system";

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

          // Apply theme to document
          const root = document.documentElement;
          if (theme === "dark") {
            root.classList.add("dark");
          } else if (theme === "light") {
            root.classList.remove("dark");
          } else {
            // System preference
            const prefersDark = window.matchMedia(
              "(prefers-color-scheme: dark)",
            ).matches;
            root.classList.toggle("dark", prefersDark);
          }
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
