import { describe, it, expect, beforeEach } from "vitest";
import { useUIStore } from "./uiStore";

describe("uiStore", () => {
  beforeEach(() => {
    // Reset store to initial state before each test
    useUIStore.setState({
      theme: "light",
      isMobileMenuOpen: false,
    });
  });

  describe("Theme", () => {
    it("starts with light theme by default", () => {
      expect(useUIStore.getState().theme).toBe("light");
    });

    it("setTheme updates the theme", () => {
      const { setTheme } = useUIStore.getState();

      setTheme("dark");

      expect(useUIStore.getState().theme).toBe("dark");
    });

    it("setTheme can set to system preference", () => {
      const { setTheme } = useUIStore.getState();

      setTheme("system");

      expect(useUIStore.getState().theme).toBe("system");
    });
  });

  describe("Mobile Menu", () => {
    it("starts with mobile menu closed", () => {
      expect(useUIStore.getState().isMobileMenuOpen).toBe(false);
    });

    it("toggleMobileMenu opens the menu when closed", () => {
      const { toggleMobileMenu } = useUIStore.getState();

      toggleMobileMenu();

      expect(useUIStore.getState().isMobileMenuOpen).toBe(true);
    });

    it("toggleMobileMenu closes the menu when open", () => {
      useUIStore.setState({ isMobileMenuOpen: true });
      const { toggleMobileMenu } = useUIStore.getState();

      toggleMobileMenu();

      expect(useUIStore.getState().isMobileMenuOpen).toBe(false);
    });

    it("closeMobileMenu closes the menu", () => {
      useUIStore.setState({ isMobileMenuOpen: true });
      const { closeMobileMenu } = useUIStore.getState();

      closeMobileMenu();

      expect(useUIStore.getState().isMobileMenuOpen).toBe(false);
    });
  });
});
