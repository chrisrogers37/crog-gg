import { useState, useEffect, useRef } from 'react';

interface TypewriterProps {
  text: string;
  speed?: number;
  delay?: number;
  onComplete?: () => void;
  className?: string;
  showSkip?: boolean;
}

export default function Typewriter({ 
  text, 
  speed = 50, 
  delay = 500, 
  onComplete, 
  className = '', 
  showSkip = true 
}: TypewriterProps) {
  const [displayText, setDisplayText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const [containerHeight, setContainerHeight] = useState<number | null>(null);
  const hiddenRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Calculate the final height using a hidden element
    if (hiddenRef.current) {
      const height = hiddenRef.current.offsetHeight;
      setContainerHeight(height);
    }
  }, [text]);

  useEffect(() => {
    // Reset when text changes
    setDisplayText('');
    setCurrentIndex(0);
    setIsTyping(false);

    // Start typing after delay
    const startTimer = setTimeout(() => {
      setIsTyping(true);
    }, delay);

    return () => clearTimeout(startTimer);
  }, [text, delay]);

  useEffect(() => {
    if (!isTyping) return;

    if (currentIndex < text.length) {
      const timer = setTimeout(() => {
        setDisplayText(prev => prev + text[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, speed);

      return () => clearTimeout(timer);
    } else {
      setIsTyping(false);
      onComplete?.();
    }
  }, [currentIndex, text, speed, isTyping, onComplete]);

  const handleSkip = () => {
    setIsTyping(false);
    setDisplayText(text);
    setCurrentIndex(text.length);
    onComplete?.();
  };

  return (
    <div className={`typewriter ${className}`}>
      {/* Hidden element to calculate final height */}
      <div 
        ref={hiddenRef}
        className="typewriter-hidden-calc"
        style={{ 
          position: 'absolute', 
          visibility: 'hidden', 
          whiteSpace: 'pre-wrap',
          wordWrap: 'break-word',
          lineHeight: '1.7',
          color: 'var(--text-color)'
        }}
      >
        {text}
      </div>
      
      {/* Visible container with fixed height */}
      <div 
        className="typewriter-text"
        style={{ 
          height: containerHeight ? `${containerHeight}px` : 'auto',
          overflow: 'hidden'
        }}
      >
        {isTyping ? (
          <>
            {displayText}
            <span className="typewriter-cursor">|</span>
          </>
        ) : (
          text
        )}
      </div>
      
      {isTyping && showSkip && (
        <div className="typewriter-skip-container">
          <button 
            className="typewriter-skip-btn"
            onClick={handleSkip}
            title="Skip typing animation"
          >
            Skip
          </button>
        </div>
      )}
    </div>
  );
} 