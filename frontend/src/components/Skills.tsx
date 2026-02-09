import { useMemo, useState, useEffect } from "react";
import { SkillsData } from "../types/Skills";

// Function to shuffle an array
const shuffleArray = <T,>(array: T[]): T[] => {
  let currentIndex = array.length,
    randomIndex;
  while (currentIndex !== 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex],
      array[currentIndex],
    ];
  }
  return array;
};

interface SkillsProps {
  skills?: SkillsData["skills"];
}

export default function Skills({ skills: propSkills }: SkillsProps) {
  const [skills] = useState(propSkills || []);

  useEffect(() => {
    // Listen for content regeneration events
    const handleContentRegenerated = (event: CustomEvent) => {
      if (event.detail.section === "portfolio") {
        // If portfolio is regenerated, we might want to update skills too
        // For now, we'll keep the original skills but could extend this later
        console.log("Portfolio regenerated, skills component notified");
      }
    };

    window.addEventListener(
      "contentRegenerated",
      handleContentRegenerated as EventListener,
    );
    return () => {
      window.removeEventListener(
        "contentRegenerated",
        handleContentRegenerated as EventListener,
      );
    };
  }, []);

  const shuffledSkills = useMemo(() => shuffleArray([...skills]), [skills]);

  // Normalize weights to a font size range (e.g., 12px to 36px)
  const minFontSize = 12;
  const maxFontSize = 36;

  // Add defensive programming for empty skills array
  if (!skills || skills.length === 0) {
    return (
      <div className="skills-container">
        <h3>Skills</h3>
        <p className="skills-subtitle">Loading skills...</p>
      </div>
    );
  }

  const minWeight = Math.min(...skills.map((s) => s.weight));
  const maxWeight = Math.max(...skills.map((s) => s.weight));

  const getFontSize = (weight: number) => {
    if (maxWeight === minWeight) {
      return (minFontSize + maxFontSize) / 2;
    }
    const size =
      minFontSize +
      ((weight - minWeight) / (maxWeight - minWeight)) *
        (maxFontSize - minFontSize);
    return Math.round(size);
  };

  return (
    <div className="skills-container">
      <h3>Skills</h3>
      <p className="skills-subtitle">
        A curated list of my key skills, sized by experience and proficiency.
      </p>
      <div className="word-cloud">
        {shuffledSkills.map((skill, index) => (
          <span
            key={index}
            className="skill-tag"
            style={{ fontSize: `${getFontSize(skill.weight)}px` }}
          >
            {skill.name}
          </span>
        ))}
      </div>
    </div>
  );
}
