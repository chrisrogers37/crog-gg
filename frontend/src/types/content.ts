import { BioData } from "./Bio";
import { Employment } from "./Experience";
import { Education } from "./Education";
import { Skill } from "./Skills";

/**
 * Portfolio content state containing experience and education data
 */
export interface PortfolioContent {
  experience: Employment[];
  education: Education[];
}

/**
 * Complete content state for the application
 */
export interface ContentState {
  about: BioData;
  portfolio: PortfolioContent;
  skills: Skill[];
}

/**
 * Partial content state for updates
 */
export type PartialContentState = Partial<ContentState>;

/**
 * Props for components that receive content
 */
export interface ContentProps {
  content: ContentState | null;
  isLoading: boolean;
  error: string | null;
}

/**
 * Section identifiers for navigation
 */
export type SectionId =
  | "about"
  | "experience"
  | "education"
  | "projects"
  | "music"
  | "skills";

/**
 * Props for action buttons
 */
export interface ActionButtonsProps {
  onRegenerate: () => void;
  onReset: () => void;
  isRegenerating: boolean;
  hasModifiedContent: boolean;
}
