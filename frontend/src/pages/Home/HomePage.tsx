import { useContentLoader } from "../../hooks";
import { useIsLoading, useBio, useTimeline } from "../../store";
import { SEO, PersonSchema } from "../../components/SEO";
import { ScrollRevealSection } from "../../components/common/ScrollRevealSection";
import { Timeline } from "../../components/sections/Timeline";
import { Projects } from "../../components/sections/Projects";
import { ErrorBoundary } from "../../components/common/ErrorBoundary";
import "./HomePage.css";

export function HomePage() {
  useContentLoader();
  const isLoading = useIsLoading();
  const bio = useBio();
  const timeline = useTimeline();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-teal-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <>
      <SEO />
      <PersonSchema />

      <div className="home-scroll-container">
        {/* Hero */}
        <ScrollRevealSection id="hero" fullHeight>
          <div className="hero-section">
            <h1 className="hero-name">Christopher Rogers</h1>
            <p className="hero-headline">i build things that build things</p>
            <p className="hero-subline">
              data, music, and too many side projects
            </p>
          </div>
        </ScrollRevealSection>

        {/* Journey */}
        <ScrollRevealSection
          id="journey"
          atmosphere={{ accentSecondary: "#B8A04A" }}
        >
          <div className="section-content">
            <h2 className="section-title">Journey</h2>
            <ErrorBoundary>
              <Timeline data={timeline} />
            </ErrorBoundary>
          </div>
        </ScrollRevealSection>

        {/* Projects */}
        <ScrollRevealSection id="projects">
          <div className="section-content">
            <h2 className="section-title">Projects</h2>
            <ErrorBoundary>
              <Projects />
            </ErrorBoundary>
          </div>
        </ScrollRevealSection>

        {/* About */}
        <ScrollRevealSection
          id="about"
          atmosphere={{ accentSecondary: "#6B8A9E" }}
        >
          <div className="section-content about-section">
            <h2 className="section-title">About</h2>
            <div className="about-text">
              <p>
                {bio?.about_text ||
                  "i spent years doing data work at places like citadel, meta, and msk. then i quit my job and went all-in on ai. built an autonomous agent fleet that now writes 90% of my code. open-sourced the whole thing. now leading the data platform at artemis while the fleet keeps shipping."}
              </p>
              <p>
                when i unplug i'm usually in maine, making electronic music
                under the name crog, or traveling somewhere new.
              </p>
            </div>
          </div>
        </ScrollRevealSection>
      </div>
    </>
  );
}
