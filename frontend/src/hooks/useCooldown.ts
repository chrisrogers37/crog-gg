import { useEffect, useState } from "react";
import { useContentStore } from "../store";

/** Whole seconds until `endsAt`, never negative. */
const secondsUntil = (endsAt: number | null) =>
  endsAt === null ? 0 : Math.max(0, Math.ceil((endsAt - Date.now()) / 1000));

/**
 * The regenerate button's WoW-style cooldown, from the server's numbers held in
 * the store (#196 M44): the seconds left, the "ready" flash when a running
 * cooldown runs out, and whether the daily cap has been reached. The button
 * calls it itself, so the countdown re-renders the button, not the page.
 */
export function useCooldown() {
  const endsAt = useContentStore((state) => state.cooldownEndsAt);
  const total = useContentStore((state) => state.cooldownTotal);
  const dailyCapReached = useContentStore((state) => state.dailyCapReached);
  // Set once a second while counting, so the number on screen moves.
  const [, setSecondsLeft] = useState(0);
  const [isReady, setIsReady] = useState(false);

  // Once per page load, when the button first shows: a cooldown the server
  // started before a reload would otherwise show a ready button it refuses.
  useEffect(() => {
    const { limitsRequested, syncCooldown } = useContentStore.getState();
    if (!limitsRequested) void syncCooldown();
  }, []);

  useEffect(() => {
    if (endsAt === null || secondsUntil(endsAt) === 0) return;
    let timer: ReturnType<typeof setTimeout>;
    // Wake on each second boundary, which is when the number on screen changes.
    const untilNextSecond = () => (endsAt - Date.now()) % 1000 || 1000;
    const tick = () => {
      const left = secondsUntil(endsAt);
      setSecondsLeft(left);
      if (left > 0) {
        timer = setTimeout(tick, untilNextSecond());
      } else {
        setIsReady(true);
        // Clear the "ready" flash after the animation plays
        timer = setTimeout(() => setIsReady(false), 1500);
      }
    };
    timer = setTimeout(tick, untilNextSecond());
    return () => {
      clearTimeout(timer);
      setIsReady(false);
    };
  }, [endsAt]);

  const remaining = secondsUntil(endsAt);
  return {
    remaining,
    total,
    isOnCooldown: remaining > 0,
    isReady,
    dailyCapReached,
  };
}
