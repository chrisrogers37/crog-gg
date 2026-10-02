# Forking crog.gg

This is the interim guide. The owner's identity is still typed into a few dozen places, and #188 and #189 move it into one config file. Until they land, this page lists the places to change, and a search at the end finds what's left.

## Licences

- **The code** is MIT ([LICENSE](LICENSE)). Take it, and keep LICENSE as it is: the licence's copyright notice has to stay with the code. (The search below lists it.)
- **The content** isn't: the bio, timeline, projects, photos, social card, personal copy and links belong to the owner ([CONTENT-TERMS.md](CONTENT-TERMS.md)). Replace all of it before you deploy.

## What to replace

**Content** (see [documentation/CONTENT.md](documentation/CONTENT.md) for every field):
- `frontend/public/content/`: the bio, the timeline, the projects and the showcase;
- `experience.yaml`, `education.yaml` and `skills.yaml` there too. Nothing renders them, but they load with the rest, so empty each to its list (`experience: []`) rather than deleting it: a missing or blank file takes `/about` and `/projects` down;
- `frontend/public/content/projects/hedwig.yaml`, which `index.yaml` doesn't list but which is still served: delete it;
- the photos: `frontend/public/profile-photo.jpg`, `frontend/public/profile-photos/`, the originals in `frontend/scripts/photos/originals/`, and the list of hero photos (`PROFILE_PHOTOS` in `frontend/src/utils/photos.ts`);
- `frontend/public/logos/`: one PNG per organisation domain in your timeline.

**The site's identity:**
- `frontend/src/content/links.ts`: your profile URLs;
- `frontend/src/content/claudlobby.ts`, and the sections in `frontend/src/components/sections/Claudlobby/`: the homepage is the Claudlobby landing page, so replace it with your own;
- the name in `frontend/src/components/layout/Navigation/Navigation.tsx` and `Footer/Footer.tsx`;
- the typewriter phrases on `/about`, in `frontend/src/pages/About/AboutPage.tsx`;
- `frontend/src/components/sections/Music/Music.tsx`: its intro, its fallback links, and its Spotify player, which is hardcoded to the owner's artist page;
- `frontend/src/components/sections/ContactCTA/ContactCTA.tsx`: the Instagram handles it prints as labels (`@cr0g`, `@crogmusic`), and its copy;
- `frontend/src/components/features/GitHubReadme/GitHubReadme.tsx`: the GitHub owner in its links.

**SEO and the social card:**
- `frontend/src/seo/site.ts`: the site URL, titles, descriptions and the Person schema;
- `frontend/public/og-image.png`, rendered from `frontend/scripts/og-image/og-image.html`;
- `frontend/public/manifest.json`, the favicons and the app icons.

**The API:**
- `GITHUB_USERNAME` in `api/_lib/request_utils.py`: whose public repos the proxy serves;
- `_cors_origins` in `api/index.py`: your domain;
- the persona in `api/_lib/prompts.py`: its name (the About prompt asks for "Christopher" or "Chris") and its pronouns.

**Hosting:**
- the Content-Security-Policy in `vercel.json`: add any host you frame or load images from;
- `SITE_URL` (a GitHub Actions variable): the canonical host the smoke test checks.

Then look for what's left:

```bash
git grep -n -i -E "chris|crog|cr0g"
```

## Deploying

1. Import the repo into Vercel. `vercel.json` already sets the build, the output folder, the API rewrite and the headers.
2. Add Upstash Redis, as the README's [Provisioning Upstash Redis](README.md#provisioning-upstash-redis) describes. Without it, SUMMON NEW LORE answers 503: the paid endpoint refuses to run unmetered (#113).
3. Set the variables in the README's [table](README.md#environment-variables); Upstash injects its own (step 2).
4. **Set a monthly budget in the OpenAI billing dashboard** ([why](README.md#bounding-openai-spend)).

## What to delete

- `documentation/archive/` and `documentation/planning/`: this repo's history, not yours.
- CLAUDE.md's "Site copy style" section, which describes this instance's copy. Write your own.
- The `.claude/agents/` you won't use, and `.claude/skills/add-project/` if you don't list projects.
