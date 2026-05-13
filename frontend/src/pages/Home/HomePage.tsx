import { useContentLoader } from "../../hooks";
import { useIsLoading, useBio, useTimeline } from "../../store";
import { useUIStore } from "../../store/uiStore";
import { SEO, PersonSchema } from "../../components/SEO";
import { ScrollRevealSection } from "../../components/common/ScrollRevealSection";
import { Timeline } from "../../components/sections/Timeline";
import { Projects } from "../../components/sections/Projects";
import { ErrorBoundary } from "../../components/common/ErrorBoundary";
import { Mail } from "lucide-react";
import "./HomePage.css";

function CompassRose({ rotation }: { rotation: number }) {
  return (
    <div
      className="hero-compass"
      style={{ transform: `rotate(${rotation}deg)` }}
    >
      <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Outer rings */}
        <circle cx="60" cy="60" r="56" stroke="#1E2A35" strokeWidth="1" />
        <circle cx="60" cy="60" r="52" stroke="#1E2A35" strokeWidth="0.5" />

        {/* Cardinal tick marks */}
        <line x1="60" y1="4" x2="60" y2="14" stroke="#2DD4BF" strokeWidth="2" />
        <line x1="60" y1="106" x2="60" y2="116" stroke="#94A3B8" strokeWidth="1" />
        <line x1="4" y1="60" x2="14" y2="60" stroke="#94A3B8" strokeWidth="1" />
        <line x1="106" y1="60" x2="116" y2="60" stroke="#94A3B8" strokeWidth="1" />

        {/* Intercardinal ticks */}
        <line x1="20" y1="20" x2="25" y2="25" stroke="#1E2A35" strokeWidth="0.75" />
        <line x1="100" y1="20" x2="95" y2="25" stroke="#1E2A35" strokeWidth="0.75" />
        <line x1="20" y1="100" x2="25" y2="95" stroke="#1E2A35" strokeWidth="0.75" />
        <line x1="100" y1="100" x2="95" y2="95" stroke="#1E2A35" strokeWidth="0.75" />

        {/* North needle */}
        <polygon points="60,16 55,58 65,58" fill="#2DD4BF" />
        {/* South needle */}
        <polygon points="60,104 55,62 65,62" fill="#1E2A35" stroke="#94A3B8" strokeWidth="0.5" />

        {/* Center */}
        <circle cx="60" cy="60" r="3" fill="#2DD4BF" />
      </svg>
    </div>
  );
}

export function HomePage() {
  useContentLoader();
  const isLoading = useIsLoading();
  const bio = useBio();
  const timeline = useTimeline();
  const scrollProgress = useUIStore((s) => s.scrollProgress);

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
        <ScrollRevealSection id="hero" fullHeight divider>
          <div className="hero-section">
            <h1 className="hero-name">Christopher Rogers</h1>
            <p className="hero-headline">building things that build things</p>
            <p className="hero-subline">
              data, music, side quests
            </p>
            <CompassRose rotation={scrollProgress * 360} />
          </div>
        </ScrollRevealSection>

        {/* Journey */}
        <ScrollRevealSection
          id="journey"
          atmosphere={{ accentSecondary: "#B8A04A", bgTexture: "parchment" }}
          divider
        >
          <div className="section-content">
            <h2 className="section-title">Journey</h2>
            <ErrorBoundary>
              <Timeline data={timeline} />
            </ErrorBoundary>
          </div>
        </ScrollRevealSection>

        {/* Projects */}
        <ScrollRevealSection id="projects" divider>
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
            <div className="about-links">
              <a href={`mailto:${bio?.email || "christophertrogers37@gmail.com"}`}>
                <Mail size={16} />
                <span>get in touch</span>
              </a>
            </div>
          </div>
        </ScrollRevealSection>
      </div>
    </>
  );
}
