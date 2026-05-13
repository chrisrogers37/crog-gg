import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";

const SUB_PAGES: Record<
  string,
  { title: string; tagline: string; github: string }
> = {
  claudlobby: {
    title: "Claudlobby",
    tagline: "Fleet compositor for Claude Code agent teams",
    github: "https://github.com/Claudfather/Claudlobby",
  },
  claudna: {
    title: "clauDNA",
    tagline: "Canonical skills library for Claude Code agents",
    github: "https://github.com/Claudfather/clauDNA",
  },
  claudosseum: {
    title: "Claudosseum",
    tagline: "Evaluation engine for agent performance",
    github: "https://github.com/Claudfather/Claudosseum",
  },
};

function SubPage({ slug }: { slug: string }) {
  const page = SUB_PAGES[slug];
  if (!page) return null;

  return (
    <div className="max-w-3xl mx-auto px-6 py-20">
      <Helmet>
        <title>{page.title} — Claudfather</title>
      </Helmet>
      <Link
        to="/claudfather"
        className="text-text-secondary hover:text-teal-primary text-sm mb-8 inline-block"
      >
        &larr; Back to Claudfather
      </Link>
      <h1 className="font-heading text-4xl font-bold text-text-primary mb-4">
        {page.title}
      </h1>
      <p className="text-text-secondary text-lg mb-8 font-mono">
        {page.tagline}
      </p>
      <div className="card p-8">
        <p className="text-text-secondary">
          Detailed product page coming in Phase 2.
        </p>
        <a
          href={page.github}
          target="_blank"
          rel="noopener noreferrer"
          className="link mt-4 inline-block"
        >
          View on GitHub &rarr;
        </a>
      </div>
    </div>
  );
}

export function ClaudfatherPage() {
  const { sub } = useParams<{ sub?: string }>();

  if (sub && SUB_PAGES[sub]) {
    return <SubPage slug={sub} />;
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-20">
      <Helmet>
        <title>Claudfather — AI Agent Fleet Ecosystem</title>
      </Helmet>
      <h1 className="font-heading text-4xl font-bold text-text-primary mb-4">
        Claudfather
      </h1>
      <p className="text-text-secondary text-lg mb-12">
        An ecosystem for running autonomous Claude Code agent fleets on cheap
        hardware.
      </p>
      <div className="grid gap-6">
        {Object.entries(SUB_PAGES).map(([slug, page]) => (
          <Link
            key={slug}
            to={`/claudfather/${slug}`}
            className="card p-6 hover:border-teal-primary transition-colors"
          >
            <h2 className="font-heading text-xl font-bold text-text-primary mb-2">
              {page.title}
            </h2>
            <p className="text-text-secondary font-mono text-sm">
              {page.tagline}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
