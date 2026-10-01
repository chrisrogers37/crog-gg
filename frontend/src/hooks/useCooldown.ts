import { useEffect, useState } from "react";
import { useContentStore } from "../store";

/**
 * The regenerate button's WoW-style cooldown: the seconds left on the server's
 * cooldown (held in the store, #196 M44), and a "ready" flash when a running
 * one runs out.
 */
export function useCooldown() {
  const endsAt = useContentStore((state) => state.cooldownEndsAt);
  const total = useContentStore((state) => state.cooldownTotal);
  // Whole seconds, so a tick that changes nothing on screen renders nothing.
  const [, setSecondsLeft] = useState(0);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (endsAt === null || endsAt <= Date.now()) return;
    setIsReady(false);
    let flash: ReturnType<typeof setTimeout> | undefined;
    const interval = setInterval(() => {
      const left = Math.ceil((endsAt - Date.now()) / 1000);
      setSecondsLeft(left);
      if (left <= 0) {
        clearInterval(interval);
        setIsReady(true);
        // Clear the "ready" flash after the animation plays
        flash = setTimeout(() => setIsReady(false), 1500);
      }
    }, 100); // Update frequently for smooth sweep
    return () => {
      clearInterval(interval);
      clearTimeout(flash);
      setIsReady(false);
    };
  }, [endsAt]);

  const remaining =
    endsAt === null ? 0 : Math.max(0, Math.ceil((endsAt - Date.now()) / 1000));

  return {
    remaining,
    total,
    isOnCooldown: remaining > 0,
    isReady,
  };
}
