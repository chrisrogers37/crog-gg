/**
 * Homepage copy: Claudlobby, the front door of crog.gg (#173).
 *
 * A typed module rather than fetched YAML: it is bundled, so the hero renders
 * without waiting on a request, and a missing or misspelled field fails the
 * build's type check instead of reaching visitors. Shared URLs live in
 * links.ts. Wrap code terms in backticks; they render as <code>.
 *
 * Say only what the Claudlobby repo backs up (claudlobby.test.ts checks the
 * mechanical parts):
 * - no "open source" until the repo has a LICENSE (#179, Claudfather/Claudlobby#1996)
 * - Claude Code only today; nothing about other model providers except as roadmap
 * - every number keeps its source and as-of date, and matches that source
 */

type Step = { title: string; code: string; body: string };
type Point = { title: string; body: string };
type Count = { value: number; label: string };

export const claudlobby = {
  hero: {
    eyebrow: "Claudlobby · by Chris Rogers",
    headline: "i build things that build things.",
    sub: "Claudlobby is my agent fleet for running a software dark factory. One `fleet.yaml` composes manager, engineer and reviewer agents that work 24/7 on a Mac mini or a Raspberry Pi.",
    credibility:
      "By day I lead the data platform at Artemis. Before that, Citadel and Meta, and chemical engineering at Cornell.",
    aboutLink: "More about me",
    ctaStar: "Star on GitHub",
    ctaQuickstart: "Quickstart",
  },

  darkFactory: {
    heading: "What's a dark factory?",
    intro:
      "A factory that runs with the lights off. In software, that means agents plan the work, write the code, open the pull requests and review each other, while you set the goals and the guardrails.",
    steps: [
      {
        title: "Declare the fleet",
        code: "fleet.yaml",
        body: "Name each bot and the pieces it's built from: a persona, skills, MCP servers, guardrails and protocols, all from one shared library.",
      },
      {
        title: "Generate the bots",
        code: "claudlobby generate",
        body: "Each bot becomes a self-contained Claude Code workspace, with a systemd or launchd unit to keep it running.",
      },
      {
        title: "Let it run",
        code: "24/7",
        body: "A manager bot hands out work, workers open PRs and report back, and you follow along and steer from Telegram.",
      },
    ] satisfies Step[],
  },

  why: {
    heading: "Why Claudlobby",
    points: [
      {
        title: "Write it once, use it everywhere",
        body: "A guardrail, skill or protocol lives once in the library, and every bot that declares it gets it. Adding a bot is about ten lines of `fleet.yaml`.",
      },
      {
        title: "Runs on hardware you own",
        body: "Local-first, with no required hosted service. A Mac mini, a Linux box or a Raspberry Pi 5 is enough.",
      },
      {
        title: "Bots that learn",
        body: "Skills are shared, so an improvement one bot makes reaches every bot using that skill. `claudlobby diff` and `promote` pull the rest of a bot's changes back into the library.",
      },
    ] satisfies Point[],
    library: {
      heading: "In the library today",
      // Counted from the README's "What this repo gives you" list, and checked
      // against the repo tree (library/, README.md files excluded) that day.
      source:
        "https://github.com/Claudfather/Claudlobby/blob/1f61247c3febb9e13285687096bb7e8483f5dcad/README.md#what-this-repo-gives-you--and-doesnt",
      sourceLabel: "Claudlobby README",
      asOf: "2026-09-29",
      counts: [
        { value: 19, label: "expertise profiles" },
        { value: 54, label: "skills" },
        { value: 17, label: "MCP fragments" },
        { value: 25, label: "guardrails" },
        { value: 40, label: "protocols" },
      ] satisfies Count[],
    },
  },

  quickstart: {
    heading: "Quickstart",
    intro:
      "Clone the repo, install it, and let claudfather, the built-in setup assistant, walk you through the rest on Telegram.",
    prerequisitesHeading: "You'll need",
    prerequisites: [
      "Claude Code, signed in with Claude Max, Team or Enterprise, or an `ANTHROPIC_API_KEY`",
      "A Telegram account, a bot token from @BotFather and Claude Code's Telegram plugin",
      "A GitHub token for the bots to work with",
      "macOS or Linux with Python 3.10+, such as a Mac mini or a Raspberry Pi 5",
    ],
    commands: [
      "git clone https://github.com/Claudfather/Claudlobby.git",
      "cd Claudlobby",
      "python3 -m venv .venv",
      "source .venv/bin/activate",
      "python3 -m pip install -e '.[plane-ui]'",
      "claude",
    ].join("\n"),
    after:
      "Then type `/setup` in Claude Code. It checks your host, collects your credentials and starts claudfather on Telegram, where setup continues.",
    docsLink: "Full setup guide",
    readmeLink: "Quickstart in the README",
  },
};
