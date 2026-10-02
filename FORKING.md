# Forking crog.gg

This is the interim guide. The owner's identity lives in one folder, `site/` (#188), which the frontend and the API both read (#189). This page lists every place to change, and a search at the end finds what's left.

## Licences

- **The code** is MIT ([LICENSE](LICENSE)). Take it, and keep LICENSE as it is: the licence's copyright notice has to stay with the code. (The search below lists it.)
- **The content** isn't: the bio, timeline, projects, photos, social card, personal copy and links belong to the owner ([CONTENT-TERMS.md](CONTENT-TERMS.md)). Replace all of it before you deploy.

## What to replace

**Start from `site.example/`**, a fictional site in the same shape: replace `site/` with a copy of it (delete the copy's `LICENSE` and `README.md`, which are the fixture's), then make it yours. Keep `site.example/` itself: the unit tests read it. The tests already pass on it, since CI runs them on both.

**`site/site.yaml`**: who the site is. The build checks it and names any key that's wrong; [documentation/CONTENT.md](documentation/CONTENT.md#sitesiteyaml) describes every field.

**`site/public/`**, served as the site's root (see CONTENT.md for every field):
- `content/`: the bio, the timeline, the projects and the showcase;
- `experience.yaml`, `education.yaml` and `skills.yaml` there too. Nothing renders them, but they load with the rest, so empty each to its list (`experience: []`) rather than deleting it: a missing or blank file takes `/about` and `/projects` down;
- `content/projects/hedwig.yaml`, which `index.yaml` doesn't list but which is still served: delete it;
- the photos: `profile-photo.jpg` and `profile-photos/`, with the originals in `frontend/scripts/photos/originals/`;
- `logos/`: one PNG per organisation domain in your timeline;
- `og-image.png`, rendered from `site/og-image.html`;
- `manifest.json`, the favicons and the app icons.

**Still in the code:**
- The Claudlobby landing page: set `home: profile` in `site/site.yaml`, and the personal page becomes `/`, with no landing page, no Claudlobby links and no Claudlobby head. To keep a landing page of your own instead, replace `frontend/src/content/claudlobby.ts`, the sections in `frontend/src/components/sections/Claudlobby/`, and the landing page's head (`HOME_META` in `frontend/src/seo/site.ts`).

**The API** reads `site/site.yaml` too (#189): `github.username` for the project pages' GitHub owner, `site.url` and `site.aliases` for CORS, `regenerate` for the button's label (the rewrite must leave it as it is), the persona's names and pronouns, and the style rules every rewrite is asked to keep, and `features` for what it serves.

**Hosting:**
- the Content-Security-Policy in `vercel.json`: add any host you frame or load images from (`site:check` fails if the music player's isn't there);
- `SITE_URL` (a GitHub Actions variable): the canonical host the smoke test checks.

Then look for what's left:

```bash
git grep -n -i -E "chris|crog|cr0g"
```

## Deploying

1. Import the repo into Vercel. `vercel.json` already sets the build, the output folder, the API rewrite and the headers.
2. Add Upstash Redis, as the README's [Provisioning Upstash Redis](README.md#provisioning-upstash-redis) describes. Without it, or without `OPENAI_API_KEY`, SUMMON NEW LORE doesn't show: the paid endpoint refuses to run unmetered (#113), and the page asks `GET /api/features` before it offers the button. To retire the button for good, set `features.regenerate: off` in `site/site.yaml`.
3. Set the variables in the README's [table](README.md#environment-variables); Upstash injects its own (step 2).
4. **Set a monthly budget in the OpenAI billing dashboard** ([why](README.md#bounding-openai-spend)).

## What to delete

- `documentation/archive/` and `documentation/planning/`: this repo's history, not yours.
- CLAUDE.md's "Site copy style" section, which describes this instance's copy. Write your own.
- The `.claude/agents/` you won't use, and `.claude/skills/add-project/` if you don't list projects.
