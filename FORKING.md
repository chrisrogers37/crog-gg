# Forking crog.gg

This is the interim guide. Most of the owner's identity lives in one folder, `site/` (#188); the API's half moves there with #189. Until then, this page lists every place to change, and a search at the end finds what's left.

## Licences

- **The code** is MIT ([LICENSE](LICENSE)). Take it, and keep LICENSE as it is: the licence's copyright notice has to stay with the code. (The search below lists it.)
- **The content** isn't: the bio, timeline, projects, photos, social card, personal copy and links belong to the owner ([CONTENT-TERMS.md](CONTENT-TERMS.md)). Replace all of it before you deploy.

## What to replace

**`site/site.yaml`**: who the site is. The name, email, site URL, page descriptions, the socials and where each shows, the footer's source link, the /about sections, the header photos and typewriter lines, and the contact and music copy. The build checks it, and `npm run site:check` (in `frontend/`) checks the files it names; both name the key that's wrong. [documentation/CONTENT.md](documentation/CONTENT.md#sitesiteyaml) describes every field.

**`site/public/`**, served as the site's root (see CONTENT.md for every field):
- `content/`: the bio, the timeline, the projects and the showcase;
- `experience.yaml`, `education.yaml` and `skills.yaml` there too. Nothing renders them, but they load with the rest, so empty each to its list (`experience: []`) rather than deleting it: a missing or blank file takes `/about` and `/projects` down;
- `content/projects/hedwig.yaml`, which `index.yaml` doesn't list but which is still served: delete it;
- the photos: `profile-photo.jpg` and `profile-photos/`, with the originals in `frontend/scripts/photos/originals/`;
- `logos/`: one PNG per organisation domain in your timeline;
- `og-image.png`, rendered from `site/og-image.html`;
- `manifest.json`, the favicons and the app icons.

**Still in the code:**
- `frontend/src/content/claudlobby.ts`, and the sections in `frontend/src/components/sections/Claudlobby/`: the homepage is the Claudlobby landing page, so replace it with your own, along with the Claudlobby links in the header, footer and mobile menu;
- `frontend/src/components/features/GitHubReadme/GitHubReadme.tsx`: the GitHub owner in its links (#189).

**The API:**
- `GITHUB_USERNAME` in `api/_lib/request_utils.py`: whose public repos the proxy serves;
- `_cors_origins` in `api/index.py`: your domain;
- the persona in `api/_lib/prompts.py`: its name (the About prompt asks for "Christopher" or "Chris") and its pronouns.

**Hosting:**
- the Content-Security-Policy in `vercel.json`: add any host you frame or load images from (`site:check` fails if the music player's isn't there);
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
