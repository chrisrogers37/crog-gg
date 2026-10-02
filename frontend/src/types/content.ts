import { BioData } from "./Bio";
import { Employment } from "./Experience";
import { Education } from "./Education";
import { Skill } from "./Skills";
import { TimelineData } from "./Timeline";

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
  timeline: TimelineData | null;
}
