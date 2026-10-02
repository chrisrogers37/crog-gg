import { useEffect } from "react";
import { useContentStore } from "../store";

/**
 * Loads the content once, at the app root (Layout). Each part's load is in
 * the store (`useLoad`), since each section shows its own (#190 M23).
 */
export function useContentLoader() {
  const loadContent = useContentStore((state) => state.loadContent);

  useEffect(() => {
    loadContent();
  }, [loadContent]);
}
