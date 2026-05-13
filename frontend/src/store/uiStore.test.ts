import { describe, it, expect, beforeEach } from "vitest";
import { useUIStore } from "./uiStore";

describe("uiStore", () => {
  beforeEach(() => {
    useUIStore.setState({
      activeSection: "hero",
      scrollProgress: 0,
      isMobileMenuOpen: false,
    });
  });

  describe("Section Navigation", () => {
    it("setActiveSection updates the active section", () => {
      const { setActiveSection } = useUIStore.getState();
      setActiveSection("about");
      expect(useUIStore.getState().activeSection).toBe("about");
    });

    it("setScrollProgress updates scroll progress", () => {
      const { setScrollProgress } = useUIStore.getState();
      setScrollProgress(0.5);
      expect(useUIStore.getState().scrollProgress).toBe(0.5);
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
