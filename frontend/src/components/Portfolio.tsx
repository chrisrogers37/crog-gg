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
                  <i className="fab fa-spotify"></i>
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
                  <i className="fas fa-link"></i>
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
