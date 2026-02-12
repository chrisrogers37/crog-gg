import { motion, AnimatePresence } from "framer-motion";
import { SkillCategory } from "../../../types/Timeline";

type SkillBubblesProps = {
  activeSkills: string[];
  skillCategories: Record<string, SkillCategory>;
};

export function SkillBubbles({
  activeSkills,
  skillCategories,
}: SkillBubblesProps) {
  // Build a map of skill -> color from categories
  const skillColorMap: Record<string, string> = {};
  Object.values(skillCategories).forEach((category) => {
    category.skills.forEach((skill) => {
      skillColorMap[skill] = category.color;
    });
  });

  return (
    <div className="skill-bubbles">
      <AnimatePresence>
        {activeSkills.map((skill) => (
          <motion.span
            key={skill}
            className="skill-bubble"
            style={{
              backgroundColor: `${skillColorMap[skill] || "#6B7280"}20`,
              color: skillColorMap[skill] || "#6B7280",
              borderColor: `${skillColorMap[skill] || "#6B7280"}40`,
            }}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.3 }}
          >
            {skill}
          </motion.span>
        ))}
      </AnimatePresence>
    </div>
  );
}
