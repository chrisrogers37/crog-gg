import { useMemo, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

// Hooks
import { useMediaQuery, useRegeneration } from "../../hooks";
import {
  useUIStore,
  useIsLoading,
  useContentError,
  useRegenerationError,
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

// The About preview fades at a fixed point in the COPY rather than at a fixed
// height: the gradient begins on the line carrying "all while optimizing
// themselves", the end of the agent-teams paragraph.
//
// That anchor is width-relative, which is why there are two numbers and not
// one. The same copy is 991px tall at 390px wide and 662px at 1280px, so the
// phrase sits 349px down on a phone and 229px down on a desktop -- 120px
// apart. No single clamp reaches it at both: at the wide value the phrase is
// clipped away entirely on a phone, and at the narrow value it sits well clear
// of the fade on a desktop, which puts the cut on a finished paragraph instead.
//
// Both were solved as maxHeight = (phraseTop - contentTop) + overlayHeight and
// verified to a 0px offset against the rendered page. Re-measure both if the
// About copy changes.
const ABOUT_CLAMP_NARROW = 449;
const ABOUT_CLAMP_WIDE = 329;

// The breakpoint the rest of the site already parts on, including
// SectionFadePreview.css.
const NARROW_VIEWPORT = "(max-width: 768px)";

export function HomePage() {
  // Random profile photo (selected once on mount)
  const profilePhoto = useMemo(() => {
    const randomIndex = Math.floor(Math.random() * PROFILE_PHOTOS.length);
    return PROFILE_PHOTOS[randomIndex];
  }, []);

  // Get state from stores
  const isLoading = useIsLoading();
  const error = useContentError();
  const regenerationError = useRegenerationError();
  const bio = useBio();
  const timeline = useTimeline();
  const activeSection = useUIStore((state) => state.activeSection);
  const setActiveSection = useUIStore((state) => state.setActiveSection);
  const toggleMobileMenu = useUIStore((state) => state.toggleMobileMenu);

  // Preview mode: starts true so About shows as a preview on load
  const isNarrowViewport = useMediaQuery(NARROW_VIEWPORT);
  const [previewMode, setPreviewMode] = useState(true);

  // Whether the expanded section is actually in the DOM, as opposed to merely
  // asked for. Leaving preview mode satisfies `!previewMode` on the same tick,
  // but AnimatePresence holds the collapsed preview for the length of its exit
  // transition, so the expanded content arrives a few hundred milliseconds
  // later and grows the page under whatever already mounted. Anything that sits
  // *below* the content has to wait for this rather than for the intent, or it
  // renders against a layout that is about to change height and gets displaced
  // once the real content lands.
  const [contentMounted, setContentMounted] = useState(false);

  // Nothing else needs to be consulted: the flag is set when the content node
  // attaches and cleared when it detaches, so it says only "the expanded
  // content is in the DOM". Both edges matter and for the same reason. Mounting
  // anything below it on the *request* to expand put the buttons on screen
  // ~320ms before the content that determines their position; unmounting them
  // on the request to collapse took them away ~315ms before the content
  // actually went, so one click moved the page below twice. Both are the same
  // defect, and the fix for both is to follow the DOM rather than the intent.

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

  // Handle section change from nav buttons.
  //
  // SectionNav signals "deselect" by passing an EMPTY id, not by echoing the
  // active one back, so an empty string is what a collapse looks like here.
  // Matching on `section === activeSection` therefore never fired, and the
  // collapse fell through to the branch below -- which clears activeSection
  // and sets previewMode false. "see more" only sets previewMode false, so
  // from that state it had nothing left to change and went permanently inert
  // while still rendering as a live control (#165).
  //
  // Collapsing returns to the landing state, which is what the reader started
  // in: about selected, preview mode on.
  const handleSectionChange = (section: string) => {
    if (!section) {
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

  // Fatal only: content never loaded, so there is no page to replace. A failed
  // regeneration is surfaced inline next to the button instead.
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
                // Attach is the first moment the expanded content occupies
                // layout; detach is the moment it stops, which under
                // AnimatePresence is when its exit animation has finished
                // rather than when the collapse was asked for. Both edges are
                // wanted, so the node is reported either way.
                ref={(node) => setContentMounted(!!node)}
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
                    maxHeight={
                      isNarrowViewport ? ABOUT_CLAMP_NARROW : ABOUT_CLAMP_WIDE
                    }
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

        {/* Action Buttons — gated on the content being present, not requested.
            previewMode is deliberately not consulted: it is the request, and
            reading it here is what unmounted these ahead of the content. */}
        {contentMounted && (
          <>
            <ActionButtons
              onRegenerate={() => regenerate(true)}
              onReset={reset}
              isRegenerating={isRegenerating}
              hasModifiedContent={hasModifiedContent}
              cooldownRemaining={cooldownRemaining}
              cooldownTotal={cooldownTotal}
              isReady={isReady}
            />
            {regenerationError && (
              <div className="regeneration-notice" role="status">
                {regenerationError}
              </div>
            )}
          </>
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
