# Content

The owner's files live in `site/`, at the repo root:
- **`site/site.yaml`** is who the site is: the name, the URLs, the socials, the page descriptions, the photos and the copy around the content. The build reads and checks it, and bakes it in ([below](#sitesiteyaml)).
- **`site/public/content/`** is the content, as YAML. It ships with the repo and loads at run time: the browser fetches each file through a loader in `frontend/src/utils/`. The build also reads the project files, to prerender each project's page (`frontend/scripts/vite-prerender.ts`).

Everything else in `site/public/` (the photos, the logos, the social card, the icons) is served as is, at the site's root.

The content belongs to the site's owner and isn't covered by the code's MIT licence; see [CONTENT-TERMS.md](../CONTENT-TERMS.md). A fork replaces it.

## Where each file shows

| File | Shows on |
|---|---|
| `site/site.yaml` | every page: who the site is ([below](#sitesiteyaml)) |
| `bio.yaml` | `/`: the name and tagline at the top, the About text, and the location in the contact section |
| `timeline.yaml` | `/`, the journey section |
| `projects/index.yaml` and `projects/*.yaml` | `/projects`, each `/projects/<id>`, and `/`'s projects section |
| `showcase.yaml` | `/`: the photo strip |

Every content file is held to a shape (`frontend/src/config/contentSchema.ts`, #190): by `npm run build`, by `npm run site:check`, and by the page as it loads them. A field that's missing or the wrong kind, or a key the file shouldn't have, fails with the file and the field named. On the page, a file that fails takes only its own part of the site with it, which says so and offers a retry: `bio.yaml` is the home page's, and a broken `showcase.yaml` only hides the photo strip.

## bio.yaml

- **`display_name` and `tagline`:** the top of `/`. The tagline's first line is the headline, and the rest reads under it; with no tagline, the name is the headline.
- **`about_text`:** the About section, as paragraphs separated by blank lines in one block string (`|`). The page keeps the breaks with `white-space: pre-line`, so write each paragraph on one line: a line break inside a paragraph shows on the page.
- **`location`** (optional): the contact section. It and `tagline` (optional) show only when set.
- The email address and the links are in `site/site.yaml` (#188), not here.
- SUMMON NEW LORE rewrites the bio's text: the name, the tagline, the About text and the location.

## timeline.yaml

**`entries`**. The journey section sorts them by `end_date`, newest first, so file order only breaks ties. Each has:
- `type`: `role`, `education` or `milestone`;
- `title`, `organization` and `one_liner`;
- `start_date` and `end_date`. A date is "Mon YYYY" (a three-letter month, e.g. "Nov 2025"), "YYYY", or `present` (any case). A bare year works quoted or not. Anything else fails, an unquoted ISO date (`2025-03-01`) included.
- `domain` (optional): picks the organisation's logo, `site/public/logos/<domain>.png`, a self-hosted 64 px PNG (#178). With no file, there's no logo.
- `skills` (optional): these light up as bubbles while the entry is on screen.

**`skill_categories`**, each with a `color` and the `skills` in it.
- `color` is a quoted hex colour, `"#rrggbb"` or `"#rgb"`. Unquoted, YAML reads `#` as the start of a comment. Anything else shows in the default grey.
- A skill in no category shows in grey too.
- A category's `skills` is optional too; a category with no body fails.

If `timeline.yaml` won't load or doesn't fit, the journey section says so, naming the file, with a retry; with no entries, it says there's nothing yet.

## projects/

**`index.yaml`** lists which project files the site shows, in the order it shows them (#190), each as a lowercase file name (`my-project.yaml`), once.
- A file it doesn't list is shown nowhere.
- But it's still public: everything in `site/public/` is served as is.
- **`featured`** (optional): one of the files it lists, shown first and larger, on `/` and `/projects`. A file it doesn't list fails. The projects' loading skeleton draws a featured card, so a site that features none sees its cards move up as they arrive; `site.example/` features one.

**Each project file:**
- **`id`:** a lowercase slug (`my-project`). It's the page's URL, `/projects/<id>`, and the name of its prerendered file.
- **`title`, `description`, `icon` and `category`:** required.
- **`url`** (optional): the main link, `https`. Without one, the project page's link falls back to `demo`, then `github`.
- **`icon`:** one emoji, written as a YAML escape (`icon: "\U0001F680"`). The featured card and the project's page print it as text, and no icon font is loaded.
- **`technologies`** (optional): the list shows them all, in order.
- **`github`** (optional): a public repo of the site's GitHub owner (`github.username` in `site/site.yaml`, or one of its `allowed_owners`). The API serves no one else's, so another owner's repo shows no stats or README, and `npm run site:check` fails, unless the project has a page of its own (below), which shows neither. Without `github`, a `url` that is a GitHub repo is used instead.
- **`demo`** (optional): when it differs from `url` and isn't on github.com, the page embeds it. Its exact origin must then be in `frame-src` in `vercel.json`, or the frame is blocked.
- **`status`** (optional): `active`, `archived` or `experimental`, on the project's page; its card in the list names it when it isn't `active`.
- **`share_card`** (optional): the project page's own link preview, where it isn't the site's card: `path` (a PNG in `site/public/`), `width`, `height`, and `alt`, the card's words. Like the site's card, the PNG at `/<name>.png` is rendered from `site/<name>.html` by `node scripts/og-image/render.mjs` (from `frontend/`). `npm run site:check` holds the PNG to its size and, where the site keeps the source, the alt to the source's headline and the line under it (its `h1`, then its `.sub`), and fails on a source that renders a card nothing names.
- **`category`:** on the project's page, beside its status; the raw value is shown.
- Nothing else: `order`, `featured`, `tags` and `image` were never shown and are gone (#190), so a file that still has one fails, naming it. (Which project is featured is `index.yaml`'s call.)
- **A page of its own:** a project whose id `frontend/src/content/ownPages.ts` lists shows its own page (`projectPages.ts`) instead of the standard one, as Claudlobby's does. Claudlobby's wears its org's look: its mark is Claudfather's avatar cropped to its medallion (`frontend/scripts/photos/originals/claudfather.jpg`, made into `site/public/profile-photos/claudfather-*.webp` like the photos, which `npm run site:check` finds when the site lists Claudlobby), and its `share_card` is `site/public/claudlobby-card.png`, from `site/claudlobby-card.html`.

The add-project skill (`.claude/skills/add-project/SKILL.md`) walks through adding a project.

## showcase.yaml

**`images`**, each with:
- `src`: the photo's base path in `site/public/profile-photos/`. To add or change one, see CLAUDE.md's Image Handling.
- `alt`: the image's description.

The strip needs at least three images. With fewer, it doesn't show.

## site/site.yaml

Read when the dev server, the build or the tests start, checked, and served to the app as `virtual:site-config` (`frontend/scripts/vite-site.ts`). A mistake stops the build with every problem by key, such as `socials.0.url: expected an https URL`; an unknown key is a mistake too.

- **`owner`:** `name` (the header, the footer and the Person schema), `email` (the contact section), `job_title`, `works_for` (optional: `name`, `url`), `image` (a path in `site/public/`) and `knows_about`, for the Person schema.
- **`site.url`:** the canonical origin, `https://` with no path or trailing slash. Every absolute link to the site is built from it.
- **`site.aliases`** (optional): other origins that serve the site, such as the apex that redirects to `www`. The API accepts calls from them and from `site.url` (CORS).
- **`github.username`:** whose public repos the project pages' stats and READMEs come from. The API serves no one else's, unless `github.allowed_owners` (optional) names them.
- **`github.show_counts`** (optional): `false` hides a repo's stars, forks, watchers and open issues on project pages, leaving its language, license, last update and topics. Shown if left out. Low counts can undersell a project, so a site can hide them until they say something.
- **`features`** (optional): whether SUMMON NEW LORE (`regenerate`) and the project pages' GitHub panels (`github`) show. `auto`, the default, shows each where the deployment can serve it, as `GET /api/features` reports (SUMMON needs an OpenAI key and Upstash). `on` shows it regardless; `off` hides it, and the API refuses it too (#189).
- **`seo`:** `site_name` (appended to every title), `image` (the social card: `path`, `width`, `height`, and `alt`, which must match the card's text in `site/og-image.html`), and the `description` of `about` (the home page) and `projects`.
- **`socials`:** each has an `id`, a `label` (the link's text and its name to a screen reader), an `icon` (`github`, `linkedin`, `telegram`, `instagram`, `spotify`, `hoobe` or `link`), an `https` `url`, and `show_in`: any of `footer`, `menu`, `contact`, `music` and `schema` (the Person schema's `sameAs`). They show in the order listed.
- **`footer.source_repo_url`** (optional): the repo the site is built from; the footer links to it as "view source", at the commit the site was built from when Vercel names it (`VERCEL_GIT_COMMIT_SHA`).
- **`sections`:** the home page's sections, in order: `about`, `journey`, `projects` and `music`, each with a `label`, its heading. `about` is required, since it's the text SUMMON rewrites; leave another out to hide it.
- **`hero`:** `photos` (base paths in `site/public/profile-photos/`; one is picked at random) and `typewriter` (the lines the hero types out).
- **`regenerate`:** the rewrite button (SUMMON NEW LORE here), which the API reads too (#189). It stays required with `features.regenerate: off`.
  - `labels`: the button's words, idle (`button`), while it works (`busy`), and the undo (`reset`). The rewrite is told to leave `button` as it is, since the About text's last line names it.
  - `persona`: `name_variants` (the rewritten name keeps one of these) and `pronouns` (`he`, `she` or `they`, the default).
  - `style_rules` (optional): sentences asked of every rewrite, word for word. A request, not a check. Keep them narrow: casing, formality and voice are the register's to choose, so a rule such as "write in lowercase" fights every register the button picks. A mark that is wrong in every register (the owner's em-dash rule) is the kind that works.
- **`contact`:** the contact section's `heading` and `text`.
- **`music`:** the music section's `intro`, with `{artist}` where the `artist` name goes; `embed` (optional), the player's URL, whose origin must be in `frame-src` in `vercel.json`; and `embed_title` (optional), the player's name to a screen reader, "music player" if left out.

Claudlobby's page's copy isn't here: it's a typed module (`frontend/src/content/claudlobby.ts`) with its own rules, shown only on a site that lists the `claudlobby` project ([FORKING.md](../FORKING.md)).

`home` and `about` (which held only `preview_height`) are gone (the redesign: the owner's page is `/`, in one column), so a `site.yaml` that still has either fails, naming the key.

## What catches a mistake

- **`npm run build`** checks `site/site.yaml`, and holds `bio.yaml`, `timeline.yaml`, `showcase.yaml` and every project file `index.yaml` lists to their shapes, so a mistake in any fails the build, naming the file and the field.
- **`npm run site:check`** (in `frontend/`, part of `npm run test:run` too) holds the active site to the rules its content must meet (#191):
  - the files `site.yaml` and `index.html` name exist, and every photo at every size, and a logo for each timeline domain;
  - the music player's origin is in the CSP;
  - none of `site.yaml`'s distinctive values (the name, email, host, site name, page descriptions, social URLs and player) is typed into the code;
  - the projects: at least one, each in a category, one emoji icon, repos of the site's owner (a project with a page of its own shows no GitHub panels, so its repo may be anyone's), Claudlobby's file naming no other model provider when the site lists it, and a `frame-src` entry for an embedded demo;
  - the About copy is at least one paragraph and, unless `features.regenerate` is `off`, ends on the sign-off that names the button (`regenerate.labels.button`);
  - each link-preview card, the site's and any project's, is a PNG at the size its head declares; where its source is in `site/`, its alt says what the card says; and neither uses an em-dash;
  - the Person schema's role matches the timeline's current one.
- **The unit tests** read `site.example/`, a fictional site, so they test the code and not anyone's content. A content file that doesn't fit its shape, a project id that can't be a page's URL among them, fails the build and `npm run site:check` (`config/contentSchema.ts`).
- **The e2e tests** run against the active site, and CI runs them on `site.example` too. They fail rather than skip when content is missing (#120), and skip only for a structural reason, such as a site that doesn't list Claudlobby.
