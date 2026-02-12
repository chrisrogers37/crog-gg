import { motion } from "framer-motion";
import { BioData } from "../types/Bio";
import { TimelineData } from "../types/Timeline";
import { Project } from "../types";
import "./SectionPreviews.css";

type SectionPreviewsProps = {
  bio: BioData | null;
  timeline: TimelineData | null;
  projects: Project[];
  onSectionChange: (section: string) => void;
};

export function SectionPreviews({
  bio,
  timeline,
  projects,
  onSectionChange,
}: SectionPreviewsProps) {
  const aboutSnippet = bio?.about_text
    ? bio.about_text.split("\n").filter(Boolean)[0]
    : null;

  const latestRole = timeline?.entries
    ?.filter((e) => e.type === "role")
    ?.sort((a, b) => {
      const aDate = a.end_date === "present" ? "9999" : a.end_date;
      const bDate = b.end_date === "present" ? "9999" : b.end_date;
      return bDate.localeCompare(aDate);
    })?.[0];

  const featuredProjects = projects
    ?.filter((p) => p.featured && p.id !== "github")
    ?.sort((a, b) => a.order - b.order)
    ?.slice(0, 2);

  const previews = [
    {
      id: "about",
      label: "About",
      content: aboutSnippet,
    },
    {
      id: "journey",
      label: "Journey",
      content: latestRole
        ? `${latestRole.title} @ ${latestRole.organization} - ${latestRole.one_liner}`
        : null,
    },
    {
      id: "projects",
      label: "Projects",
      content:
        featuredProjects && featuredProjects.length > 0
          ? featuredProjects.map((p) => p.title).join(", ") + " and more"
          : null,
    },
    {
      id: "music",
      label: "Music",
      content: "production, djing, and audio engineering",
    },
  ];

  return (
    <div className="section-previews">
      {previews.map((preview, index) => (
        <motion.button
          key={preview.id}
          className="section-preview-card"
          onClick={() => onSectionChange(preview.id)}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: index * 0.08 }}
        >
          <span className="section-preview-label">{preview.label}</span>
          {preview.content && (
            <p className="section-preview-snippet">{preview.content}</p>
          )}
          <span className="section-preview-cta">explore &rarr;</span>
        </motion.button>
      ))}
    </div>
  );
}
