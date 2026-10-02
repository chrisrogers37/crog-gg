# Forking crog.gg

This is the interim guide. The owner's identity is still typed into a few dozen places, and #188 and #189 move it into one config file. Until they land, this page lists every place to change.

## Licences

- **The code** is MIT ([LICENSE](LICENSE)). Take it.
- **The content** isn't: the bio, timeline, projects, photos, social card, personal copy and links belong to the owner ([CONTENT-TERMS.md](CONTENT-TERMS.md)). Replace all of it before you deploy.

## What to replace

**Content** (see [documentation/CONTENT.md](documentation/CONTENT.md) for every field):
- `frontend/public/content/`: the bio, the timeline, the projects and the showcase;
- `frontend/public/profile-photo.jpg` and `frontend/public/profile-photos/`;
- `frontend/public/logos/`: one PNG per organisation domain in your timeline.

**The site's identity:**
- `frontend/src/content/links.ts`: your profile URLs;
- `frontend/src/content/claudlobby.ts`, and the sections in `frontend/src/components/sections/Claudlobby/`: the homepage is the Claudlobby landing page, so replace it with your own;
- the name in `frontend/src/components/layout/Navigation/Navigation.tsx` and `Footer/Footer.tsx`;
- `frontend/src/components/sections/Music/Music.tsx` and `ContactCTA/ContactCTA.tsx`: their fallback links and copy;
- `frontend/src/components/features/GitHubReadme/GitHubReadme.tsx`: the GitHub owner in its links.

**SEO and the social card:**
- `frontend/src/seo/site.ts`: the site URL, titles, descriptions and the Person schema;
- `frontend/public/og-image.png`, rendered from `frontend/scripts/og-image/og-image.html`;
- `frontend/public/manifest.json`, the favicons and the app icons.

**The API:**
- `GITHUB_USERNAME` in `api/_lib/request_utils.py`: whose public repos the proxy serves;
- `_cors_origins` in `api/index.py`: your domain;
- the persona in `api/_lib/prompts.py`: the About prompt asks for a name containing "Christopher" or "Chris", and the anchors say "he", "his" and "him".

**Hosting:**
- the Content-Security-Policy in `vercel.json`: add any host you frame or load images from;
- `SITE_URL` (a GitHub Actions variable): the canonical host the smoke test checks.

Then look for what's left:

```bash
git grep -n -i -E "chris|crog|chrisrogers37"
```

## Deploying

1. Import the repo into Vercel. `vercel.json` already sets the build, the output folder, the API rewrite and the headers.
2. Add Upstash Redis from the Vercel Marketplace, connected to every environment. Without it, SUMMON NEW LORE answers 503: the paid endpoint refuses to run unmetered (#113).
3. Set the environment variables (the README's table): `OPENAI_API_KEY`, `GITHUB_TOKEN` (a token that can read public repos only), `IP_HASH_SALT`, and optionally `VITE_SOURCE_REPO_URL`.
4. **Set a hard monthly budget in the OpenAI billing dashboard.** The site's daily caps live in Redis; only the dashboard's limit holds whatever happens here.

## What to delete

- `documentation/archive/` and `documentation/planning/`: this repo's history, not yours.
- CLAUDE.md's "Site copy style" section, which describes this instance's copy. Write your own.
- The `.claude/agents/` you won't use, and `.claude/skills/add-project/` if you don't list projects.
