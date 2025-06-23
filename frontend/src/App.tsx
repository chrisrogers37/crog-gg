import { useState, useEffect } from 'react'
import './App.css'
import About from './components/About'
import Portfolio from './components/Portfolio'
import Skills from './components/Skills'
import SectionNav from './components/SectionNav'
import { defaultResume } from './data/resume'

const API_URL = import.meta.env.VITE_API_URL;
console.log('API_URL:', API_URL); // Debug log

// LinkedIn icon component
const LinkedInIcon = () => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="16" 
    height="16" 
    viewBox="0 0 24 24"
    fill="currentColor"
    style={{ verticalAlign: 'middle', marginRight: '5px' }}
  >
    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
  </svg>
);

function App() {
  const [currentContent, setCurrentContent] = useState({
    about: defaultResume.about,
    portfolio: defaultResume.portfolio
  });
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasModifiedContent, setHasModifiedContent] = useState(false);
  const [activeSection, setActiveSection] = useState<string>('');

  // Fetch usage info on component mount and after regeneration
  const fetchUsageInfo = async () => {
    try {
      const response = await fetch(`${API_URL}/api/limits`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        }
      });
      await response.json();
    } catch (error) {
      console.error('Error fetching usage info:', error);
    }
  }

  useEffect(() => {
    // Listen for content updates from child components
    const handleContentUpdated = (event: CustomEvent) => {
      const { section, content } = event.detail;
      setCurrentContent(prev => ({
        ...prev,
        [section]: content
      }));
    };

    window.addEventListener('contentUpdated', handleContentUpdated as EventListener);

    return () => {
      window.removeEventListener('contentUpdated', handleContentUpdated as EventListener);
    };
  }, []);

  const handleRegenerate = async () => {
    if (isRegenerating) return;
    setIsRegenerating(true);
    setError(null);

    try {
      const willUseFantasy = Math.random() < 1.00;
      // Regenerate both about and portfolio sections
      const aboutResponse = await fetch(`${API_URL}/api/regenerate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        mode: 'cors',
        credentials: 'include',
        body: JSON.stringify({
          section: 'about',
          content: currentContent.about,
          is_full_regeneration: true,
          use_fantasy: willUseFantasy
        }),
      });
      const portfolioResponse = await fetch(`${API_URL}/api/regenerate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        mode: 'cors',
        credentials: 'include',
        body: JSON.stringify({
          section: 'portfolio',
          content: currentContent.portfolio,
          is_full_regeneration: true,
          use_fantasy: willUseFantasy
        }),
      });

      if (!aboutResponse.ok || !portfolioResponse.ok) {
        throw new Error('Failed to regenerate content');
      }

      const aboutData = await aboutResponse.json();
      const portfolioData = await portfolioResponse.json();
      if (aboutData.success && portfolioData.success) {
        setCurrentContent(prev => ({
          ...prev,
          about: aboutData.content,
          portfolio: portfolioData.content
        }));
        setHasModifiedContent(true);
        // Dispatch the content regenerated events
        window.dispatchEvent(new CustomEvent('contentRegenerated', {
          detail: {
            section: 'about',
            content: aboutData.content,
            is_full_regeneration: true,
            use_fantasy: willUseFantasy
          }
        }));
        window.dispatchEvent(new CustomEvent('contentRegenerated', {
          detail: {
            section: 'portfolio',
            content: portfolioData.content,
            is_full_regeneration: true,
            use_fantasy: willUseFantasy
          }
        }));
      }
    } catch (error) {
      console.error('Error during regeneration:', error);
    } finally {
      setTimeout(() => {
        setIsRegenerating(false);
      }, 1000);
    }
  };

  const handleReset = () => {
    setCurrentContent({
      about: defaultResume.about,
      portfolio: defaultResume.portfolio
    });
    setHasModifiedContent(false);
    window.dispatchEvent(new CustomEvent('contentRegenerated', {
      detail: {
        section: 'about',
        content: defaultResume.about,
        is_full_regeneration: true,
        use_fantasy: false
      }
    }));
    window.dispatchEvent(new CustomEvent('contentRegenerated', {
      detail: {
        section: 'portfolio',
        content: defaultResume.portfolio,
        is_full_regeneration: true,
        use_fantasy: false
      }
    }));
  };

  return (
    <div className="app">
      <header>
        <div className="header-content">
          <picture>
            <source srcSet="/profile-photo.jpg" type="image/jpeg" />
            <img 
              src="/profile-photo.png" 
              alt={`${currentContent.about.display_name}'s profile photo`}
              className="profile-photo"
            />
          </picture>
          <div className="header-text">
            <h1>{currentContent.about.display_name}</h1>
            <div className="contact-header">
              <p>📍 {currentContent.about.location}</p>
              <p>📧 <a href={`mailto:${currentContent.about.email}`}>{currentContent.about.email}</a></p>
              <p><LinkedInIcon /> <a href={currentContent.about.socialLinks.linkedin} target="_blank" rel="noopener noreferrer">LinkedIn</a></p>
            </div>
          </div>
        </div>
      </header>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <main>
        <section className="section-content about-section">
          <h2>
            ABOUT ME
            <div className="button-group">
              <button 
                className="generate-btn"
                onClick={handleRegenerate}
                disabled={isRegenerating}
              >
                {isRegenerating ? 'Weaving Epic Saga...' : 'SUMMON NEW LORE'}
              </button>
              {hasModifiedContent && (
                <button 
                  className="reset-btn"
                  onClick={handleReset}
                  disabled={isRegenerating}
                >
                  DISPEL ENCHANTMENT
                </button>
              )}
            </div>
          </h2>
          <div className="about-content">
            <About onRegenerate={fetchUsageInfo} />
          </div>
        </section>

        <SectionNav 
          activeSection={activeSection}
          onSectionChange={setActiveSection}
        />

        {['experience', 'education', 'projects', 'music'].includes(activeSection) && (
          <Portfolio activeSection={activeSection} />
        )}
        {activeSection === 'skills' && <Skills />}
      </main>
    </div>
  )
}

export default App
