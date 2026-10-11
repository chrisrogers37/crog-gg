# Architecture

How crog.gg is put together, and why. For what each content file does, see [CONTENT.md](CONTENT.md).

## Topology

```
browser ─> Vercel ─┬─ static files from frontend/dist (one prerendered head per landing page)
                   └─ /api/* ─> one Python function, api/index.py (Flask)
                                  ├─ OpenAI          (/api/regenerate)
                                  ├─ GitHub          (the /api/v1/github proxy)
                                  └─ Upstash Redis   (cooldowns, daily caps, a cache)
```

The frontend and the API share one origin, so production needs no CORS. `vercel.json` sends every `/api/*` request to the function, and sets the security headers, CSP included.

## Frontend

- **Routes** (`frontend/src/router.tsx`):
  - `/` is the owner's page, one column of sections (`frontend/src/pages/Home/`).
  - `/projects` and `/projects/:slug` list the projects and show each one. A project whose id `frontend/src/content/ownPages.ts` lists has a page of its own (Claudfather's), which `projectPages.ts` maps it to; the rest share the standard one. The ids sit apart from the pages so the site checks and the E2E specs can ask without loading React components. A page of its own shows no GitHub panels, so its repo may be any owner's. It also describes itself in its own terms (`OWN_PAGE_SCHEMAS` in `seo/site.ts`): Claudfather's as a CreativeWork, without a shared component license or runtime. Any project's link preview is its file's `share_card` where it names one, else the site's.
  - Each loads as its own chunk.
  - `/about`, where the owner's page was from #173 until the redesign, redirects to `/`: `vercel.json` sends a visit there, and the router a link inside the app.
  - Anything else is the 404 page.
- **The look:** one page layout for the whole site (`frontend/src/styles/page.css`): a hero, then sections, each an h2 and a lead (`PageSection`), with the global `.btn` and `.card`. Claudfather's page wears its own colours, from `palette.ts`, scoped to the page (`Claudfather.css`).
- **Prerendering:** the build (`frontend/scripts/vite-prerender.ts`) writes each landing page's `<head>` (title, description, social card: the site's, or the project's own where its file names a `share_card`) into its own HTML file. So `/projects/<id>` is served from `projects/<id>.html`, and a crawler sees the right tags without running JavaScript. An unknown path gets `404.html` with a real 404 status (#174). The sitemap is generated from the same page list, and robots.txt points to it.
- **The owner's identity:** `site/site.yaml`, checked and baked in at build time. The `site()` plugin (`frontend/scripts/vite-site.ts`) serves it to the app as `virtual:site-config`, makes `site/public` the public folder, and defines `__SITE_COMMIT__` (the commit Vercel names) for the footer's source link and `__SITE_DIR__` (the folder, for tests that read its files). `site({ dir })` picks the folder, else `SITE_DIR` does, else it's `site/` (#191). The build's own code (the prerender) can't import the virtual module, because `vite.config.ts` loads before any plugin; it calls `siteConfig()` (`frontend/scripts/site-config.ts`), and `createSeo(site)` (`frontend/src/seo/site.ts`) builds the heads from either (#188).
- **Content:** the portfolio's YAML (`site/public/content/`) is fetched once, at start-up, into a zustand store (`frontend/src/store/contentStore.ts`). Claudfather's page's copy is a typed module (`frontend/src/content/claudfather.ts`), so a missing field fails the type check.
- **State:** `contentStore` holds the content, the regeneration and the cooldown the server reported. `uiStore` holds the theme, persisted in localStorage when the browser allows it.
- **Analytics:** Vercel Web Analytics from the same origin, cookieless. `RepoLink` retains the Claudlobby repository front-page meaning; the ecosystem family uses location `family`. Organization/preview/walkthrough links are not repository or activation events. See the README's [Web Analytics](../README.md#web-analytics) for the full event contract.

## API

Every route is in `api/index.py`. Shared helpers are in `api/_lib/`: the underscore keeps Vercel from treating them as functions of their own.
- `prompts.py`: the regenerate prompt pack.
- `github_proxy.py`: the proxy's helpers.
- `rate_limit.py` and `redis_client.py`: the limiter, and the Upstash REST client.
- `request_utils.py`: the visitor's identity and the GitHub settings.
- `site_config.py`: the keys of `site/site.yaml` the API reads (#189): CORS origins, the GitHub owner, the button's label and the rewrite's persona and style rules. vercel.json's `includeFiles` bundles the file with the function; without it, the function fails at import, naming the fix.

### /api/regenerate, gate by gate

1. **The body:** over 64 KB is 413. Anything but a JSON object is 400.
2. **The sections:**
   - `sections` must be a non-empty object;
   - every name must be in the prompt allowlist (`_PROMPTS`);
   - every body must be an object, and no longer than `MAX_SECTION_CHARS` (400 or 413).

   Nothing is metered yet, so a rejected request costs nothing (#107).
3. **The key:** no `OPENAI_API_KEY`, or `features.regenerate: off` in `site.yaml`, is 503 with `code: "regeneration_disabled"`, before anything reads Redis (#189).
4. **The cooldown:** 30 s per visitor, claimed atomically. On cooldown is 429, with `limit: "cooldown"` and the time left.
5. **The daily caps:** one slot per section, in two rolling 24 h windows: the visitor's (30) and the site's (300). The page sends one section per press (#190 M07), so a press uses one slot: 30 presses a day per visitor.
   - The visitor's full is 429 (`limit: "daily"`). The site's full is 503 (`limit: "budget"`).
   - Charged before any model call, so a request that then fails still spends its slots (#107), and forcing errors can't buy free generations.
6. **The rewrite:** one lore register is picked per press. Each section is rewritten in parallel, under a 45 s deadline for the whole press. A section is retried once after a connection failure or an OpenAI server error, if time allows; a read timeout isn't retried, since it would pay for the same slow generation twice.
7. **The checks on what came back:**
   - each rewrite must be recognisably the section it replaces;
   - fields the model must never write are put back from the original (`_UNAUTHORED_KEYS`: `email` and `social_links`, which the page turns into links, #98).
8. **The answer:** 200 with the rewritten sections and any `failed_sections`. It's 500 only when nothing came back. Either way the cooldown is already running, and the answer says so.

If Redis is unreachable at step 4 or 5, the answer is 503: the paid path fails closed, so it never runs unmetered (#113). The GitHub endpoints' rate limiter fails open instead.

### Adding a regenerable section

1. Add its prompt to `_PROMPTS` in `api/_lib/prompts.py`, and its output budget to `_MAX_COMPLETION_TOKENS` in `api/index.py`. A test fails until both name the same sections.
2. List in `_UNAUTHORED_KEYS` any field that reaches an `href`, a `src` or a similar sink. A prompt asking the model to leave a field alone is a request; the table is the enforcement.
3. Send it from the client (`regenerateContent` in `contentStore.ts`), and validate what comes back before it replaces anything on the page.

Each section costs the visitor a daily slot, so send only what the page shows (#190).

### The GitHub proxy

- `/api/v1/github/repo` and `/readme` serve **only public repos of allowed owners**: `github.username` and `github.allowed_owners`. `/repo/<owner>/<name>` and `/readme/<owner>/<name>` name the owner, as the project pages do; the one-segment routes mean `github.username`. Any other owner, and a private or missing repo, get the same 404 before or after GitHub is asked, so the proxy can't reveal which private repos exist (#97, #189).
- Each is limited to 30 requests a minute per visitor (failing open), and a 200 is cached at Vercel's edge for an hour.
- A request with a query string is a 400, before the rate limiter and without calling GitHub (`_github_query_refused`). The edge caches by full URL, so each new query string would otherwise be a miss that spends the token's quota. The page never sends one.
- With `features.github: off` in `site.yaml`, every GitHub route answers 404, before its rate limiter and without calling GitHub (`_github_off`, an app-level gate, #189).

### Metering, identity and failures

- **A visitor** is the client address Vercel reports (`x-real-ip`), with an IPv6 /64 counted as one. With `IP_HASH_SALT` set, it's hashed before it reaches a key or a log line; without it, keys and logs name the address, and the function warns once per cold start.
- **`/api/features`** says what this deployment can serve, so the page hides the rest: `regenerate` (an OpenAI key and Upstash's settings, and not `off` in `site.yaml`; the same rule as `/api/regenerate`'s `regeneration_disabled` exit, plus Upstash) and `github` (not `off`). It reads no Redis and calls no GitHub, so a fork with neither still gets an answer. Vercel's edge keeps it for 5 minutes, and the page asks once per visit, giving up after 3 s. Until it answers, the GitHub panels show (as they will where they're served, so a deep link doesn't shift) and SUMMON doesn't (#189).
- **`/api/limits`** reports the cooldown, so the page can count it down. `metering_available: false` means Redis is down. A 200 from it is not a health signal (#162).
- **`/api/health`** answers 200 when what the deployment serves works: for SUMMON, the OpenAI key is set and Redis answers a ping; for the GitHub panels, when there's a `GITHUB_TOKEN`, GitHub accepts it and its quota isn't spent. Otherwise 503. A feature the deployment doesn't serve is skipped: one `site.yaml` turns off, or SUMMON in `auto` with neither its key nor Upstash set, as on a fork that hasn't added them (one without the other fails). It caches its answer for 30 s, and uptime monitors use it. The body reports `github_quota` as true or false, never the count, since the endpoint is public.

## Decisions

- **#89:** the content to rewrite reaches the model fenced as data, behind a section allowlist and the body cap.
- **#98:** fields that become links are never model-authored; the server restores them.
- **#107:** validate before metering, and meter before calling the model.
- **#113:** the paid path fails closed when Redis is unavailable.
- **#131:** one request per click, and a failed regeneration never blanks the page.
- **#142:** DISPEL ENCHANTMENT offers to revert only content that actually changed.
- **#144:** the lore varies by form, a register per press.
- **#161:** the About text in paragraphs.
- **#174:** every landing page ships a real head, and unknown paths a real 404.
