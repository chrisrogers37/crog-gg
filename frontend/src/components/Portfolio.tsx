import { useState, useEffect } from 'react';
import { defaultResume } from '../data/resume';
import { CSSTransition } from 'react-transition-group';
import '../styles/transitions.css';

const LINKS = {
  github: "https://github.com/chrisrogers37/",
  shuffify: "https://shuffify.app",
  hoobe: "https://hoo.be/crog",
  spotify: "https://open.spotify.com/artist/0UotSScPTiSFPmbmjam2jn"
} as const;

interface PortfolioProps {
  activeSection: string;
}

export default function Portfolio({ activeSection }: PortfolioProps) {
  const [content, setContent] = useState(defaultResume.portfolio);
  const [visibleSection, setVisibleSection] = useState(activeSection);
  const [prevSection, setPrevSection] = useState('');

  useEffect(() => {
    // Listen for content updates
    const handleContentRegenerated = (event: CustomEvent) => {
      if (event.detail.section === 'portfolio') {
        setContent(event.detail.content);
      }
    };

    window.addEventListener('contentRegenerated', handleContentRegenerated as EventListener);

    return () => {
      window.removeEventListener('contentRegenerated', handleContentRegenerated as EventListener);
    };
  }, []);

  useEffect(() => {
    if (activeSection !== visibleSection) {
      setPrevSection(visibleSection);
      setVisibleSection(activeSection);
    }
  }, [activeSection]);

  const renderSection = () => {
    if (!content) return <div>Loading...</div>;
    
    const sectionContent = (() => {
      switch (activeSection) {
        case 'experience':
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
              <div className="skills-section">
                <h3>Skills</h3>
                <div className="skills-grid">
                  {(content.skills || []).map((skill, index) => (
                    <span key={index} className="tech-tag">{skill}</span>
                  ))}
                </div>
              </div>
            </div>
          );
        case 'education':
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
        case 'projects':
          return (
            <div className="projects-section">
              <div className="links-grid">
                <a href={LINKS.shuffify} target="_blank" rel="noopener noreferrer" className="portfolio-link">
                  <i className="fas fa-music"></i>
                  <div>
                    <span className="link-title">Shuffify</span>
                    <span className="link-description">A better way to shuffle your Spotify playlists</span>
                  </div>
                </a>
                <a href={LINKS.github} target="_blank" rel="noopener noreferrer" className="portfolio-link">
                  <i className="fab fa-github"></i>
                  <div>
                    <span className="link-title">GitHub</span>
                    <span className="link-description">Check out my open source projects and contributions</span>
                  </div>
                </a>
              </div>
            </div>
          );
        case 'music':
          return (
            <div className="music-section">
              <div className="links-grid">
                <a href={LINKS.spotify} target="_blank" rel="noopener noreferrer" className="portfolio-link">
                  <i className="fab fa-spotify"></i>
                  <div>
                    <span className="link-title">Spotify</span>
                    <span className="link-description">Listen to my music on Spotify</span>
                  </div>
                </a>
                <a href={LINKS.hoobe} target="_blank" rel="noopener noreferrer" className="portfolio-link">
                  <i className="fas fa-link"></i>
                  <div>
                    <span className="link-title">Music Links</span>
                    <span className="link-description">Find me on other platforms</span>
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
        in={activeSection === visibleSection}
        timeout={300}
        classNames="fade"
        unmountOnExit={false}
      >
        <div className={`content-section ${activeSection === visibleSection ? 'visible' : ''}`}>
          {sectionContent}
        </div>
      </CSSTransition>
    );
  };

  return (
    <div className={`portfolio-section ${activeSection ? 'has-active-section' : ''}`}>
      <div className="portfolio-content">
        {renderSection()}
      </div>
    </div>
  );
} 