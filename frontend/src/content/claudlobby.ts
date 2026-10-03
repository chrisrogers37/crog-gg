/**
 * Claudlobby's project page: the featured project's own sections (#173, and
 * since the redesign one project among the others).
 *
 * A typed module rather than fetched YAML: a missing or misspelled field fails
 * the build's type check instead of reaching visitors. The page's eyebrow
 * comes from the project (projects/claudlobby.yaml and index.yaml). Shared URLs live in
 * links.ts. Wrap code terms in backticks; they render as <code>.
 *
 * Platform voice (#179): plain and specific, no jokes, and nothing of the
 * owner's: the personal page and its voice are the rest of the site.
 *
 * Who it's for (Chris, 2026-10-02): solo founders and small teams running a
 * fleet of AI workers, engineering and the rest of a business, not only a
 * software "dark factory", which the page keeps as one example. The top of
 * the page is in plain words ("Design your team", not "one fleet.yaml",
 * Chris 2026-10-03); file names and commands wait for how it works.
 *
 * Say only what the Claudlobby repo backs up (claudlobby.test.ts checks the
 * mechanical parts):
 * - it's open source: Apache-2.0 since 2026-09-30 (Claudfather/Claudlobby#2013)
 * - each role says only what its profiles and skills do (`workers.source`); an
 *   approval step is what a profile tells its bot to do, never a promise: the
 *   README calls guardrails "instructions, not enforcement"
 * - in Claudlobby's terms a worker is any bot but the manager, so the page's
 *   mechanics (how it works, why) say bot
 * - Claude Code only today; other model providers appear only in
 *   `maturity.planned` and `roadmap.next`, where they read as plans
 * - every number keeps its source and as-of date, and matches that source
 */

import { CLAUDLOBBY_REPO } from "./links";

type Step = { title: string; code: string; body: string };
type Point = { title: string; body: string };
type Count = { value: number; label: string };

export const claudlobby = {
  // Claudfather's avatar (the GitHub org Claudlobby lives in), the page's
  // mark: the owner's photo variants in site/public/profile-photos.
  mark: { photo: "/profile-photos/claudfather", alt: "Claudfather" },

  hero: {
    headline: "Run a fleet of AI workers.",
    sub: "Design your team: engineers, product strategists, SEO optimizers and Shopify managers. They work 24/7 on your own Mac mini or Raspberry Pi. Open source, for solo founders and small teams.",
    ctaStar: "Star on GitHub",
    ctaQuickstart: "Quickstart",
  },

  maturity: {
    label: "Early alpha",
    // Split so the test can hold `today` to Claude Code; only `planned` may
    // name other providers.
    today: "Runs on Claude Code today.",
    planned:
      "Other model providers (OpenAI, Gemini, local models) are on the roadmap.",
    link: "What's next",
    updatesLink: "Get updates",
  },

  workers: {
    heading: "A worker for each job",
    intro:
      "Each worker is a Claude Code agent with a ready-made role from Claudlobby's library. It knows the job, has the tools for it, and keeps at it while you set the goals and the guardrails.",
    // The library at 69f2fa0 (2026-10-02): software-engineering, with the
    // code-review profile's reviewer bot; product-strategy; seo (read only on
    // repos: it drafts the fix, an engineer ships it); business-operations
    // with the shopify skill (Admin API reads); content-marketing, copywriting
    // and advertising (read only on ad platforms); customer-service. Content,
    // ads and customer service bring drafts to a person for approval.
    roles: [
      {
        title: "Engineer",
        body: "Builds features on a branch, opens pull requests and finds the root cause of a bug. A reviewer bot can review its pull requests.",
      },
      {
        title: "Product strategist",
        body: "Turns a project into a plan to find its audience and its revenue: who it's for, how they find it, why they'd pay.",
      },
      {
        title: "SEO optimizer",
        body: "Runs technical audits and keyword research, and drafts the exact on-page and schema fixes for an engineer to ship.",
      },
      {
        title: "Shopify manager",
        body: "Watches orders, fulfillment, discounts and the catalog in your Shopify store, and flags a stuck order before a customer does.",
      },
      {
        title: "Content and ads",
        body: "Drafts posts, emails and ad copy in your brand's voice, and designs ad experiments, then brings each draft to you for approval.",
      },
      {
        title: "Customer service",
        body: "Triages inbound messages, looks up the order and drafts a reply, then sends it once you approve it.",
      },
    ] satisfies Point[],
    source: `${CLAUDLOBBY_REPO}/tree/69f2fa0afe7b44da846593a42543548d0ff74fc3/library`,
    sourceLabel: "the library's profiles and skills",
    asOf: "2026-10-02",
  },

  howItWorks: {
    heading: "How it works",
    intro:
      "One file describes the fleet, and Claudlobby builds each bot from the library and keeps it running. For a software team, that's a dark factory: agents plan the work, write the code and review each other while the lights are off.",
    steps: [
      {
        title: "Design your team",
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
        body: "A manager bot hands out the work, workers report back, and you follow along and steer from Telegram.",
      },
    ] satisfies Step[],
  },

  why: {
    heading: "Why Claudlobby",
    points: [
      {
        // The MCP fragments the README lists at 69f2fa0 (library.source), one
        // per tool: Google Workspace (gws) is Gmail and Calendar.
        title: "Plugged into your tools",
        body: "Shopify, Printify, Google Search Console and Analytics, Meta Ads, Google Workspace, Notion, Linear, Slack and GitHub, each ready to connect from the library.",
      },
      {
        title: "Runs on hardware you own",
        body: "No Claudlobby service to sign up for: the fleet runs on your machine. A Mac mini, a Linux box or a Raspberry Pi 5 is enough.",
      },
      {
        title: "Improve one, improve them all",
        body: "A skill, guardrail or protocol lives once in the library, and every bot that declares it gets it. Bots keep their memory across rebuilds, and `claudlobby config diff --bot` shows what one has changed, so a good change can go back into the library.",
      },
    ] satisfies Point[],
    library: {
      heading: "In the library today",
      // Counted from the README's "What this repo gives you" list, and checked
      // against the repo tree (library/, README.md files excluded) that day.
      // The same commit as the roles' source, so the page reads one snapshot.
      source: `${CLAUDLOBBY_REPO}/blob/69f2fa0afe7b44da846593a42543548d0ff74fc3/README.md#what-this-repo-gives-you--and-doesnt`,
      sourceLabel: "Claudlobby README",
      asOf: "2026-10-02",
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
    alphaNote: "Claudlobby is early alpha, so expect rough edges in setup.",
    issuesLink: "Report a setup problem",
    readmeLink: "Quickstart in the README",
    docsLink: "Full setup guide",
  },

  // #175, as Chris chose on 2026-09-30: GitHub's own release notifications
  // and feed, not a mailing list, so the site keeps no email addresses.
  updates: {
    heading: "Get updates",
    intro:
      "Not ready to set it up yet? Watch the repo's releases on GitHub, and GitHub lets you know when Claudlobby publishes one.",
    watchLink: "Watch releases on GitHub",
    feedLink: "Releases feed (Atom)",
    howTo:
      "On the repo, choose Watch, then Custom, check Releases and click Apply.",
  },

  roadmap: {
    heading: "Today, and what's next",
    intro: "Today is what the repo does now. Next is planned, not shipped.",
    // From the README and PROJECT_MISSION.md.
    today: {
      heading: "Today",
      items: [
        "Claude Code agents, composed from one `fleet.yaml`",
        "macOS (launchd) and Linux (systemd) hosts, each fleet on a single host",
        "Steered from Telegram, watched in the operator plane",
        "An optional GitHub App identity per fleet, so bot commits and PRs show up as bots",
      ],
    },
    // Chris's stated plans: #179, #180 and #181 (G1 and the cold-start gate).
    next: {
      heading: "Next",
      items: [
        "Other model providers from the same `fleet.yaml`: OpenAI's Codex CLI, Gemini and local models",
        "A first run that needs fewer accounts and tokens between cloning and a working bot",
      ],
    },
  },
};
