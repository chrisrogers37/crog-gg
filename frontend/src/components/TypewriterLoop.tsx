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

/** Up to this much is added to `initialDelay`, so the start isn't mechanical. */
const INITIAL_DELAY_JITTER_MS = 3000;

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

  // The initial delay: `initialDelay`, plus up to INITIAL_DELAY_JITTER_MS.
  // (It used to ignore the prop and wait 1-4 s whatever was passed, #193.)
  useEffect(() => {
    if (phase !== "initial") return;

    const delay =
      initialDelay + Math.floor(Math.random() * INITIAL_DELAY_JITTER_MS);
    const timer = setTimeout(() => {
      setPhase("typing");
    }, delay);
    return () => clearTimeout(timer);
  }, [phase, initialDelay]);

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

  return (
    <div className={`typewriter typewriter-loop ${className}`}>
      {/*
        Height floor. Every message is rendered into the same grid cell as the
        live text, so the box is always as tall as the tallest of them would be
        at the current width, and does not change as characters are typed.

        Without it the box is a function of whatever has been typed so far. The
        message loop then walks that length across a wrap boundary twice per
        message -- once typing, once deleting -- and every element below moves
        with it. On a phone that is the entire page, on a timer, for as long as
        the loop runs, with the visitor doing nothing.

        Sizing in CSS rather than by measuring one string into a pinned pixel
        height: it needs no effect and no state, it covers all nine messages
        rather than the longest guess, and it stays correct when the viewport is
        resized, which a measured height does not.
      */}
      <div className="typewriter-sizer" aria-hidden="true">
        {messages.map((message, index) => (
          <span key={index}>
            {message}
            {/* the cursor occupies width and is bold, so it has to be in the
                reservation or the last line can wrap short of the real one */}
            <span className="typewriter-cursor">|</span>
          </span>
        ))}
      </div>
      <div className="typewriter-text">
        {displayText}
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
      </div>
    </div>
  );
}
