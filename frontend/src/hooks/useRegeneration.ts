import { useCallback } from "react";
import { useContentStore, useUIStore } from "../store";
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
  const activeSection = useUIStore((state) => state.activeSection);

  const { remaining, total, isOnCooldown, isReady, startCooldown } =
    useCooldown();

  const regenerate = useCallback(
    (useFantasy: boolean = true) => {
      if (isOnCooldown) return;
      regenerateContent(useFantasy);
      startCooldown();
    },
    [regenerateContent, isOnCooldown, startCooldown],
  );

  const reset = useCallback(() => {
    resetContent();
  }, [resetContent]);

  return {
    regenerate,
    reset,
    isRegenerating,
    hasModifiedContent,
    activeSection,
    cooldownRemaining: remaining,
    cooldownTotal: total,
    isReady,
    isOnCooldown,
  };
}
