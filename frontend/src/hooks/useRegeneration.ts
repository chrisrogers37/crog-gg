import { useCallback } from "react";
import { useContentStore } from "../store";

/**
 * Hook for content regeneration: handlers for regenerating and resetting the
 * content, and the state the page shows for them. Whether a press goes out is
 * the store's call (#196 M44), and the button reads its own cooldown.
 */
export function useRegeneration() {
  const regenerateContent = useContentStore((state) => state.regenerateContent);
  const resetContent = useContentStore((state) => state.resetContent);
  const isRegenerating = useContentStore((state) => state.isRegenerating);
  const hasModifiedContent = useContentStore(
    (state) => state.hasModifiedContent,
  );

  const regenerate = useCallback(
    (useFantasy: boolean = true) => {
      regenerateContent(useFantasy);
    },
    [regenerateContent],
  );

  const reset = useCallback(() => {
    resetContent();
  }, [resetContent]);

  return {
    regenerate,
    reset,
    isRegenerating,
    hasModifiedContent,
  };
}
