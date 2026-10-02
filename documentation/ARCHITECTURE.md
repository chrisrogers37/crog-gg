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

- **Routes** (`frontend/src/router.tsx`), with `home: landing` in `site/site.yaml`:
  - `/` is the Claudlobby landing page, in the main bundle.
  - `/about`, `/projects` and `/projects/:slug` load as their own chunks.
  - With `home: profile`, the personal page is `/` and there's no `/about`; the sitemap and the prerendered pages follow.
  - Anything else is the 404 page.
- **Prerendering:** the build (`frontend/scripts/vite-prerender.ts`) writes each landing page's `<head>` (title, description, social card) into its own HTML file. So `/projects/<id>` is served from `projects/<id>.html`, and a crawler sees the right tags without running JavaScript. An unknown path gets `404.html` with a real 404 status (#174). The sitemap is generated from the same page list, and robots.txt points to it.
- **The owner's identity:** `site/site.yaml`, checked and baked in at build time. The `site()` plugin (`frontend/scripts/vite-site.ts`) serves it to the app as `virtual:site-config` and makes `site/public` the public folder. The build's own code (the prerender) can't import the virtual module, because `vite.config.ts` loads before any plugin; it calls `siteConfig()` (`frontend/scripts/site-config.ts`), and `createSeo(site)` (`frontend/src/seo/site.ts`) builds the heads from either (#188).
- **Content:** the portfolio's YAML (`site/public/content/`) is fetched once, at start-up, into a zustand store (`frontend/src/store/contentStore.ts`). The landing page's copy is a typed module (`frontend/src/content/claudlobby.ts`), bundled so the hero needs no request.
- **State:** `contentStore` holds the content, the regeneration and the cooldown the server reported. `uiStore` holds the theme, persisted in localStorage when the browser allows it.
- **Analytics:** Vercel Web Analytics, from the same origin (`/_vercel/insights`), cookieless. Links to the Claudlobby repo's front page, and the quickstart's link into its README, go through `RepoLink`, which counts each click and where it was. Its other links don't: the releases link counts as `updates_click`, and the getting-started guide, the feed, issues and the counts' source aren't counted. The events are listed in the README's [Web Analytics](../README.md#web-analytics).

## API

Every route is in `api/index.py`. Shared helpers are in `api/_lib/`: the underscore keeps Vercel from treating them as functions of their own.
- `prompts.py`: the regenerate prompt pack.
- `github_proxy.py`: the proxy's helpers.
- `rate_limit.py` and `redis_client.py`: the limiter, and the Upstash REST client.
- `cache.py`: the Redis JSON cache behind the `/languages` aggregate.
- `request_utils.py`: the visitor's identity and the GitHub settings.

### /api/regenerate, gate by gate

1. **The body:** over 64 KB is 413. Anything but a JSON object is 400.
2. **The sections:**
   - `sections` must be a non-empty object;
   - every name must be in the prompt allowlist (`_PROMPTS`);
   - every body must be an object, and no longer than `MAX_SECTION_CHARS` (400 or 413).

   Nothing is metered yet, so a rejected request costs nothing (#107).
3. **The key:** no `OPENAI_API_KEY` is 500.
4. **The cooldown:** 30 s per visitor, claimed atomically. On cooldown is 429, with `limit: "cooldown"` and the time left.
5. **The daily caps:** one slot per section, in two rolling 24 h windows: the visitor's (30) and the site's (300). The page sends one section per press (#190 M07), so a press uses one slot: 30 presses a day per visitor.
   - The visitor's full is 429 (`limit: "daily"`). The site's full is 503 (`limit: "budget"`).
   - Charged before any model call, so a request that then fails still spends its slots (#107), and forcing errors can't buy free generations.
6. **The rewrite:** one lore register is picked per press. Each section is rewritten in parallel, under a 45 s deadline for the whole press. A section is retried once after a connection failure or an OpenAI server error, if time allows; a read timeout isn't retried, since it would pay for the same slow generation twice.
7. **The checks on what came back:**
   - each rewrite must be recognisably the section it replaces;
   - fields the model must never write are put back from the original (`_UNAUTHORED_KEYS`: `email` and `social_links`, which the page turns into links, #98).
8. **The answer:** 200 with the rewritten sections and any `failed_sections`. It's 500 only when nothing came back. Either way the cooldown is already running, and the answer says so.

If Redis is unreachable at step 4 or 5, the answer is 503: the paid path fails closed, so it never runs unmetered (#113). The GitHub endpoints' rate limiter fails open instead; the `/languages` aggregate answers 503 too (see below).

### Adding a regenerable section

1. Add its prompt to `_PROMPTS` in `api/_lib/prompts.py`, and its output budget to `_MAX_COMPLETION_TOKENS` in `api/index.py`. A test fails until both name the same sections.
2. List in `_UNAUTHORED_KEYS` any field that reaches an `href`, a `src` or a similar sink. A prompt asking the model to leave a field alone is a request; the table is the enforcement.
3. Send it from the client (`regenerateContent` in `contentStore.ts`), and validate what comes back before it replaces anything on the page.

Each section costs the visitor a daily slot, so send only what the page shows (#190).

### The GitHub proxy

- `/api/v1/github/repo`, `/readme` and `/languages/<name>` serve **only the owner's public repos**. A private repo gets the same 404 as a missing one, so the proxy can't reveal which private repos exist.
- Each is limited to 30 requests a minute per visitor (failing open), and a 200 is cached at Vercel's edge for an hour.
- The `/languages` aggregate is cached in Redis for an hour. When that cache can't be read, it answers 503 rather than make 1 + N uncached GitHub calls (#194 M33).
- `/contributions` asks GitHub's GraphQL API, which needs `GITHUB_TOKEN`.

### Metering, identity and failures

- **A visitor** is the client address Vercel reports (`x-real-ip`), with an IPv6 /64 counted as one. With `IP_HASH_SALT` set, it's hashed before it reaches a key or a log line; without it, keys and logs name the address, and the function warns once per cold start.
- **`/api/limits`** reports the cooldown, so the page can count it down. `metering_available: false` means Redis is down. A 200 from it is not a health signal (#162).
- **`/api/health`** answers 200 when the OpenAI key is set, Redis answers a ping, and (when there's a `GITHUB_TOKEN`) GitHub accepts the token and its quota isn't spent; otherwise 503. It caches its answer for 30 s, and uptime monitors use it.

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
