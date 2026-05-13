import { create } from "zustand";
import { devtools } from "zustand/middleware";

interface UIState {
  activeSection: string;
  scrollProgress: number;
  isMobileMenuOpen: boolean;
}

interface UIActions {
  setActiveSection: (section: string) => void;
  setScrollProgress: (progress: number) => void;
  toggleMobileMenu: () => void;
  closeMobileMenu: () => void;
}

type UIStore = UIState & UIActions;

export const useUIStore = create<UIStore>()(
  devtools(
    (set) => ({
      activeSection: "hero",
      scrollProgress: 0,
      isMobileMenuOpen: false,

      setActiveSection: (section: string) => {
        set({ activeSection: section });
      },

      setScrollProgress: (progress: number) => {
        set({ scrollProgress: progress });
      },

      toggleMobileMenu: () => {
        set((state) => ({ isMobileMenuOpen: !state.isMobileMenuOpen }));
      },

      closeMobileMenu: () => {
        set({ isMobileMenuOpen: false });
      },
    }),
    { name: "ui-store" },
  ),
);

export const useActiveSection = () =>
  useUIStore((state) => state.activeSection);
export const useScrollProgress = () =>
  useUIStore((state) => state.scrollProgress);
export const useIsMobileMenuOpen = () =>
  useUIStore((state) => state.isMobileMenuOpen);
