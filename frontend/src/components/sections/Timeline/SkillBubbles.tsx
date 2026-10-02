import { motion, AnimatePresence } from "framer-motion";
import { SkillCategory } from "../../../types/Timeline";
import { skillColor } from "../../../utils/skillColor";

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
        {activeSkills.map((skill) => {
          const color = skillColor(skillColorMap[skill]);
          return (
            <motion.span
              key={skill}
              className="skill-bubble"
              // 20 and 40 are alpha pairs: a light tint, and a stronger border.
              style={{
                backgroundColor: `${color}20`,
                color,
                borderColor: `${color}40`,
              }}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.3 }}
            >
              {skill}
            </motion.span>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
