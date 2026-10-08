# Changelog

Notable changes to crog.gg. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). The site deploys continuously from `main`, so entries are grouped by date (US Eastern) rather than by version.

## 2026-10-08

### Changed
- The About section describes the owner's interest in AI agent teams more plainly.
- The hero's links say "see what i'm building" and "say hey". Their text comes from `hero.labels` in `site.yaml`, with neutral labels in `site.example`; forks can set their own words.

### Removed
- The hero's typewriter, its blinking cursor and reserved space. The project and contact links follow the tagline directly. `hero.typewriter` is removed from `site.yaml` and `site.example`; forks updating the code should remove that key too.

## 2026-10-05

### Changed
- The header takes its colours from the theme's variables, so its dark-mode overrides are gone; in the dark theme its inactive links are the palette's slate 400, where they were a grey from outside it (#255).
- CONTRIBUTING.md says there's no formal code of conduct (#255).

### Removed
- The résumé files nothing showed, `experience.yaml`, `education.yaml` and `skills.yaml` (and `site.example`'s), with their loaders, store slices and types, and the API's `portfolio` rewrite section. A page loads three fewer files; the journey still shows the roles, degrees and skills (#255).
- The API routes nothing called, `/api/v1/github/languages`, `/languages/<repo>` and `/contributions`, with their client methods, the unmounted contribution graph and the cache behind them. `GITHUB_TOKEN` is optional now: it only raises the rate limit for the repo figures and READMEs (#255).
- `styles/tokens.ts`, which nothing imported, the Tailwind typography plugin and four unused CSS classes (#255).

## 2026-10-04

### Changed
- `/projects` and the home page's projects: the featured card stands out in the site's accent (a heavier border, and its label), and the projects after it are compact cards in the same family, each with its emoji, name, whole description and what it's built with, where they were bare rows (#253).
- The projects are in order of how much went into them, Storydump and Shuffify first (#253).
- Headlines balance their lines, so the home page's no longer leaves "things." alone on the second (#253).
- Shuffify's and Benzo's pages link their public repos, with the repo's figures and README (#253).
- A project whose repo went private no longer links it, since its GitHub panel could only fail (#253).
- That project is off the site (#254).
- Project pages leave out a repo's stars, forks, watchers and open issues when `github.show_counts` in site.yaml is `false`, as it now is here: low counts undersold the projects. The language, license, last update and topics still show (#254).

## 2026-10-03

### Changed
- Claudlobby's page is for solo founders and small teams running a fleet of AI workers, not only a software dark factory (#250). After its hero come the jobs its workers do (engineer, product strategist, SEO optimizer, Shopify manager, content and ads, customer service), each from Claudlobby's library, which the section cites at a pinned commit; the dark factory is the example under "How it works". Its project card and link-preview card say the same.
- The music section's intro is plainer, and points at Spotify (#250).
- The tagline is "building things that build things", where it was "i build things that build things": the home page's headline, every page's title and the link-preview card (#250).
- The About text names artemis without its domain (#250).
- The owner's pages are lowercase, and names keep their capitals: the nav, the buttons and labels, the error, loading and empty states, the project descriptions, the journey and the About text (#251). Claudlobby's page stays in sentence case, and the SUMMON button in its all-caps.
- `/projects` and the home page's projects section list the projects after the featured card as rows: a name, the whole description and what it's built with, where they were cards with emoji tiles, two-line descriptions and pills (#251). The GitHub card is now a "more on GitHub" link closing the list.

### Removed
- `gradient` in project files: nothing shows it since the cards went (#251).

## 2026-10-02

### Added
- A "view source" link in the footer, and no rights claim beside it (#236).
- Docs: how the site works, what each content file does, contributing, forking, this changelog, and PR and issue templates (#237).
- The owner's identity lives in one folder, `site/`: `site/site.yaml`, checked at build time, and `site/public/`. The footer's source link comes from it (#239).
- `home: profile` in `site/site.yaml` puts the personal page at `/` for a fork, with no landing page (#240).
- The featured card's GitHub link counts as a repo click when it's Claudlobby's (`repo_click`, location `featured`), as the links on Claudlobby's page do (#248).

### Changed
- A SUMMON NEW LORE press rewrites only the About section, the one the page shows, so it uses one daily slot (#234).
- The e2e tests wait for conditions instead of sleeping, and a flaky test fails CI (#230).
- The add-project skill matches the code, and a test holds the shipped projects to it (#231).
- The pre-push hook runs CI's Python checks, and fails when a tool is missing (#232, closes #171).
- One router package, dev-only type packages, and no dependencies at the root (#233).
- The prompt pack and the GitHub proxy's helpers moved from `api/index.py` into `api/_lib/` (#235).
- The unit tests and e2e are type-checked, in CI and before a push (#238).
- The contact card's labels are lowercase, like the footer's and the menu's (#239).
- "view source" opens the repo at the commit the site was built from (#240).
- The unit tests read a fictional site, `site.example/`, so a fork's edits can't turn them red; `npm run site:check` holds a site's own content to its rules, and CI runs the e2e tests on both sites (#241).
- The API reads who the site is from `site/site.yaml`: the CORS origins, the GitHub owner (project pages can link another allowed owner's repos), and the rewrite's button label, persona and style rules. It adds PyYAML, and its tests run on `site.example/` (#242).
- SUMMON NEW LORE and the project pages' GitHub panels show only where the deployment can serve them (`GET /api/features`), and `features` in `site/site.yaml` can turn either off; a keyless fork no longer shows a button that fails (#243).
- The content files the site renders are checked by the build, by `npm run site:check` and as they load, naming the file and the field; a file that fails takes only its own section down, and `projects/index.yaml` alone sets the projects' order. `order`, `featured`, `tags` and `image` are gone from project files, and links must be https (#244).
- `npm run site:init` starts a fork from the fictional `site.example/`, and FORKING.md is the checklist from a copy of the repo to a deployed site (#245).
- The owner's page is the home page (#247), in the look Claudlobby's page set, one column: a hero with a photo, then about (with SUMMON NEW LORE under it), the journey, the projects, music, the photo strip and the contact links. The tabs, the section navigator and the About preview's clamp are gone, the menu links each section, and `/about` redirects to `/`.
- Claudlobby is the featured project (#247): first and larger on `/` and `/projects`, with its own page at `/projects/claudlobby`. That page is Claudlobby's alone: the site's tagline, the owner's résumé line and "More about me" are off it, and the header, menu and footer link nothing of Claudlobby's.
- `/projects` (#247) is the featured card and a grid of cards, with no search or category filters; each project's page is in the same look, with its repo's figures, what it's built with and its README.
- The share card is the owner's (#247): the tagline and a photo, where it was Claudlobby's.
- `site.yaml` and the project index (#247): `home` and `about` (which held only `preview_height`) are gone, so a `site.yaml` that still has either fails, naming the key; `sections` is the home page's, in order; `featured` in `projects/index.yaml` names the project shown first. The About text renders from the store, so the store's events for the old About component and `react-transition-group` are gone (#198 PR 2).
- The 404 and error pages, and a section that fails to load, are in the same look, with the site's one radius and its buttons; so is the photo strip (#247).
- Only the standard project page loads the README renderer, so Claudlobby's page doesn't, and the music section loads Spotify's player once it's near the screen rather than with the page (#247).
- Claudlobby's page wears its GitHub org's look, Claudfather's: the org's avatar as its mark, its charcoal, cream and orange, and its own link-preview card. A project file can name a link-preview card of its own (`share_card`), and `npm run site:check` holds every card to its size, and to its source's words where the site keeps one. Claudlobby's head describes it as source code, with its repository and license (#249).

### Fixed
- A project page fits a phone: a README's wide table scrolls in a box of its own, and a long URL wraps. Pages take their width from the layout, not from their content, so `/projects` no longer widens as its projects arrive (#246).
- Filled buttons and active tabs use the one filled-button colour in both themes, white on primary-600 as on the home page's button, so their text meets WCAG AA in the dark theme too. So do the tech pills and the skill bubbles, and a README's task-list checkboxes are named (#246).
- The project stats and the `/projects` tiles keep their size when they load, and `/projects` shows its filters while it loads (#246).
- A link followed while an in-page link's smooth scroll is still moving opens the next page at the top; in Chromium the scroll carried on down the new page (#247).
- On a phone, the journey's skills follow the timeline. Above it, the cloud grew as entries scrolled in and pushed the one being read down (#247).
- A project page's skeleton holds the breadcrumbs' row, so the hero lands where its stand-in stood; and the "Project not found" view has the page's top padding, as the 404 page does (#249).

### Removed
- 96 dead App.css rules, seven unused files and the symbols nothing used (#229).

## 2026-10-01

### Added
- crog.gg is the front door for Claudlobby; the personal page moved to `/about` (#202).
- A platform voice on `/`, a personal voice on `/about`, and an honest maturity statement (#203).
- Cookieless Vercel Web Analytics, with repo and quickstart events (#204).
- Release updates through GitHub's notifications (#205).
- A smoke test of every successful deployment (#215).

### Changed
- Node 24 and Python 3.12 are pinned, and Python dependencies install from hashed locks (#214).

### Fixed
- `/api/regenerate`:
  - the cooldown is claimed in one atomic step (#213);
  - a site-wide daily ceiling, a section size cap, and one IPv6 /64 per visitor (#216);
  - each model call is bounded (#217);
  - every press is answered within a 45 s deadline (#218);
  - partial bio rewrites merge, and the server drives the cooldown (#223).
- Rate-limit keys and logs name visitors by an anonymous tag (#219).
- The CDN caches repo pages (#222).
- A deep link waits for the content instead of saying "Project Not Found" (#224).
- The About tab opens on the first click, and project cards open their pages (#225).
- The site loads with site data blocked, the "system" theme follows the OS, and project stats never show the previous project's (#226).
- Presentation fixes: the typewriter's start delay, skill colours checked as the timeline loads, and one Projects header (#228).

### Security
- The frontend's `npm audit` is clean (#227).

## 2026-09-30

### Added
- Each route ships a prerendered head (title, description, social card), and unknown paths get a real 404 (#184, closes #174).
- `/api/health`, for uptime monitoring (#210).
- An MIT licence, content terms and third-party notices (#200).

### Fixed
- One canonical host, a generated sitemap, working README links, compressed images, self-hosted logos and accessibility fixes (#185).
- A refused Redis write fails closed instead of reading as allowed (#207).
- Empty completions, crashed workers and GitHub outages are reported instead of hidden (#209).
- Provider text stays out of responses, and `/repo` returns only its fields (#212).

## 2026-08-18

### Fixed
- The About preview's fade follows the copy, and "see more" survives a collapse (#163, #166, #167).
- An unreadable cooldown reports as unknown, not zero (#164).

## 2026-08-13

### Changed
- The About text is in paragraphs (#161).

## 2026-08-07

### Changed
- The lore varies by form, a different register each press, and the prompt states what a rewrite may not move (#144).

### Fixed
- DISPEL ENCHANTMENT is offered only when a rewrite actually changed something (#155).

## 2026-08-03

### Changed
- SUMMON NEW LORE moved off the deprecated `gpt-3.5-turbo` (#134).

### Security
- The paid endpoint fails closed when Redis is unavailable, so it can never run unmetered (#134, closes #113).

## 2026-08-01

### Fixed
- One request per click, so a full regeneration can't race itself (#131).

### Security
- The model can't rewrite the social links or the email address: the server puts them back (#122, #132).

## 2026-07-30

### Changed
- The `/languages` aggregate is cached in Redis, so a burst of visits can't spend the GitHub token's quota (#127).

### Security
- `/api/regenerate` validates its input, fences the content as data in the prompt, and meters before it calls the model (#116).

## 2026-06-28

### Security
- The GitHub proxy serves only the owner's public repos (#100).

## 2026-05-29

### Security
- `/api/regenerate` has a daily cap per visitor (#92).
- Tighter CORS, and errors that no longer echo internals or the model's raw output (#93, #95).
- Security headers, including the Content-Security-Policy (#94).

## 2026-05-27

### Changed
- Moved to Vercel: the frontend as static files, and the Flask API as one Python function, with Upstash Redis for rate limits (#83, #85).
