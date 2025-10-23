import { useState, useEffect } from 'react'
import './App.css'
import About from './components/About'
import Portfolio from './components/Portfolio'
import Skills from './components/Skills'
import SectionNav from './components/SectionNav'
import Typewriter from './components/Typewriter'
import { loadResumeData } from './data/resume'

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
  console.log('App component rendering...');
  const [currentContent, setCurrentContent] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasModifiedContent, setHasModifiedContent] = useState(false);
  const [activeSection, setActiveSection] = useState<string>('');

  // Load initial data from YAML files
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        console.log('Starting to load resume data...');
        setIsLoading(true);
        const data = await loadResumeData();
        console.log('Resume data loaded successfully:', data);
        setCurrentContent({
          about: data.about,
          portfolio: data.portfolio,
          skills: data.skills
        });
        console.log('Content set successfully');
      } catch (error) {
        console.error('Error loading resume data:', error);
        setError('Failed to load content. Please refresh the page.');
      } finally {
        setIsLoading(false);
      }
    };

    loadInitialData();
  }, []);

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
      setCurrentContent((prev: any) => ({
        ...prev,
        [section]: content
      }));
    };

    window.addEventListener('contentUpdated', handleContentUpdated as EventListener);

    return () => {
      window.removeEventListener('contentUpdated', handleContentUpdated as EventListener);
    };
  }, []);

  // Listen for content regeneration events to update the main state
  useEffect(() => {
    const handleContentRegenerated = (event: CustomEvent) => {
      const { section, content } = event.detail;
      setCurrentContent((prev: any) => ({
        ...prev,
        [section]: content
      }));
    };

    window.addEventListener('contentRegenerated', handleContentRegenerated as EventListener);

    return () => {
      window.removeEventListener('contentRegenerated', handleContentRegenerated as EventListener);
    };
  }, []);

  const handleRegenerate = async () => {
    if (isRegenerating) return;
    setIsRegenerating(true);
    setError(null);

    try {
      const willUseFantasy = Math.random() < 1.00;
      
      // Regenerate all sections that have content
      const sectionsToRegenerate = ['about', 'portfolio'];
      const regenerationPromises = sectionsToRegenerate.map(section => 
        fetch(`${API_URL}/api/regenerate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          mode: 'cors',
          credentials: 'include',
          body: JSON.stringify({
            section: section,
            content: currentContent[section as keyof typeof currentContent],
            is_full_regeneration: true,
            use_fantasy: willUseFantasy
          }),
        })
      );

      const responses = await Promise.all(regenerationPromises);
      const results = await Promise.all(responses.map(r => r.json()));
      
      if (results.every(result => result.success)) {
        const newContent = { ...currentContent };
        results.forEach((result, index) => {
          const section = sectionsToRegenerate[index];
          newContent[section as keyof typeof currentContent] = result.content;
        });
        
        setCurrentContent(newContent);
        setHasModifiedContent(true);
        
        // Dispatch events for all regenerated sections
        results.forEach((result, index) => {
          const section = sectionsToRegenerate[index];
          window.dispatchEvent(new CustomEvent('contentRegenerated', {
            detail: {
              section: section,
              content: result.content,
              is_full_regeneration: true,
              use_fantasy: willUseFantasy
            }
          }));
        });
      } else {
        throw new Error('Failed to regenerate some content');
      }
    } catch (error) {
      console.error('Error during regeneration:', error);
      setError('Failed to regenerate content. Please try again.');
    } finally {
      setTimeout(() => {
        setIsRegenerating(false);
      }, 1000);
    }
  };

  const handleReset = async () => {
    try {
      setIsLoading(true);
      const data = await loadResumeData();
      setCurrentContent({
        about: data.about,
        portfolio: data.portfolio,
        skills: data.skills
      });
      setHasModifiedContent(false);
      
      // Dispatch reset events for all sections
      window.dispatchEvent(new CustomEvent('contentRegenerated', {
        detail: {
          section: 'about',
          content: data.about,
          is_full_regeneration: true,
          use_fantasy: false
        }
      }));
      window.dispatchEvent(new CustomEvent('contentRegenerated', {
        detail: {
          section: 'portfolio',
          content: data.portfolio,
          is_full_regeneration: true,
          use_fantasy: false
        }
      }));
    } catch (error) {
      console.error('Error resetting content:', error);
      setError('Failed to reset content. Please refresh the page.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="app">
      <header>
        <div className="header-content">
          <picture>
            <source srcSet="/profile-photo.jpg" type="image/jpeg" />
            <img 
              src="/profile-photo.png" 
              alt={`${currentContent?.about?.display_name || 'Profile'}'s profile photo`}
              className="profile-photo"
            />
          </picture>
          <div className="header-text">
            <h1>{currentContent?.about?.display_name || 'Loading...'}</h1>
            <div className="contact-header">
              <p>📍 {currentContent?.about?.location || 'Loading...'}</p>
              <p>📧 <a href={`mailto:${currentContent?.about?.email || ''}`}>{currentContent?.about?.email || 'Loading...'}</a></p>
              <p><LinkedInIcon /> <a href={currentContent?.about?.social_links?.linkedin || '#'} target="_blank" rel="noopener noreferrer">LinkedIn</a></p>
            </div>
            {currentContent?.about?.welcome_message && (
              <div className="welcome-message">
                <Typewriter 
                  text={currentContent.about.welcome_message}
                  speed={40}
                  delay={500}
                  className="welcome-typewriter"
                  showSkip={false}
                />
              </div>
            )}
          </div>
        </div>
      </header>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {isLoading && (
        <div className="loading-message">
          Loading content...
        </div>
      )}

      {!isLoading && currentContent && (
      <main>
        <SectionNav 
          activeSection={activeSection}
          onSectionChange={setActiveSection}
        />

        {activeSection === 'about' && (
          <>
            <section className="section-content about-section">
              <div className="about-content">
                <About 
                  onRegenerate={fetchUsageInfo} 
                  content={currentContent?.about}
                />
              </div>
            </section>
            <div className="section-button-group">
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
          </>
        )}

        {['experience', 'education', 'projects', 'music'].includes(activeSection) && (
          <div>
            <Portfolio 
              activeSection={activeSection} 
              content={currentContent?.portfolio}
            />
            <div className="section-button-group">
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
          </div>
        )}
        {activeSection === 'skills' && (
          <div>
            <Skills skills={currentContent?.skills} />
            <div className="section-button-group">
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
          </div>
        )}
      </main>
      )}
    </div>
  )
}

export default App
