import { useRef, useMemo } from "react";
import { CSSTransition } from "react-transition-group";

// Hooks
import {
  useContentLoader,
  useRegeneration,
  useScrollToSection,
} from "../../hooks";
import {
  useUIStore,
  useIsLoading,
  useContentError,
  useBio,
  useSkills,
} from "../../store";

// SEO
import { SEO, PersonSchema } from "../../components/SEO";

// Components
import About from "../../components/About";
import Skills from "../../components/Skills";
import {
  Experience,
  Education,
  Projects,
  Music,
} from "../../components/sections";
import SectionNav from "../../components/SectionNav";
import { ActionButtons } from "../../components/ActionButtons";
import TypewriterLoop from "../../components/TypewriterLoop";

// Styles
import "../../App.css";
import "../../styles/transitions.css";
import "./HomePage.css";

/**
 * LinkedIn icon component
 */
const LinkedInIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="currentColor"
    style={{ verticalAlign: "middle", marginRight: "5px" }}
  >
    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
  </svg>
);

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

export function HomePage() {
  const nodeRef = useRef<HTMLDivElement>(null);

  // Random profile photo (selected once on mount)
  const profilePhoto = useMemo(() => {
    const randomIndex = Math.floor(Math.random() * PROFILE_PHOTOS.length);
    return PROFILE_PHOTOS[randomIndex];
  }, []);

  // Load content on mount
  useContentLoader();

  // Get state from stores
  const isLoading = useIsLoading();
  const error = useContentError();
  const bio = useBio();
  const skills = useSkills();
  const activeSection = useUIStore((state) => state.activeSection);
  const toggleSection = useUIStore((state) => state.toggleSection);

  // Regeneration functionality
  const { regenerate, reset, isRegenerating, hasModifiedContent } =
    useRegeneration();

  // Scroll behavior
  const { contentRef, scrollToContent } = useScrollToSection();

  // Handle section change with scroll
  const handleSectionChange = (section: string) => {
    toggleSection(section);
    scrollToContent();
  };

  // Render section based on active selection
  const renderActiveSection = () => {
    switch (activeSection) {
      case "about":
        return (
          <section className="section-content about-section">
            <div className="about-content">
              <About onRegenerate={() => {}} content={bio ?? undefined} />
            </div>
          </section>
        );
      case "skills":
        return <Skills skills={skills} />;
      case "experience":
        return <Experience />;
      case "education":
        return <Education />;
      case "projects":
        return <Projects />;
      case "music":
        return <Music />;
      default:
        return null;
    }
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
              <div className="contact-header">
                <div className="skeleton-line skeleton-detail" />
                <div className="skeleton-line skeleton-detail" />
                <div className="skeleton-line skeleton-detail-short" />
              </div>
            </div>
          </div>
        </header>
        <nav className="section-nav" aria-hidden="true">
          <div className="section-nav-container">
            {[
              "about",
              "experience",
              "skills",
              "education",
              "projects",
              "music",
            ].map((id) => (
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
        description="Software engineer and creator. Explore my portfolio, projects, and music."
        url="/"
        type="profile"
      />
      <PersonSchema />
      <div className="home-page">
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
              <div className="contact-header">
                <p>
                  <span role="img" aria-label="location">
                    📍
                  </span>{" "}
                  {bio?.location || "Loading..."}
                </p>
                <p>
                  <span role="img" aria-label="email">
                    📧
                  </span>{" "}
                  <a href={`mailto:${bio?.email || ""}`}>
                    {bio?.email || "Loading..."}
                  </a>
                </p>
                <p>
                  <LinkedInIcon />{" "}
                  <a
                    href={bio?.social_links?.linkedin || "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    LinkedIn
                  </a>
                </p>
              </div>
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
        <main ref={contentRef}>
          <CSSTransition
            nodeRef={nodeRef}
            in={!!activeSection}
            timeout={300}
            classNames="fade"
            unmountOnExit
          >
            <div
              ref={nodeRef}
              className={`content-section ${activeSection ? "visible" : ""}`}
            >
              {renderActiveSection()}
            </div>
          </CSSTransition>
        </main>

        {/* Action Buttons */}
        {activeSection && (
          <ActionButtons
            onRegenerate={() => regenerate(true)}
            onReset={reset}
            isRegenerating={isRegenerating}
            hasModifiedContent={hasModifiedContent}
          />
        )}
      </div>
    </>
  );
}
