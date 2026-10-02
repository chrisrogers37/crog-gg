# Make it yours

The code is built to be reused: who the site is lives in one folder, `site/`, which the frontend and the API both read (#188, #189). This is the checklist, from a copy of the repo to a deployed site.

## Licences

- **The code** is MIT ([LICENSE](LICENSE)). Take it, and keep LICENSE as it is: the licence's copyright notice has to stay with the code.
- **The content** isn't: the bio, timeline, projects, photos, social card, personal copy and links belong to the owner ([CONTENT-TERMS.md](CONTENT-TERMS.md)), wherever they are in the repo. Step 2 replaces what's in `site/`; step 3 names the rest (the photo originals).
- **`site.example/`** is fictional and public domain (CC0), so its copy in your `site/` is yours to change.

## 1. Get a copy

- **A template** (recommended): "Use this template" on GitHub makes a repo of your own, with no shared history.
- **A fork** keeps the link to this repo, for pull requests back.

Then clone it, and run `npm install` at the root (the git hooks) and in `frontend/`. Don't deploy it yet: until step 2, it's this site, with its owner's content.

## 2. Start from the example

At the repo root:

```bash
npm run site:init
```

This replaces `site/` with a copy of `site.example/`, a fictional site in the same shape, and points the footer's "view source" link at your repo (from git's `origin`). It leaves out the example's own LICENSE and README, and keeps `site.example/` itself, which the unit tests read. While `site/` holds anything git hasn't committed (ignored files too), it refuses; `npm run site:init -- --force` discards them.

## 3. Make it yours

- **`site/site.yaml`**: who the site is: your name, URL, socials, the copy around the content, which sections the home page shows, and SUMMON NEW LORE's words and persona. The build checks it and names any key that's wrong; [CONTENT.md](documentation/CONTENT.md#sitesiteyaml) describes every field.
- **`site/public/content/`**: the bio, the timeline, the projects (`projects/index.yaml` lists them, in order, and `featured` names the one shown first and largest) and the photo strip. Each file is checked as it loads, and names what's wrong ([CONTENT.md](documentation/CONTENT.md)).
- **`site/public/`**'s images: one logo PNG per timeline domain in `logos/`, `manifest.json`, the favicons and the app icons.
- **The photos.** The owner's originals are in `frontend/scripts/photos/originals/`, outside `site/`: delete them, put yours there, and run `python frontend/scripts/photos/make-variants.py`, which writes each one's 160, 320 and 480 px WebP variants into `site/public/profile-photos/` (and only then are they served). Point `hero.photos` in `site/site.yaml` and `showcase.yaml` at them, and replace `site/public/profile-photo.jpg`.
- **The social card**, `site/public/og-image.png` (1200 x 630): replace it, and keep `seo.image.alt` in `site/site.yaml` in step with what it says. This site renders its own from an HTML page (`frontend/scripts/og-image/render.mjs`); the example has none to render.
- **A project with a page of its own.** Every project gets the standard page, unless `frontend/src/content/ownPages.ts` lists its id and `projectPages.ts` beside it gives the page, as this site does for Claudlobby. A site whose projects don't include `claudlobby` never shows that page, so you can leave it, or delete it: its id and entry in those two files, `frontend/src/content/claudlobby.ts` and `frontend/src/components/sections/Claudlobby/`.

Then check it:

```bash
cd frontend && npm run site:check
```

It holds your content to the site's rules: every file and photo it names exists, the projects link only your GitHub repos, the About text ends on the line that names the button, and none of your values is typed into the code.

## 4. Run it

`cd frontend && npm run dev` serves the whole site with no backend: the API's parts (SUMMON NEW LORE and the project pages' GitHub panels) just don't show. To run the API too, see the README's [Local Development Setup](README.md#local-development-setup).

## 5. Deploy

1. Import your repo into Vercel. `vercel.json` sets the build, the output folder, the API rewrite and the headers. **No environment variable is needed**: with none, the site works, SUMMON NEW LORE is hidden (`GET /api/features`), and the project pages' GitHub panels call GitHub without a token (60 requests an hour).
2. Optional, **the GitHub panels**: a `GITHUB_TOKEN` that can read public data only (CLAUDE.md has the settings) lifts that limit. `features.github: off` in `site/site.yaml` hides the panels instead.
3. Optional, **SUMMON NEW LORE**:
   - `OPENAI_API_KEY`;
   - Upstash Redis, as the README's [Provisioning Upstash Redis](README.md#provisioning-upstash-redis) describes. The paid endpoint refuses to run unmetered (#113), so without Upstash the button stays hidden;
   - `IP_HASH_SALT` (see the README's [table](README.md#environment-variables));
   - **a monthly budget in the OpenAI billing dashboard** ([why](README.md#bounding-openai-spend)).

   To retire the button for good, set `features.regenerate: off` in `site/site.yaml`.
4. The Content-Security-Policy in `vercel.json`: add any host you frame or load images from (`site:check` fails if the music player's isn't there).
5. Optional, `SITE_URL`, a GitHub Actions variable: the canonical host the post-deploy smoke test checks on production. Without it, the smoke test checks previews and skips production with a notice.

## 6. What's left

- Point these at yourself, or delete them: `SECURITY.md` and `.github/ISSUE_TEMPLATE/config.yml` (where security reports go), and `.github/CODEOWNERS`.
- Delete `documentation/archive/` and `documentation/planning/`: this repo's history, not yours.
- CLAUDE.md's "Site copy style" section describes this instance's copy. Write your own.
- The `.claude/agents/` you won't use, and `.claude/skills/add-project/` if you don't list projects.

Then look for the rest:

```bash
git grep -n -i -E "chris|crog|cr0g"
```

It lists LICENSE (keep it), this repo's docs, the tests (their made-up people can stay), `crog:` names in the code (they're only names), and anything else of the owner's you haven't replaced.
