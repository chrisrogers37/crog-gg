import { useEffect } from "react";
import { useContentStore } from "../store";

/**
 * Hook to load content on component mount.
 *
 * This hook should be called once at the app root level
 * to initialize the content store from YAML files.
 *
 * @example
 * function App() {
 *   useContentLoader();
 *   // ... rest of app
 * }
 */
export function useContentLoader() {
  const loadContent = useContentStore((state) => state.loadContent);
  const isLoading = useContentStore((state) => state.isLoading);
  const error = useContentStore((state) => state.error);

  useEffect(() => {
    loadContent();
  }, [loadContent]);

  return { isLoading, error };
}
