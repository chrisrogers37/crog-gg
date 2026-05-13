import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useProjects } from "../../../store";
import { ProjectCard } from "./ProjectCard";
import "./Projects.css";

function ClaudfatherIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2L2 7l10 5 10-5-10-5z" />
      <path d="M2 17l10 5 10-5" />
      <path d="M2 12l10 5 10-5" />
    </svg>
  );
}

export function ProjectSkeletonGrid() {
  return (
    <div className="projects-grid" role="status" aria-label="Loading projects">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="project-tile skeleton-tile" aria-hidden="true">
          <div className="project-tile-header skeleton-header" />
          <div className="project-tile-body">
            <div className="skeleton-line skeleton-title-line" />
            <div className="skeleton-line skeleton-desc-line-1" />
            <div className="skeleton-line skeleton-desc-line-2" />
            <div className="project-tile-tech">
              <span className="skeleton-pill" />
              <span className="skeleton-pill" />
              <span className="skeleton-pill" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function Projects() {
  const projects = useProjects();

  if (!projects || projects.length === 0) {
    return (
      <section className="projects-section">
        <ProjectSkeletonGrid />
      </section>
    );
  }

  // Filter out the generic github link card
  const sideProjects = projects.filter((p) => p.id !== "github");

  return (
    <section className="projects-section">
      {/* Tier 1 — Claudfather ecosystem */}
      <motion.div
        className="projects-tier1"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        <Link to="/claudfather" className="tier1-card">
          <div className="tier1-header">
            <div className="tier1-icon">
              <ClaudfatherIcon />
            </div>
            <div>
              <h3 className="tier1-title">Claudfather</h3>
              <p className="tier1-tagline">
                autonomous agent fleet ecosystem
              </p>
            </div>
          </div>
          <p className="tier1-description">
            An open-source ecosystem for running autonomous Claude Code agent
            fleets on cheap hardware. The fleet that builds this site.
          </p>
          <div className="tier1-subprojects">
            <span className="tier1-subproject">claudlobby</span>
            <span className="tier1-subproject">clauDNA</span>
            <span className="tier1-subproject">claudosseum</span>
          </div>
        </Link>
      </motion.div>

      {/* Tier 2 — side projects */}
      <p className="tier2-label">side projects</p>
      <div className="projects-grid">
        {sideProjects.map((project, i) => (
          <motion.div
            key={project.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: i * 0.08 }}
          >
            <ProjectCard project={project} />
          </motion.div>
        ))}
      </div>
    </section>
  );
}
