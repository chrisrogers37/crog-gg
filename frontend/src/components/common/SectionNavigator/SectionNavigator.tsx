import { motion } from "framer-motion";
import "./SectionNavigator.css";

type SectionNavigatorProps = {
  nextSection: string | null;
  onNavigate: (section: string) => void;
};

export function SectionNavigator({
  nextSection,
  onNavigate,
}: SectionNavigatorProps) {
  if (!nextSection) return null;

  return (
    <motion.div
      className="section-navigator"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.5, duration: 0.4 }}
    >
      <button
        className="section-navigator-btn"
        onClick={() => onNavigate(nextSection)}
      >
        <span className="section-navigator-label">up next: {nextSection}</span>
        <span className="section-navigator-arrow">&#8595;</span>
      </button>
    </motion.div>
  );
}
