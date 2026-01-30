import { describe, it, expect, beforeEach } from 'vitest';
import { useUIStore } from './uiStore';

describe('uiStore', () => {
  beforeEach(() => {
    // Reset store to initial state before each test
    useUIStore.setState({
      activeSection: '',
      theme: 'light',
      isMobileMenuOpen: false,
    });
  });

  describe('Section Navigation', () => {
    it('setActiveSection updates the active section', () => {
      const { setActiveSection } = useUIStore.getState();

      setActiveSection('about');

      expect(useUIStore.getState().activeSection).toBe('about');
    });

    it('toggleSection opens a section when none is active', () => {
      const { toggleSection } = useUIStore.getState();

      toggleSection('experience');

      expect(useUIStore.getState().activeSection).toBe('experience');
    });

    it('toggleSection closes the section when already active', () => {
      useUIStore.setState({ activeSection: 'experience' });
      const { toggleSection } = useUIStore.getState();

      toggleSection('experience');

      expect(useUIStore.getState().activeSection).toBe('');
    });

    it('toggleSection switches to a new section', () => {
      useUIStore.setState({ activeSection: 'about' });
      const { toggleSection } = useUIStore.getState();

      toggleSection('experience');

      expect(useUIStore.getState().activeSection).toBe('experience');
    });

    it('clearActiveSection clears the active section', () => {
      useUIStore.setState({ activeSection: 'about' });
      const { clearActiveSection } = useUIStore.getState();

      clearActiveSection();

      expect(useUIStore.getState().activeSection).toBe('');
    });
  });

  describe('Theme', () => {
    it('starts with light theme by default', () => {
      expect(useUIStore.getState().theme).toBe('light');
    });

    it('setTheme updates the theme', () => {
      const { setTheme } = useUIStore.getState();

      setTheme('dark');

      expect(useUIStore.getState().theme).toBe('dark');
    });

    it('setTheme can set to system preference', () => {
      const { setTheme } = useUIStore.getState();

      setTheme('system');

      expect(useUIStore.getState().theme).toBe('system');
    });
  });

  describe('Mobile Menu', () => {
    it('starts with mobile menu closed', () => {
      expect(useUIStore.getState().isMobileMenuOpen).toBe(false);
    });

    it('toggleMobileMenu opens the menu when closed', () => {
      const { toggleMobileMenu } = useUIStore.getState();

      toggleMobileMenu();

      expect(useUIStore.getState().isMobileMenuOpen).toBe(true);
    });

    it('toggleMobileMenu closes the menu when open', () => {
      useUIStore.setState({ isMobileMenuOpen: true });
      const { toggleMobileMenu } = useUIStore.getState();

      toggleMobileMenu();

      expect(useUIStore.getState().isMobileMenuOpen).toBe(false);
    });

    it('closeMobileMenu closes the menu', () => {
      useUIStore.setState({ isMobileMenuOpen: true });
      const { closeMobileMenu } = useUIStore.getState();

      closeMobileMenu();

      expect(useUIStore.getState().isMobileMenuOpen).toBe(false);
    });
  });
});
