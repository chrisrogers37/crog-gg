/**
 * Evergreen portfolio copy. The website owns current demos/onboarding;
 * repositories own installation, capabilities and releases. No live inventory.
 * Public role evidence is pinned; never cite a private implementation here.
 */
import { CLAUDLOBBY_REPO } from "./links";

export type WebsiteDestination = {
  state: "preview" | "live";
  url: string;
  label: string;
  caveat: string;
};

export type FamilyProject = {
  id: string;
  job: string;
  name: string;
  description: string;
  repo: string | null;
  source: string;
  asOf: string;
};

const roleEvidence = {
  source:
    "https://github.com/Claudfather/.github/blob/f207100cf15729c33ea8d74116f1755f1e27cc4e/BRAND.md#names-and-roles",
  asOf: "2026-10-10",
};

export const claudfather = {
  mark: {
    photo: "/profile-photos/claudfather",
    alt: "Claudfather, a robot in a fedora",
  },
  organization: "https://github.com/Claudfather",
  // Switch URL, label and caveat together after verifying the public launch.
  // Reachability alone does not establish real onboarding. null hides the link.
  website: {
    state: "preview",
    url: "https://claudfather-ai.vercel.app",
    label: "Explore the preview",
    caveat:
      "Development preview with synthetic data. It does not run a real team.",
  } as WebsiteDestination | null,
  hero: {
    headline: "Build a team of AI workers.",
    sub: "Tools for running a team, giving it reusable workflows, and keeping what it learns. For solo founders and small teams.",
    status: "Early alpha",
    cta: "See how it works",
  },
  workflow: {
    heading: "How the pieces fit",
    intro:
      "The pieces have different jobs. Use the project that fits the work you want to do.",
    label: "Illustrative workflow",
    caveat:
      "These tools can be used independently. This is an example of how you might use them together, not a recorded run or an automatic integration.",
    steps: [
      {
        title: "Define the work",
        body: "Choose a task and a reusable engineering workflow.",
      },
      {
        title: "Run the workers",
        body: "Compose a fleet with Claudlobby and inspect its plan before activating it.",
      },
      {
        title: "Keep and evaluate the result",
        body: "Use durable knowledge and evaluation tools where they fit your workflow.",
      },
    ],
  },
  family: [
    {
      id: "claudlobby",
      job: "Run your team",
      name: "Claudlobby",
      description:
        "Compose, install and supervise a fleet of workers. Plane is its shared operational view.",
      repo: CLAUDLOBBY_REPO,
      ...roleEvidence,
    },
    {
      id: "claudna",
      job: "Give it a workflow",
      name: "clauDNA",
      description:
        "Reusable engineering workflows, skills, agents and hooks, also useful on their own.",
      repo: "https://github.com/Claudfather/clauDNA",
      ...roleEvidence,
    },
    {
      id: "claudron",
      job: "Keep what it learns",
      name: "Claudron",
      description:
        "Capture and recall durable knowledge in Markdown vaults, also useful on its own.",
      repo: "https://github.com/Claudfather/Claudron",
      ...roleEvidence,
    },
    {
      id: "claudosseum",
      job: "Evaluate workflows",
      name: "Claudosseum",
      description: "Compare skills and experiments.",
      repo: null,
      ...roleEvidence,
    },
  ] satisfies FamilyProject[],
  why: {
    heading: "Why I'm building it",
    body: "The project explores a practical question: how can a small team give AI workers useful workflows, shared knowledge and a way to improve?",
  },
  start: {
    heading: "Get started",
    intro:
      "Explore the product experience, or follow the setup guide to build a local fleet with Claudlobby.",
    setupLabel: "Set up a local fleet with Claudlobby",
  },
  follow: {
    heading: "Follow the projects",
    intro:
      "Each project keeps its own setup guides, release notes and current plans. Follow those sources for what works today.",
  },
};
