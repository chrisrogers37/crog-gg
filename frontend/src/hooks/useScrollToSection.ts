import { useRef, useCallback } from 'react';

/**
 * Hook for smooth scrolling to section content.
 *
 * Returns a ref to attach to the content container and
 * a function to trigger scrolling.
 *
 * @example
 * function Page() {
 *   const { contentRef, scrollToContent } = useScrollToSection();
 *
 *   return (
 *     <div>
 *       <button onClick={scrollToContent}>Go to content</button>
 *       <main ref={contentRef}>Content here</main>
 *     </div>
 *   );
 * }
 */
export function useScrollToSection() {
  const contentRef = useRef<HTMLDivElement>(null);
  const isFirstInteraction = useRef(true);

  const scrollToContent = useCallback(() => {
    // Don't scroll on first interaction (page load)
    if (isFirstInteraction.current) {
      isFirstInteraction.current = false;
      return;
    }

    if (contentRef.current) {
      contentRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  return { contentRef, scrollToContent };
}
