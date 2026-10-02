# Changelog

Notable changes to crog.gg. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). The site deploys continuously from `main`, so entries are grouped by date rather than by version.

## 2026-10-02

### Changed
- The e2e tests wait for conditions instead of sleeping, and a flaky test fails CI (#230).
- The add-project skill matches the code, and a test holds the shipped projects to it (#231).
- The pre-push hook runs CI's Python checks, and fails when a tool is missing (#232, closes #171).

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

## 2026-08-03

### Changed
- SUMMON NEW LORE moved off the deprecated `gpt-3.5-turbo` (#134).

### Security
- The paid endpoint fails closed when Redis is unavailable, so it can never run unmetered (#113).

## 2026-08-01

### Fixed
- One request per click, so a full regeneration can't race itself (#131).

## 2026-05-18

### Changed
- Moved to Vercel: the frontend as static files, and the Flask API as one Python function, with Upstash Redis for rate limits.
