import { useState, useRef, useCallback, useEffect } from "react";

const COOLDOWN_DURATION = 30; // seconds

/**
 * Hook for WoW-style ability cooldown timer.
 *
 * Returns remaining seconds, total duration, whether the ability
 * just became ready (for the flash effect), and a trigger function.
 */
export function useCooldown() {
  const [remaining, setRemaining] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const endTimeRef = useRef<number>(0);

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const startCooldown = useCallback(() => {
    clearTimer();
    setIsReady(false);

    const now = Date.now();
    endTimeRef.current = now + COOLDOWN_DURATION * 1000;
    setRemaining(COOLDOWN_DURATION);

    intervalRef.current = setInterval(() => {
      const left = Math.max(
        0,
        Math.ceil((endTimeRef.current - Date.now()) / 1000),
      );
      setRemaining(left);

      if (left <= 0) {
        clearTimer();
        setIsReady(true);
        // Clear the "ready" flash after the animation plays
        setTimeout(() => setIsReady(false), 1500);
      }
    }, 100); // Update frequently for smooth sweep
  }, [clearTimer]);

  const isOnCooldown = remaining > 0;

  // Cleanup on unmount
  useEffect(() => {
    return () => clearTimer();
  }, [clearTimer]);

  return {
    remaining,
    total: COOLDOWN_DURATION,
    isOnCooldown,
    isReady,
    startCooldown,
  };
}
