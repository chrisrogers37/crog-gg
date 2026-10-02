import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SkillCategory } from "../../../types/Timeline";
import { DEFAULT_SKILL_COLOR } from "../../../utils/skillColor";

type SkillBubblesProps = {
  activeSkills: string[];
  skillCategories: Record<string, SkillCategory>;
};

export function SkillBubbles({
  activeSkills,
  skillCategories,
}: SkillBubblesProps) {
  // Each skill's colour, from its category (already checked by timelineLoader).
  const colorBySkill = useMemo(() => {
    const colors: Record<string, string> = {};
    for (const category of Object.values(skillCategories)) {
      for (const skill of category.skills) colors[skill] = category.color;
    }
    return colors;
  }, [skillCategories]);

  return (
    <div className="skill-bubbles">
      <AnimatePresence>
        {activeSkills.map((skill) => {
          const color = colorBySkill[skill] ?? DEFAULT_SKILL_COLOR;
          return (
            <motion.span
              key={skill}
              className="skill-bubble"
              // 20 and 80 are alpha pairs: a light tint, and a border strong
              // enough to carry the category's colour; the text is the theme's.
              style={{
                backgroundColor: `${color}20`,
                borderColor: `${color}80`,
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
