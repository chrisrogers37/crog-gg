import { useState, useEffect } from 'react';
import { CSSTransition } from 'react-transition-group';
import { defaultResume } from '../data/resume';
import '../styles/transitions.css';

interface AboutProps {
  onRegenerate: () => void;
  content?: typeof defaultResume.about;
}

type AboutContent = typeof defaultResume.about;

function About({ onRegenerate, content: propContent }: AboutProps) {
  const [content, setContent] = useState<AboutContent>(propContent || defaultResume.about);
  const [isLoading, setIsLoading] = useState(false);
  const [bioInProp, setBioInProp] = useState(true);

  // Update content when prop changes
  useEffect(() => {
    if (propContent) {
      setContent(propContent);
    }
  }, [propContent]);

  useEffect(() => {
    // Listen for content regeneration events
    const handleContentRegenerated = (event: CustomEvent) => {
      if (event.detail.section === 'about') {
        setBioInProp(false);
        setIsLoading(true);
        setTimeout(() => {
          const newContent = event.detail.content;
          setContent(newContent);
          const updateEvent = new CustomEvent('contentUpdated', {
            detail: {
              section: 'about',
              content: newContent
            }
          });
          window.dispatchEvent(updateEvent);
          setTimeout(() => {
            setBioInProp(true);
            setIsLoading(false);
            onRegenerate();
          }, 100);
        }, 500);
      }
    };
    window.addEventListener('contentRegenerated', handleContentRegenerated as EventListener);
    return () => {
      window.removeEventListener('contentRegenerated', handleContentRegenerated as EventListener);
    };
  }, [onRegenerate]);

  useEffect(() => {
    const event = new CustomEvent('contentUpdated', {
      detail: {
        section: 'about',
        content
      }
    });
    window.dispatchEvent(event);
  }, [content]);

  return (
    <div className="about-section">
      <div className="about-content">
        <div className="bio-container">
          <CSSTransition
            in={bioInProp}
            timeout={500}
            classNames="fade"
            unmountOnExit={false}
          >
            <div className="bio">
              {content.bio.split('\n\n').map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>
          </CSSTransition>
          {isLoading && (
            <div className="loading-overlay">
              <div className="spinner" />
            </div>
          )}
        </div>
        {/* Only show contact/social info here if desired */}
      </div>
    </div>
  );
}

export default About; 