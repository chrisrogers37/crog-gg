// Barrel export for store
export {
  useContentStore,
  useBio,
  useProjects,
  useLoad,
  useRegenerationError,
  useTimeline,
  useShowcase,
} from "./contentStore";
export type { Load, LoadedContent } from "./contentStore";

export {
  useUIStore,
  useTheme,
  useIsMobileMenuOpen,
} from "./uiStore";
