import { useState, useEffect, useRef } from 'react';
import { defaultResume } from '../data/resume';
import { CSSTransition } from 'react-transition-group';
import '../styles/transitions.css';

const LINKS = {
  github: "https://github.com/chrisrogers37/",
  shuffify: "https://shuffify.app",
  hoobe: "https://hoo.be/crog",
  spotify: "https://open.spotify.com/artist/0UotSScPTiSFPmbmjam2jn"
} as const;

// A mapping of language names to colors for consistent styling
const LANGUAGE_COLORS: { [key: string]: string } = {
  'TypeScript': '#3178C6',
  'JavaScript': '#F7DF1E',
  'Python': '#3572A5',
  'HTML': '#E34F26',
  'CSS': '#1572B6',
  'Jupyter Notebook': '#DA5B0B',
  'Shell': '#89E051',
  'SCSS': '#C6538C',
  'Dockerfile': '#384d54',
  'Other': '#CCCCCC'
};

interface PortfolioProps {
  activeSection: string;
  content?: typeof defaultResume.portfolio;
}

interface Language {
  name: string;
  bytes: number;
}

export default function Portfolio({ activeSection, content: propContent }: PortfolioProps) {
  const [content, setContent] = useState(propContent || defaultResume.portfolio);
  const [prevSection, setPrevSection] = useState('');
  const [languages, setLanguages] = useState<Language[]>([]);
  const [loadingLanguages, setLoadingLanguages] = useState(false);
  const [languageError, setLanguageError] = useState<string | null>(null);
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
    if (activeSection !== prevSection) {
      setPrevSection(activeSection);
    }
    if (activeSection === 'projects' && languages.length === 0 && !loadingLanguages) {
      fetchLanguages();
    }
  }, [activeSection, prevSection, languages, loadingLanguages]);
  
  const fetchLanguages = async () => {
    setLoadingLanguages(true);
    setLanguageError(null);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/github/languages`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch languages');
      }
      const data = await response.json();
      
      const formattedLanguages = data.languages.map(([name, bytes]: [string, number]) => ({ name, bytes }));
      setLanguages(formattedLanguages);

    } catch (err) {
      if (err instanceof Error) {
        setLanguageError(err.message);
      } else {
        setLanguageError('An unknown error occurred');
      }
    } finally {
      setLoadingLanguages(false);
    }
  };

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
                    <span className="link-description">A better way to manage your Spotify playlists</span>
                  </div>
                </a>
                <a href="https://city-cycles.streamlit.app/" target="_blank" rel="noopener noreferrer" className="portfolio-link">
                  <i className="fas fa-bicycle"></i>
                  <div>
                    <span className="link-title">City Cycles</span>
                    <span className="link-description">End-to-end analytics flow comparing public bike programs in NYC and London</span>
                  </div>
                </a>
                <a href="https://hedwig.streamlit.app/" target="_blank" rel="noopener noreferrer" className="portfolio-link">
                  <i className="fas fa-feather"></i>
                  <div>
                    <span className="link-title">Hedwig</span>
                    <span className="link-description">RAG-assisted LLM chatbot for generating email outreach templates</span>
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
              <div className="github-stats-container">
                {loadingLanguages && <div className="loading-message">Summoning language stats from GitHub...</div>}
                {languageError && <div className="error-message">Error: {languageError}</div>}
                {!loadingLanguages && !languageError && languages.length > 0 && (
                  <>
                    <h4 className="stats-header">GitHub Language Stats</h4>
                    <p className="skills-subtitle">
                      A dynamic overview of languages from my public repositories, sized by bytes of code.
                    </p>
                    <div className="skills-bar-chart">
                      {(() => {
                          const totalBytes = languages.reduce((sum, lang) => sum + lang.bytes, 0);
                          return languages.map((lang, index) => {
                          const percentage = totalBytes > 0 ? (lang.bytes / totalBytes) * 100 : 0;
                          const barColor = LANGUAGE_COLORS[lang.name] || LANGUAGE_COLORS['Other'];
                          
                          return (
                            <div key={index} className="skill-bar-wrapper">
                              <div className="skill-bar-label">
                                <span>{lang.name}</span>
                                <span>{percentage.toFixed(2)}%</span>
                              </div>
                              <div className="skill-bar">
                                <div 
                                  className="skill-bar-fill" 
                                  style={{ width: `${percentage}%`, backgroundColor: barColor }}
                                  title={`${lang.bytes.toLocaleString()} bytes`}
                                >
                                </div>
                              </div>
                            </div>
                          );
                        })
                      })()}
                    </div>
                  </>
                )}
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
        nodeRef={nodeRef}
        in={activeSection === prevSection}
        timeout={300}
        classNames="fade"
        unmountOnExit={false}
      >
        <div ref={nodeRef} className={`content-section ${activeSection === prevSection ? 'visible' : ''}`}>
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