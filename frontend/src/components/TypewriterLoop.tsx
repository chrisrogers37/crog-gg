import { useState, useEffect } from "react";

interface TypewriterLoopProps {
  messages: string[];
  typeSpeed?: number;
  deleteSpeed?: number;
  pauseTime?: number;
  initialDelay?: number;
  className?: string;
}

type Phase = "initial" | "typing" | "pausing" | "deleting" | "waiting";

// Add randomness to timing (±40% variance)
const randomize = (base: number, variance = 0.4): number => {
  const min = base * (1 - variance);
  const max = base * (1 + variance);
  return Math.floor(Math.random() * (max - min) + min);
};

export default function TypewriterLoop({
  messages,
  typeSpeed = 30,
  deleteSpeed = 20,
  pauseTime = 1500,
  initialDelay = 0,
  className = "",
}: TypewriterLoopProps) {
  const [displayText, setDisplayText] = useState("");
  const [messageIndex, setMessageIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>(
    initialDelay > 0 ? "initial" : "typing",
  );
  const [charIndex, setCharIndex] = useState(0);

  const currentMessage = messages[messageIndex];
  const isLastMessage = messageIndex === messages.length - 1;

  // Handle initial delay (random between 1-4 seconds)
  useEffect(() => {
    if (phase !== "initial") return;

    const randomInitialDelay = Math.floor(Math.random() * 3000) + 1000; // 1000-4000ms
    const timer = setTimeout(() => {
      setPhase("typing");
    }, randomInitialDelay);
    return () => clearTimeout(timer);
  }, [phase]);

  // Handle typing
  useEffect(() => {
    if (phase !== "typing") return;

    if (charIndex < currentMessage.length) {
      const timer = setTimeout(() => {
        setDisplayText(currentMessage.slice(0, charIndex + 1));
        setCharIndex((prev) => prev + 1);
      }, randomize(typeSpeed));
      return () => clearTimeout(timer);
    } else {
      // Done typing, start pausing
      setPhase("pausing");
    }
  }, [phase, charIndex, currentMessage, typeSpeed]);

  // Handle pausing (blinking cursor)
  useEffect(() => {
    if (phase !== "pausing") return;

    // If last message, stay here (don't delete)
    if (isLastMessage) return;

    const timer = setTimeout(
      () => {
        setPhase("deleting");
      },
      randomize(pauseTime, 0.25),
    );
    return () => clearTimeout(timer);
  }, [phase, pauseTime, isLastMessage]);

  // Handle deleting
  useEffect(() => {
    if (phase !== "deleting") return;

    if (displayText.length > 0) {
      const timer = setTimeout(
        () => {
          setDisplayText((prev) => prev.slice(0, -1));
        },
        randomize(deleteSpeed, 0.3),
      );
      return () => clearTimeout(timer);
    } else {
      // Done deleting, move to next message
      setPhase("waiting");
    }
  }, [phase, displayText, deleteSpeed]);

  // Handle waiting before next message (random 1-2 seconds with blinking cursor)
  useEffect(() => {
    if (phase !== "waiting") return;

    const randomWait = Math.floor(Math.random() * 1000) + 1000; // 1000-2000ms
    const timer = setTimeout(() => {
      setMessageIndex((prev) => prev + 1);
      setCharIndex(0);
      setPhase("typing");
    }, randomWait);
    return () => clearTimeout(timer);
  }, [phase]);

  const showCursor =
    phase === "initial" ||
    phase === "typing" ||
    phase === "pausing" ||
    phase === "deleting" ||
    phase === "waiting";

  return (
    <div className={`typewriter ${className}`}>
      <div className="typewriter-text">
        {displayText}
        {showCursor && (
          <span
            className="typewriter-cursor"
            style={{
              animation:
                phase === "pausing" ||
                phase === "initial" ||
                phase === "waiting"
                  ? "blink 0.7s infinite"
                  : "none",
              opacity:
                phase === "pausing" ||
                phase === "initial" ||
                phase === "waiting"
                  ? undefined
                  : 1,
            }}
          >
            |
          </span>
        )}
      </div>
    </div>
  );
}
