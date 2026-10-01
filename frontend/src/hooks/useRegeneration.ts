import { useCallback } from "react";
import { useContentStore } from "../store";
import { useCooldown } from "./useCooldown";

/**
 * Hook for content regeneration functionality with WoW-style cooldown.
 *
 * Provides handlers for regenerating and resetting content,
 * along with relevant state and cooldown timer info.
 */
export function useRegeneration() {
  const regenerateContent = useContentStore((state) => state.regenerateContent);
  const resetContent = useContentStore((state) => state.resetContent);
  const isRegenerating = useContentStore((state) => state.isRegenerating);
  const hasModifiedContent = useContentStore(
    (state) => state.hasModifiedContent,
  );

  const { remaining, total, isOnCooldown, isReady } = useCooldown();

  const regenerate = useCallback(
    (useFantasy: boolean = true) => {
      if (isOnCooldown) return;
      regenerateContent(useFantasy);
    },
    [regenerateContent, isOnCooldown],
  );

  const reset = useCallback(() => {
    resetContent();
  }, [resetContent]);

  return {
    regenerate,
    reset,
    isRegenerating,
    hasModifiedContent,
    cooldownRemaining: remaining,
    cooldownTotal: total,
    isReady,
  };
}
