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
| `bio.yaml` | `/about`: the name and tagline at the top, the About text, and the location on the contact card |
| `timeline.yaml` | `/about`, Journey tab |
| `projects/index.yaml` and `projects/*.yaml` | `/projects`, each `/projects/<id>`, and `/about`'s Projects tab |
| `showcase.yaml` | `/about`: the photo strip |
| `experience.yaml`, `education.yaml`, `skills.yaml` | nowhere ([below](#experienceyaml-educationyaml-and-skillsyaml)) |

## bio.yaml

- **`display_name` and `tagline`:** the top of `/about`.
- **`about_text`:** the About section, as paragraphs separated by blank lines in one block string (`|`). The page keeps the breaks with `white-space: pre-line`, so write each paragraph on one line: a line break inside a paragraph shows on the page.
  - The collapsed About preview is cut at a fixed height, tuned to today's text (`about.preview_height` in `site/site.yaml`). After editing `about_text`, re-measure it (#162), or the fade can fall mid-line, or hide most of the text.
- **`location`:** the contact card.
- **`email` and `social_links`:** no longer read by the page, which takes the email address and the links from `site/site.yaml` (#188); #190 removes them from here. The server still puts them back after every rewrite (`_UNAUTHORED_KEYS` in `api/index.py`), so the model can't write them.
- SUMMON NEW LORE rewrites the bio's text: the name, the tagline, the About text and the location.
- `role` is typed but nothing reads it.

## timeline.yaml

**`entries`**. The Journey tab sorts them by `end_date`, newest first, so file order only breaks ties. Each has:
- `type`: `role`, `education` or `milestone`;
- `title`, `organization` and `one_liner`;
- `start_date` and `end_date`. A date is "Mon YYYY" (a three-letter month, e.g. "Nov 2025"), "YYYY", or `present`, in lowercase. Quote a bare year (`"2021"`): unquoted, YAML reads a number, and the date parser expects text.
- `domain` (optional): picks the organisation's logo, `site/public/logos/<domain>.png`, a self-hosted 64 px PNG (#178). With no file, there's no logo.
- `skills`: these light up as bubbles while the entry is on screen. Required, even if empty (`skills: []`): an entry without it breaks the Journey tab.

**`skill_categories`**, each with a `color` and the `skills` in it.
- `color` is a quoted hex colour, `"#rrggbb"` or `"#rgb"`. Unquoted, YAML reads `#` as the start of a comment. Anything else shows in the default grey.
- A skill in no category shows in grey too.
- Each category's `skills` is required too (`skills: []` if empty): a category without it breaks the Journey tab.

If `timeline.yaml` won't load or parse, the Journey tab says "Loading journey..." and stays that way (#190 M23).

## projects/

**`index.yaml`** lists which project files the site shows.
- A file it doesn't list is shown nowhere.
- But it's still public: everything in `site/public/` is served as is.

**Each project file:**
- **`id`:** a lowercase slug (`my-project`). It's the page's URL, `/projects/<id>`, and the name of its prerendered file.
- **`title` and `description`:** required.
- **`url`:** the main link. Without one, the card falls back to `demo`, then `github`.
- **`icon`:** one emoji, written as a YAML escape (`icon: "\U0001F680"`). The card prints it as text, and no icon font is loaded.
- **`technologies`:** the card shows the first three.
- **`github`** (optional): a public repo of the site's GitHub owner (`GITHUB_USERNAME` in `api/_lib/request_utils.py`). The page looks the repo's name up under that owner, so another owner's repo would show the wrong repo, or no README. Without `github`, a `url` that is a GitHub repo is used instead.
- **`demo`** (optional): when it differs from `url` and isn't on github.com, the page embeds it. Its exact origin must then be in `frame-src` in `vercel.json`, or the frame is blocked.
- **`order`:** where the project sits, lowest first; `index.yaml`'s order only breaks ties. `order: 0` counts as unset and sorts last.
- **`gradient`:** the card's header colour. Without one, the header is grey.
- **`status`:** a badge on the project's page (`active`, `archived` or `experimental`).
- **`category`:** the filter buttons on `/projects`; the raw value is the button's label.
- **`featured`, `tags` and `image`** are read but not shown (#190's M24 decides their future).

The add-project skill (`.claude/skills/add-project/SKILL.md`) walks through adding a project.

## showcase.yaml

**`images`**, each with:
- `src`: the photo's base path in `site/public/profile-photos/`. To add or change one, see CLAUDE.md's Image Handling.
- `alt`: the image's description.

The strip needs at least three images. With fewer, it doesn't show.

## experience.yaml, education.yaml and skills.yaml

They're loaded at start-up with the rest of the content, but nothing renders them: the Journey tab renders `timeline.yaml`. A valid edit changes nothing on the site, but a broken, blank or deleted file takes `/about` and `/projects` down (#190 M23). To retire one, leave its list empty (`experience: []`). #159's item 1 decides whether they're deleted, or rendered on `/about`.

## site/site.yaml

Read when the dev server, the build or the tests start, checked, and served to the app as `virtual:site-config` (`frontend/scripts/vite-site.ts`). A mistake stops the build with every problem by key, such as `socials.0.url: expected an https URL`; an unknown key is a mistake too.

- **`owner`:** `name` (the header, the footer, the Person schema and the landing page's byline), `email` (the contact card), `job_title`, `works_for` (optional: `name`, `url`), `image` (a path in `site/public/`) and `knows_about`, for the Person schema.
- **`site.url`:** the canonical origin, `https://` with no path or trailing slash. Every absolute link to the site is built from it.
- **`home`:** what `/` is. `landing` is the Claudlobby landing page, with the personal page at `/about`. `profile` makes the personal page `/`, and drops the landing page and every Claudlobby link.
- **`seo`:** `site_name` (appended to every title), `image` (the social card: `path`, `width`, `height`, and `alt`, which must match the card's text in `site/og-image.html`), and the `description` of `about` and `projects`.
- **`socials`:** each has an `id`, a `label` (the link's text and its name to a screen reader), an `icon` (`github`, `linkedin`, `telegram`, `instagram`, `spotify`, `hoobe` or `link`), an `https` `url`, and `show_in`: any of `footer`, `menu`, `contact`, `music` and `schema` (the Person schema's `sameAs`). They show in the order listed.
- **`footer.source_repo_url`** (optional): the repo the site is built from; the footer links to it as "view source", at the commit the site was built from when Vercel names it (`VERCEL_GIT_COMMIT_SHA`).
- **`sections`:** `/about`'s tabs, in order: `about`, `journey`, `projects` and `music`, each with a `label`. `about` is required, since the collapsed preview is About's; leave another out to hide it.
- **`hero`:** `photos` (base paths in `site/public/profile-photos/`; one is picked at random) and `typewriter` (the lines the header types out).
- **`about.preview_height`:** `narrow` and `wide`, in px: where the collapsed About text fades, tuned to `bio.yaml`'s `about_text` (#162).
- **`contact`:** the card's `heading` and `text`.
- **`music`:** the tab's `intro`, with `{artist}` where the `artist` name goes; `embed` (optional), the player's URL, whose origin must be in `frame-src` in `vercel.json`; and `embed_title` (optional), the player's name to a screen reader, "music player" if left out.

The Claudlobby landing page's copy isn't here: it's a typed module (`frontend/src/content/claudlobby.ts`) with its own rules. A fork sets `home: profile` instead ([FORKING.md](../FORKING.md)).

## What catches a mistake

- **`npm run build`** checks `site/site.yaml`, and parses every project file `index.yaml` lists, so a mistake in either fails the build.
- **`npm run site:check`** (in `frontend/`) checks what the shape can't: the files `site.yaml` and `index.html` name exist (the header photos at every size too), the music player's origin is in the CSP, and none of `site.yaml`'s distinctive values (the name, email, host, site name, page descriptions, social URLs and player) is typed into the code.
- **The unit tests** read the shipped content with the site's own loaders. `shippedContent.test.ts` holds each project to the rules above (one emoji icon, repos of the site's owner, a `frame-src` entry for an embedded demo), `photos.test.ts` checks every photo's variants exist, and a project id the router can't serve fails `router.test.tsx`.
- **The e2e tests** run against the shipped content, and fail rather than skip when it's missing (#120).
