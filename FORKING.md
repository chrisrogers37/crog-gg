# Make it yours

The code is built to be reused: who the site is lives in one folder, `site/`, which the frontend and the API both read (#188, #189). This is the checklist, from a copy of the repo to a deployed site.

## Licences

- **The code** is MIT ([LICENSE](LICENSE)). Take it, and keep LICENSE as it is: the licence's copyright notice has to stay with the code.
- **The content** isn't: the bio, timeline, projects, photos, social card, personal copy and links belong to the owner ([CONTENT-TERMS.md](CONTENT-TERMS.md)). Step 2 replaces all of it.
- **`site.example/`** is fictional and public domain (CC0), so its copy in your `site/` is yours to change.

## 1. Get a copy

- **A template** (recommended): "Use this template" on GitHub makes a repo of your own, with no shared history.
- **A fork** keeps the link to this repo, for pull requests back.

Then clone it, and run `npm install` at the root (the git hooks) and in `frontend/`.

## 2. Start from the example

```bash
npm run site:init
```

This replaces `site/` with a copy of `site.example/`, a fictional site in the same shape, and points the footer's "view source" link at your repo (from git's `origin`). It leaves out the example's own LICENSE and README, and keeps `site.example/` itself, which the unit tests read. While `site/` has changes git hasn't committed, it refuses; `--force` discards them.

## 3. Make it yours

- **`site/site.yaml`**: who the site is: your name, URL, socials, the copy around the content, which tabs show, and SUMMON NEW LORE's words and persona. The build checks it and names any key that's wrong; [CONTENT.md](documentation/CONTENT.md#sitesiteyaml) describes every field.
- **`site/public/content/`**: the bio, the timeline, the projects (`projects/index.yaml` lists them, in order) and the photo strip. Each file is checked as it loads, and names what's wrong ([CONTENT.md](documentation/CONTENT.md)).
- **`site/public/`**'s images: the profile photos (`profile-photo.jpg` and `profile-photos/`; CLAUDE.md's Image Handling has the sizes), one logo PNG per timeline domain in `logos/`, the social card (`og-image.png`), `manifest.json`, the favicons and the app icons.
- **`/`**: `home: profile` (the example's) makes your personal page the home page. `home: landing` is this site's Claudlobby landing page: to keep a landing page of your own, replace `frontend/src/content/claudlobby.ts`, the sections in `frontend/src/components/sections/Claudlobby/`, and the landing page's head (`HOME_META` in `frontend/src/seo/site.ts`).

Then check it:

```bash
cd frontend && npm run site:check
```

It holds your content to the site's rules: every file and photo it names exists, the projects link only your GitHub repos, the About text ends on the line that names the button, and none of your values is typed into the code.

## 4. Run it

`cd frontend && npm run dev` serves the whole site with no backend: the API's parts (SUMMON NEW LORE and the project pages' GitHub panels) just don't show. To run the API too, see the README's [Local Development Setup](README.md#local-development-setup).

## 5. Deploy

1. Import the repo into Vercel, or use the README's Deploy button. `vercel.json` sets the build, the output folder, the API rewrite and the headers. **No environment variable is needed**: with none, the site works, and SUMMON NEW LORE and the GitHub panels are hidden (`GET /api/features`).
2. Optional, **the GitHub panels**: a `GITHUB_TOKEN` that can read public data only (CLAUDE.md has the settings).
3. Optional, **SUMMON NEW LORE**:
   - `OPENAI_API_KEY`;
   - Upstash Redis, as the README's [Provisioning Upstash Redis](README.md#provisioning-upstash-redis) describes. The paid endpoint refuses to run unmetered (#113), so without Upstash the button stays hidden;
   - `IP_HASH_SALT` (see the README's [table](README.md#environment-variables));
   - **a monthly budget in the OpenAI billing dashboard** ([why](README.md#bounding-openai-spend)).

   To retire the button for good, set `features.regenerate: off` in `site/site.yaml`.
4. The Content-Security-Policy in `vercel.json`: add any host you frame or load images from (`site:check` fails if the music player's isn't there).
5. `SITE_URL`, a GitHub Actions variable: the canonical host the post-deploy smoke test checks.

## 6. What's left

- Delete `documentation/archive/` and `documentation/planning/`: this repo's history, not yours.
- CLAUDE.md's "Site copy style" section describes this instance's copy. Write your own.
- The `.claude/agents/` you won't use, and `.claude/skills/add-project/` if you don't list projects.

Then look for the rest:

```bash
git grep -n -i -E "chris|crog|cr0g"
```

It lists LICENSE (keep it), this repo's docs, and anything else of the owner's you haven't replaced.
