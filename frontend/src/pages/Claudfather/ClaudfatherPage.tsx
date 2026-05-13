import { useParams, Link, Navigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { Star } from "lucide-react";
import "./ClaudfatherPage.css";

function GitHubIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
    </svg>
  );
}

const SUB_PAGES: Record<
  string,
  {
    title: string;
    tagline: string;
    github: string;
    description: string;
    features: string[];
    cli: { comment: string; command: string }[];
  }
> = {
  claudlobby: {
    title: "Claudlobby",
    tagline: "Fleet compositor for Claude Code agent teams",
    github: "https://github.com/Claudfather/Claudlobby",
    description:
      "Transforms a single fleet.yaml config and a shared library of expertise, skills, and guardrails into fully runnable bot directories. Each bot gets its own identity, MCP servers, memory, and systemd supervision.",
    features: [
      "Compose bots from shared building blocks: expertise, skills, guardrails, protocols",
      "Per-bot CLAUDE.md, .mcp.json, and bot.conf generated from fleet.yaml",
      "Systemd/launchd supervision with keepalive watchdogs",
      "Fleet-wide drift detection and promotion workflow",
      "Interactive bot scaffolding wizard",
    ],
    cli: [
      { comment: "# validate your fleet config", command: "claudlobby validate" },
      { comment: "# generate all bot directories", command: "claudlobby generate" },
      { comment: "# see what changed since last generate", command: "claudlobby diff" },
      { comment: "# scaffold a new bot interactively", command: "claudlobby new-bot" },
    ],
  },
  claudna: {
    title: "clauDNA",
    tagline: "Canonical skills library for Claude Code agents",
    github: "https://github.com/Claudfather/clauDNA",
    description:
      "A Claude Code plugin providing 50+ composable skills that agents can invoke as slash commands. Skills range from code review and simplification to deployment workflows and database operations.",
    features: [
      "50+ skills covering engineering, ops, data, and analysis workflows",
      "Install as a Claude Code plugin — skills appear as /slash-commands",
      "Specialized subagents: dbt-engineer, code-reviewer, neon-analyst, and more",
      "Works standalone or composed into bots via claudlobby",
    ],
    cli: [
      { comment: "# install the plugin", command: "claude plugins add claudna@Claudfather" },
      { comment: "# use a skill", command: "/claudna:neon-query SELECT * FROM users LIMIT 5" },
      { comment: "# review code quality", command: "/claudna:review" },
      { comment: "# simplify your changes", command: "/simplify" },
    ],
  },
  claudosseum: {
    title: "Claudosseum",
    tagline: "Evaluation engine for agent performance",
    github: "https://github.com/Claudfather/Claudosseum",
    description:
      "Benchmarks and evaluates agent behavior across real-world tasks. Measures code quality, task completion, instruction adherence, and fleet coordination patterns.",
    features: [
      "Task-based evaluation harness for Claude Code agents",
      "Measures code quality, correctness, and efficiency",
      "Tracks instruction adherence and guardrail compliance",
      "Fleet-level coordination and handoff analysis",
    ],
    cli: [
      { comment: "# run an evaluation suite", command: "claudosseum run --suite code-quality" },
      { comment: "# compare agent performance", command: "claudosseum compare --baseline v1 --candidate v2" },
      { comment: "# generate a report", command: "claudosseum report --format markdown" },
    ],
  },
};

function SubPage({ slug }: { slug: string }) {
  const page = SUB_PAGES[slug];
  if (!page) return <Navigate to="/claudfather" replace />;

  return (
    <motion.div
      className="claudfather-page"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Helmet>
        <title>{page.title} — Claudfather</title>
      </Helmet>
      <Link to="/claudfather" className="claudfather-back">
        &larr; Back to Claudfather
      </Link>
      <h1 className="claudfather-title">{page.title}</h1>
      <p className="claudfather-tagline">{page.tagline}</p>
      <p className="claudfather-body">{page.description}</p>

      <ul className="feature-list">
        {page.features.map((f) => (
          <li key={f}>{f}</li>
        ))}
      </ul>

      <div className="cli-block">
        <code>
          {page.cli.map((line, i) => (
            <div key={i}>
              <span className="cli-comment">{line.comment}</span>
              {"\n"}
              <span className="cli-command">$ {line.command}</span>
              {i < page.cli.length - 1 && "\n\n"}
            </div>
          ))}
        </code>
      </div>

      <a
        href={page.github}
        target="_blank"
        rel="noopener noreferrer"
        className="github-cta"
      >
        <GitHubIcon />
        <Star size={14} />
        <span>Star on GitHub</span>
      </a>
    </motion.div>
  );
}

export function ClaudfatherPage() {
  const { sub } = useParams<{ sub?: string }>();

  if (sub) {
    return <SubPage slug={sub} />;
  }

  return (
    <motion.div
      className="claudfather-page"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Helmet>
        <title>Claudfather — AI Agent Fleet Ecosystem</title>
      </Helmet>
      <h1 className="claudfather-title">Claudfather</h1>
      <p className="claudfather-tagline">
        an ecosystem for running autonomous Claude Code agent fleets on cheap
        hardware
      </p>
      <p className="claudfather-body">
        Three open-source projects that work together: a fleet compositor, a
        skills library, and an evaluation engine. Built to make it trivial to
        run a team of distinct, cooperating AI agents.
      </p>

      <div className="claudfather-grid">
        {Object.entries(SUB_PAGES).map(([slug, page]) => (
          <Link
            key={slug}
            to={`/claudfather/${slug}`}
            className="claudfather-product-card"
          >
            <h2>{page.title}</h2>
            <p>{page.tagline}</p>
          </Link>
        ))}
      </div>

      <div style={{ marginTop: "2rem" }}>
        <a
          href="https://github.com/Claudfather"
          target="_blank"
          rel="noopener noreferrer"
          className="github-cta"
        >
          <GitHubIcon />
          <span>Claudfather on GitHub</span>
        </a>
      </div>
    </motion.div>
  );
}
