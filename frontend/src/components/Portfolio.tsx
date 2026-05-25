import { useState, useEffect, useRef } from "react";
import { CSSTransition } from "react-transition-group";
import { ExperienceData } from "../types/Experience";
import { EducationData } from "../types/Education";
import { Projects } from "./sections/Projects";
import "../styles/transitions.css";

const LINKS = {
  hoobe: "https://hoo.be/crog",
  spotify: "https://open.spotify.com/artist/0UotSScPTiSFPmbmjam2jn",
} as const;

interface PortfolioProps {
  activeSection: string;
  content?: {
    experience: ExperienceData["experience"];
    education: EducationData["education"];
  };
}

export default function Portfolio({
  activeSection,
  content: propContent,
}: PortfolioProps) {
  const [content, setContent] = useState(propContent || null);
  const [prevSection, setPrevSection] = useState("");
  const nodeRef = useRef(null);

  // Update content when prop changes
  useEffect(() => {
    if (propContent) {
      setContent(propContent);
    }
  }, [propContent]);

  useEffect(() => {
    // Listen for content updates
    const handleContentRegenerated = (event: CustomEvent) => {
      if (event.detail.section === "portfolio") {
        setContent(event.detail.content);
      }
    };

    window.addEventListener(
      "contentRegenerated",
      handleContentRegenerated as EventListener,
    );

    return () => {
      window.removeEventListener(
        "contentRegenerated",
        handleContentRegenerated as EventListener,
      );
    };
  }, []);

  useEffect(() => {
    if (activeSection !== prevSection) {
      setPrevSection(activeSection);
    }
  }, [activeSection, prevSection]);

  const renderSection = () => {
    if (!content) return <div>Loading...</div>;

    const sectionContent = (() => {
      switch (activeSection) {
        case "experience":
          return (
            <div className="experience-section">
              <div className="employment-section">
                {(content.experience || []).map((job, index) => (
                  <div key={index} className="job-card">
                    <div className="job-header">
                      <div className="job-title-section">
                        <h4>{job.title}</h4>
                      </div>
                      <div className="company">{job.company}</div>
                      <div className="period">{job.period}</div>
                    </div>
                    <ul className="achievements">
                      {job.achievements.map((achievement, idx) => (
                        <li key={idx}>{achievement}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          );
        case "education":
          return (
            <div className="education-section">
              <div className="education-grid">
                {(content.education || []).map((edu, index) => (
                  <div key={index} className="education-card">
                    <h4>{edu.school}</h4>
                    <div className="degree">{edu.degree}</div>
                    <div className="year">{edu.year}</div>
                  </div>
                ))}
              </div>
            </div>
          );
        case "projects":
          return <Projects />;
        case "music":
          return (
            <div className="music-section">
              <div className="links-grid">
                <a
                  href={LINKS.spotify}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="portfolio-link"
                >
                  <svg className="portfolio-link-icon" viewBox="0 0 496 512" fill="currentColor" aria-hidden="true"><path d="M248 8C111.1 8 0 119.1 0 256s111.1 248 248 248 248-111.1 248-248S384.9 8 248 8zm100.7 364.9c-4.2 0-6.8-1.3-10.7-3.6-62.4-37.6-135-39.2-206.7-24.5-3.9 1-9 2.6-11.9 2.6-9.7 0-15.8-7.7-15.8-15.8 0-10.3 6.1-15.2 13.6-16.8 81.9-18.1 165.6-16.5 237 26.2 6.1 3.9 9.7 7.4 9.7 16.5s-7.1 15.4-15.2 15.4zm26.9-65.6c-5.2 0-8.7-2.3-12.3-4.2-62.5-37-155.7-51.9-238.6-29.4-4.8 1.3-7.4 2.6-11.9 2.6-10.7 0-19.4-8.7-19.4-19.4s5.2-17.8 15.5-20.7c27.8-7.8 56.2-13.6 97.8-13.6 64.9 0 127.6 16.1 177 45.5 8.1 4.8 11.3 11 11.3 19.7-.1 10.8-8.5 19.5-19.4 19.5zm31-76.2c-5.2 0-8.4-1.3-12.9-3.9-71.2-42.5-198.5-52.7-280.9-29.7-3.6 1-8.1 2.6-12.9 2.6-13.2 0-23.3-10.3-23.3-23.6 0-13.6 8.4-21.3 17.4-23.9 35.2-10.3 74.6-15.2 117.5-15.2 73 0 149.5 15.2 205.4 47.8 7.8 4.5 12.9 10.7 12.9 22.6 0 13.6-11 23.3-23.2 23.3z"/></svg>
                  <div>
                    <span className="link-title">Spotify</span>
                    <span className="link-description">
                      Listen to my music on Spotify
                    </span>
                  </div>
                </a>
                <a
                  href={LINKS.hoobe}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="portfolio-link"
                >
                  <svg className="portfolio-link-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
                  <div>
                    <span className="link-title">Music Links</span>
                    <span className="link-description">
                      Find me on other platforms
                    </span>
                  </div>
                </a>
              </div>
              <div className="spotify-embed">
                <iframe
                  src="https://open.spotify.com/embed/artist/0UotSScPTiSFPmbmjam2jn?utm_source=generator"
                  width="100%"
                  height="352"
                  frameBorder="0"
                  allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                  loading="lazy"
                ></iframe>
              </div>
            </div>
          );
        default:
          return null;
      }
    })();

    return (
      <CSSTransition
        nodeRef={nodeRef}
        in={activeSection === prevSection}
        timeout={300}
        classNames="fade"
        unmountOnExit={false}
      >
        <div
          ref={nodeRef}
          className={`content-section ${activeSection === prevSection ? "visible" : ""}`}
        >
          {sectionContent}
        </div>
      </CSSTransition>
    );
  };

  return (
    <div
      className={`portfolio-section ${activeSection ? "has-active-section" : ""}`}
    >
      <div className="portfolio-content">{renderSection()}</div>
    </div>
  );
}
