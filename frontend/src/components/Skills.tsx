import { defaultResume } from '../data/resume';
import { useMemo } from 'react';

// Function to shuffle an array
const shuffleArray = (array: any[]) => {
  let currentIndex = array.length, randomIndex;
  while (currentIndex !== 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex], array[currentIndex]];
  }
  return array;
};

export default function Skills() {
  const skills = defaultResume.skills;

  const shuffledSkills = useMemo(() => shuffleArray([...skills]), [skills]);

  // Normalize weights to a font size range (e.g., 12px to 36px)
  const minFontSize = 12;
  const maxFontSize = 36;
  const minWeight = Math.min(...skills.map(s => s.weight));
  const maxWeight = Math.max(...skills.map(s => s.weight));

  const getFontSize = (weight: number) => {
    if (maxWeight === minWeight) {
      return (minFontSize + maxFontSize) / 2;
    }
    const size = minFontSize + ((weight - minWeight) / (maxWeight - minWeight)) * (maxFontSize - minFontSize);
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