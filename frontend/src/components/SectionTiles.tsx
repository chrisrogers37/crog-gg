import { motion } from "framer-motion";
import "./SectionTiles.css";

type SectionTilesProps = {
  onSectionChange: (section: string) => void;
};

const tiles = [
  {
    id: "about",
    label: "About",
    description: "who i am and what i do",
    icon: "👋",
  },
  {
    id: "journey",
    label: "Journey",
    description: "where i've been and what i've learned",
    icon: "🗺️",
  },
  {
    id: "projects",
    label: "Projects",
    description: "things i've built",
    icon: "🛠️",
  },
  {
    id: "music",
    label: "Music",
    description: "songs and sounds",
    icon: "🎵",
  },
];

export function SectionTiles({ onSectionChange }: SectionTilesProps) {
  return (
    <div className="section-tiles">
      {tiles.map((tile, index) => (
        <motion.button
          key={tile.id}
          className="section-tile"
          onClick={() => onSectionChange(tile.id)}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: index * 0.08 }}
        >
          <span className="section-tile-icon">{tile.icon}</span>
          <span className="section-tile-label">{tile.label}</span>
          <span className="section-tile-desc">{tile.description}</span>
        </motion.button>
      ))}
    </div>
  );
}
