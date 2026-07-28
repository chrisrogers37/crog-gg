import { useMemo, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

// Hooks
import { useRegeneration } from "../../hooks";
import {
  useUIStore,
  useIsLoading,
  useContentError,
  useBio,
  useTimeline,
} from "../../store";

// SEO
import { SEO, PersonSchema } from "../../components/SEO";

// Components
import About from "../../components/About";
import {
  Projects,
  Music,
  Timeline,
  ContactCTA,
} from "../../components/sections";
import SectionNav from "../../components/SectionNav";
import { SectionFadePreview } from "../../components/SectionFadePreview";
import { ActionButtons } from "../../components/ActionButtons";
import TypewriterLoop from "../../components/TypewriterLoop";
import { ThemeToggle } from "../../components/common/ThemeToggle";
import { ErrorBoundary } from "../../components/common/ErrorBoundary";
import { SectionNavigator } from "../../components/common/SectionNavigator";
import { ImageShowcase } from "../../components/common/ImageShowcase";
import { MobileMenu } from "../../components/layout/MobileMenu";

// Styles
import "../../App.css";
import "../../styles/transitions.css";
import "./HomePage.css";

/**
 * HomePage Component
 *
 * Main portfolio page using Zustand stores for state management.
 * Displays header, section navigation, content sections, and action buttons.
 */
// Profile photos for random selection
const PROFILE_PHOTOS = [
  "/profile-photos/photo-1.jpg",
  "/profile-photos/photo-2.jpg",
  "/profile-photos/photo-3.jpg",
  "/profile-photos/photo-4.jpg",
  "/profile-photos/photo-5.jpg",
];

// Section order for flow navigation
const SECTION_ORDER = ["about", "journey", "projects", "music"];

export function HomePage() {
  // Random profile photo (selected once on mount)
  const profilePhoto = useMemo(() => {
    const randomIndex = Math.floor(Math.random() * PROFILE_PHOTOS.length);
    return PROFILE_PHOTOS[randomIndex];
  }, []);

  // Get state from stores
  const isLoading = useIsLoading();
  const error = useContentError();
  const bio = useBio();
  const timeline = useTimeline();
  const activeSection = useUIStore((state) => state.activeSection);
  const setActiveSection = useUIStore((state) => state.setActiveSection);
  const toggleMobileMenu = useUIStore((state) => state.toggleMobileMenu);

  // Preview mode: starts true so About shows as a preview on load
  const [previewMode, setPreviewMode] = useState(true);

  // Default to "about" selected on mount
  useEffect(() => {
    if (!activeSection) {
      setActiveSection("about");
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Regeneration functionality with WoW-style cooldown
  const {
    regenerate,
    reset,
    isRegenerating,
    hasModifiedContent,
    cooldownRemaining,
    cooldownTotal,
    isReady,
  } = useRegeneration();

  // Handle section change from nav buttons
  const handleSectionChange = (section: string) => {
    if (section === activeSection) {
      // Clicking active section: return to about preview
      setActiveSection("about");
      setPreviewMode(true);
    } else {
      setActiveSection(section);
      setPreviewMode(false);
    }
  };

  // Handle "see more" click from preview
  const handlePreviewExpand = () => {
    setPreviewMode(false);
  };

  // Render section based on active selection
  const renderActiveSection = () => {
    let content: React.ReactNode;
    switch (activeSection) {
      case "about":
        content = (
          <section className="section-content about-section">
            <div className="about-content">
              <About onRegenerate={() => {}} content={bio ?? undefined} />
            </div>
          </section>
        );
        break;
      case "journey":
        content = <Timeline data={timeline} />;
        break;
      case "projects":
        content = <Projects />;
        break;
      case "music":
        content = <Music />;
        break;
      default:
        return null;
    }

    const currentIndex = SECTION_ORDER.indexOf(activeSection);
    const nextSection =
      currentIndex >= 0 && currentIndex < SECTION_ORDER.length - 1
        ? SECTION_ORDER[currentIndex + 1]
        : null;

    return (
      <ErrorBoundary key={activeSection} compact>
        {content}
        <SectionNavigator
          nextSection={nextSection}
          onNavigate={handleSectionChange}
        />
      </ErrorBoundary>
    );
  };

  // Loading skeleton - matches real layout dimensions to prevent CLS
  if (isLoading) {
    return (
      <div className="home-page">
        <header>
          <div className="header-content">
            <div className="skeleton-photo" />
            <div className="header-text">
              <div className="skeleton-line skeleton-name" />
              <div className="skeleton-line skeleton-tagline" />
            </div>
          </div>
        </header>
        <nav className="section-nav" aria-hidden="true">
          <div className="section-nav-container">
            {["about", "journey", "projects", "music"].map((id) => (
              <span key={id} className="section-nav-button skeleton-nav-btn">
                &nbsp;
              </span>
            ))}
          </div>
        </nav>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="home-page">
        <div className="error-message">{error}</div>
        <button onClick={() => window.location.reload()}>Retry</button>
      </div>
    );
  }

  return (
    <>
      <SEO
        description="Agentic AI builder. Creator of Claudlobby (open-source fleet compositor for Claude Code). Data platform lead at Artemis."
        url="/"
        type="profile"
      />
      <PersonSchema />
      <div className="home-page">
        <div className="home-theme-toggle">
          <ThemeToggle />
          <button
            className="home-hamburger"
            onClick={toggleMobileMenu}
            aria-label="Open menu"
          >
            <span className="home-hamburger-line" />
            <span className="home-hamburger-line" />
            <span className="home-hamburger-line" />
          </button>
        </div>
        {/* Header */}
        <header>
          <div className="header-content">
            <img
              src={profilePhoto}
              alt={`${bio?.display_name || "Profile"}'s profile photo`}
              className="profile-photo"
              width={240}
              height={240}
              loading="eager"
            />
            <div className="header-text">
              <h1>{bio?.display_name || "Loading..."}</h1>
              {bio?.tagline && <p className="header-tagline">{bio.tagline}</p>}
              <div className="welcome-message">
                <TypewriterLoop
                  messages={[
                    "hey there!",
                    "welcome to my website",
                    "i use this as a bit of a portfolio / digital resume / hobby page",
                    "it's crazy, you can just make #$%@ in 2026!!!",
                    "anyways, take a look around at what ive been up to",
                    "i try to keep this relatively up to date...",
                    "there are some easter eggs if you go exploring",
                    "hope you enjoy!",
                    "have a nice day =)",
                  ]}
                  typeSpeed={25}
                  deleteSpeed={15}
                  pauseTime={2000}
                  initialDelay={1000}
                  className="welcome-typewriter"
                />
              </div>
            </div>
          </div>
        </header>

        {/* Navigation */}
        <SectionNav
          activeSection={activeSection}
          onSectionChange={handleSectionChange}
        />

        {/* Main Content */}
        <main>
          <AnimatePresence mode="wait">
            {activeSection && !previewMode ? (
              <motion.div
                key={activeSection}
                className="content-section"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
              >
                {renderActiveSection()}
              </motion.div>
            ) : (
              <motion.div
                key="preview"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
              >
                <div className="section-fade-previews">
                  <SectionFadePreview
                    id="about"
                    onExpand={handlePreviewExpand}
                    maxHeight={180}
                    index={0}
                  >
                    <section className="section-content about-section">
                      <div className="about-content">
                        <About
                          onRegenerate={() => {}}
                          content={bio ?? undefined}
                        />
                      </div>
                    </section>
                  </SectionFadePreview>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {/* Action Buttons */}
        {activeSection && !previewMode && (
          <ActionButtons
            onRegenerate={() => regenerate(true)}
            onReset={reset}
            isRegenerating={isRegenerating}
            hasModifiedContent={hasModifiedContent}
            cooldownRemaining={cooldownRemaining}
            cooldownTotal={cooldownTotal}
            isReady={isReady}
          />
        )}

        {/* Image Showcase */}
        <ImageShowcase />

        {/* Contact CTA */}
        <ContactCTA />
      </div>

      {/* Mobile Menu */}
      <MobileMenu
        sections={[
          { id: "about", label: "About" },
          { id: "journey", label: "Journey" },
          { id: "projects", label: "Projects" },
          { id: "music", label: "Music" },
        ]}
        onSectionChange={handleSectionChange}
        activeSection={activeSection}
      />
    </>
  );
}
