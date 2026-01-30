import { useCallback } from 'react';
import { useContentStore, useUIStore } from '../store';

/**
 * Hook for content regeneration functionality.
 *
 * Provides handlers for regenerating and resetting content,
 * along with relevant state.
 *
 * @example
 * function RegenerateButton() {
 *   const { regenerate, reset, isRegenerating, hasModifiedContent } = useRegeneration();
 *
 *   return (
 *     <button onClick={() => regenerate(false)} disabled={isRegenerating}>
 *       Regenerate
 *     </button>
 *   );
 * }
 */
export function useRegeneration() {
  const regenerateContent = useContentStore((state) => state.regenerateContent);
  const resetContent = useContentStore((state) => state.resetContent);
  const isRegenerating = useContentStore((state) => state.isRegenerating);
  const hasModifiedContent = useContentStore((state) => state.hasModifiedContent);
  const activeSection = useUIStore((state) => state.activeSection);

  const regenerate = useCallback(
    (useFantasy: boolean = true) => {
      regenerateContent(useFantasy);
    },
    [regenerateContent]
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
  };
}
