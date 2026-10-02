import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import site from "virtual:site-config";

// Hooks
import { useMediaQuery, useRegeneration } from "../../hooks";
import {
  useContentStore,
  useIsLoading,
  useContentError,
  useRegenerationError,
  useBio,
  useTimeline,
} from "../../store";

// SEO
import { SEO } from "../../components/SEO";
import { ABOUT_META } from "../../seo";

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
import { ErrorBoundary } from "../../components/common/ErrorBoundary";
import { SectionNavigator } from "../../components/common/SectionNavigator";
import { ImageShowcase } from "../../components/common/ImageShowcase";
import { LoadError } from "../../components/common/LoadError";
import { useSectionMenu } from "../../components/layout/MobileMenu/sectionMenu";
import { photoSrc, photoSrcSet } from "../../utils/photos";
import {
  SECTIONS,
  SECTION_PANEL_ID,
  sectionTabId,
} from "../../components/sectionTabs";

// Styles
import "./AboutPage.css";

/**
 * AboutPage Component
 *
 * The personal page (#173 moved it here from /, which is now Claudlobby's):
 * profile header, the about / journey / projects / music sections, the photo
 * strip and contact links, using Zustand stores for state management.
 */
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
// verified to a 0px offset against the rendered page. They're
// about.preview_height in site/site.yaml (#188): re-measure both if the About
// copy changes.
const { narrow: ABOUT_CLAMP_NARROW, wide: ABOUT_CLAMP_WIDE } =
  site.about.preview_height;

// The breakpoint the rest of the site already parts on, including
// SectionFadePreview.css.
const NARROW_VIEWPORT = "(max-width: 768px)";

export function AboutPage() {
  // The head in every state: after an in-app hop from /, the tab would
  // otherwise keep the home page's title while the content loads, and for
  // good if the load fails.
  return (
    <>
      <SEO {...ABOUT_META} />
      <AboutContent />
    </>
  );
}

function AboutContent() {
  // Random profile photo (selected once on mount)
  const profilePhoto = useMemo(() => {
    const { photos } = site.hero;
    return photos[Math.floor(Math.random() * photos.length)];
  }, []);

  // Get state from stores
  const isLoading = useIsLoading();
  const error = useContentError();
  const regenerationError = useRegenerationError();
  const bio = useBio();
  const timeline = useTimeline();
  const loadContent = useContentStore((s) => s.loadContent);

  // The open section, or null while About shows as a preview. It's the page's
  // own, so every visit lands on About's preview.
  const [openSection, setOpenSection] = useState<string | null>(null);
  // The tab that shows as selected: the open section, or About's preview.
  const selectedTab = openSection ?? "about";
  const isNarrowViewport = useMediaQuery(NARROW_VIEWPORT);

  // Whether the expanded section is actually in the DOM, as opposed to merely
  // asked for. Opening a section sets `openSection` on the same tick,
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

  // Regeneration; the button reads its own cooldown
  const {
    regenerate,
    reset,
    isRegenerating,
    hasModifiedContent,
  } = useRegeneration();

  // A tab opens its section, and a second click on the open tab goes back to
  // About's preview, where the reader started. Everything else only opens: the
  // mobile menu, the next-section link and "see more". (A tab used to signal a
  // collapse with an empty id, the shape behind "see more" going inert, #165,
  // and the previewed About tab doing nothing, #196 M66.)
  const handleTabClick = (section: string) => {
    setOpenSection(openSection === section ? null : section);
  };

  // Before the early returns below, so the menu lists these while loading too.
  useSectionMenu(SECTIONS, selectedTab, setOpenSection);

  // "see more" opens About: the preview is always About's.
  const handlePreviewExpand = () => setOpenSection("about");

  const renderOpenSection = (section: string) => {
    let content: React.ReactNode;
    switch (section) {
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

    const nextSection =
      SECTIONS[SECTIONS.findIndex(({ id }) => id === section) + 1]?.id ??
      null;

    return (
      <ErrorBoundary key={section} compact>
        {content}
        <SectionNavigator
          nextSection={nextSection}
          onNavigate={setOpenSection}
        />
      </ErrorBoundary>
    );
  };

  // Loading skeleton - matches real layout dimensions to prevent CLS
  if (isLoading) {
    return (
      <div className="about-page">
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
            {SECTIONS.map(({ id }) => (
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
      <div className="about-page">
        <LoadError
          message="Failed to load this page. Please try again."
          onRetry={() => loadContent()}
        />
      </div>
    );
  }

  return (
    <div className="about-page">
      {/* Header */}
      <header>
        <div className="header-content">
          {/* src goes last: attributes are set in order, and Safari starts
              fetching src the moment it is set, before srcset can choose. */}
          <img
            alt={`${bio?.display_name || "Profile"}'s profile photo`}
            className="profile-photo"
            width={240}
            height={240}
            loading="eager"
            // The .profile-photo widths in App.css, per breakpoint.
            sizes="(max-width: 360px) 110px, (max-width: 480px) 140px, (max-width: 768px) 180px, 240px"
            srcSet={photoSrcSet(profilePhoto)}
            src={photoSrc(profilePhoto)}
          />
          <div className="header-text">
            <h1>{bio?.display_name || "Loading..."}</h1>
            {bio?.tagline && <p className="header-tagline">{bio.tagline}</p>}
            <div className="welcome-message">
              <TypewriterLoop
                messages={site.hero.typewriter}
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
        activeSection={selectedTab}
        onSelect={handleTabClick}
      />

      {/* Main Content (inside the Layout's <main>, so not a landmark of its own) */}
      <div className="about-main">
        <AnimatePresence mode="wait">
          {openSection ? (
            <motion.div
              key={openSection}
              className="content-section"
              role="tabpanel"
              id={SECTION_PANEL_ID}
              aria-labelledby={sectionTabId(openSection)}
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
              {renderOpenSection(openSection)}
            </motion.div>
          ) : (
            <motion.div
              key="preview"
              // The collapsed preview is the About tab's panel.
              role="tabpanel"
              id={SECTION_PANEL_ID}
              aria-labelledby={sectionTabId("about")}
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
      </div>

      {/* Action Buttons — gated on the content being present, not requested.
          openSection is deliberately not consulted: it is the request, and
          reading it here is what unmounted these ahead of the content. */}
      {contentMounted && (
        <>
          <ActionButtons
            onRegenerate={() => regenerate(true)}
            onReset={reset}
            isRegenerating={isRegenerating}
            hasModifiedContent={hasModifiedContent}
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
  );
}
