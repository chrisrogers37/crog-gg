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

import { CLAUDLOBBY_REPO } from "./links";

type Step = { title: string; code: string; body: string };
type Point = { title: string; body: string };
type Count = { value: number; label: string };

export const claudlobby = {
  hero: {
    eyebrow: "Claudlobby · by Chris Rogers",
    headline: "i build things that build things.",
    sub: "Claudlobby is my agent fleet for running a software dark factory. One `fleet.yaml` composes manager, engineer and reviewer agents that work 24/7 on a Mac mini or a Raspberry Pi.",
    credibility:
      "Data platform lead by day. Before that, Citadel and Meta, and chemical engineering at Cornell.",
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
        title: "Plan, then activate",
        code: "claudlobby config plan",
        body: "Each bot is composed into a self-contained Claude Code workspace with a launchd or systemd unit, staged as a plan you review before you activate it.",
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
        body: "A guardrail, skill or protocol lives once in the library, and every bot that declares it gets it. Adding a bot is one stanza in `fleet.yaml`.",
      },
      {
        title: "Runs on hardware you own",
        body: "No Claudlobby service to sign up for: the fleet runs on your machine. A Mac mini, a Linux box or a Raspberry Pi 5 is enough.",
      },
      {
        title: "Bots that learn",
        body: "Skills are shared, so improving one improves every bot that uses it. Bots keep their own memory across rebuilds, and `claudlobby config diff --bot` shows what a bot has changed, so a good change can go back into the library.",
      },
    ] satisfies Point[],
    library: {
      heading: "In the library today",
      // Counted from the README's "What this repo gives you" list, and checked
      // against the repo tree (library/, README.md files excluded) that day.
      source: `${CLAUDLOBBY_REPO}/blob/c4682f7ace169ae69b2337eaabdfcbc12e64001e/README.md#what-this-repo-gives-you--and-doesnt`,
      sourceLabel: "Claudlobby README",
      asOf: "2026-09-30",
      counts: [
        { value: 19, label: "expertise profiles" },
        { value: 55, label: "skills" },
        { value: 17, label: "MCP fragments" },
        { value: 25, label: "guardrails" },
        { value: 40, label: "protocols" },
      ] satisfies Count[],
    },
  },

  // From the README's Quick start and "You install separately" at c4682f7
  // (2026-09-30). The steps themselves change with each release, so this
  // section links to them in the README instead of copying them.
  quickstart: {
    heading: "Quickstart",
    intro:
      "Setup builds a sealed release on your machine and starts your fleet from one `fleet.yaml`. The README's Quick start walks you through it.",
    prerequisitesHeading: "You'll need",
    prerequisites: [
      "Claude Code, installed and signed in (or an `ANTHROPIC_API_KEY`)",
      "Python and `tmux` on macOS (launchd) or Linux (systemd), such as a Mac mini or a Raspberry Pi 5",
      "Claude Code's Telegram plugin and a @BotFather token for each bot, if your fleet uses Telegram",
      "A GitHub token for the bots (`GITHUB_PAT`)",
    ],
    readmeLink: "Quickstart in the README",
    docsLink: "Full setup guide",
  },
};
