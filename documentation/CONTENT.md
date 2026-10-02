# Content

Everything the site says about its owner lives in `frontend/public/content/` as YAML. It ships with the repo and loads at run time: the browser fetches each file through a loader in `frontend/src/utils/`. The build also reads the project files, to prerender each project's page (`frontend/scripts/vite-prerender.ts`), so a project file that won't parse fails `npm run build`.

The content belongs to the site's owner and isn't covered by the code's MIT licence; see [CONTENT-TERMS.md](../CONTENT-TERMS.md). A fork replaces it.

## Where each file shows

| File | Shows on |
|---|---|
| `bio.yaml` | `/about`: the name and tagline at the top, the About text, the contact card and the Music links |
| `timeline.yaml` | `/about`, Journey tab |
| `projects/index.yaml` and `projects/*.yaml` | `/projects`, each `/projects/<id>`, and `/about`'s Projects tab |
| `showcase.yaml` | `/about`: the photo strip |
| `experience.yaml`, `education.yaml`, `skills.yaml` | nowhere (see the last section) |

## bio.yaml

- **`display_name` and `tagline`:** the top of `/about`.
- **`about_text`:** the About section, as paragraphs separated by blank lines in one block string (`|`). The page keeps the breaks with `white-space: pre-line`.
  - The collapsed About preview is cut at a fixed height, tuned to today's text: `ABOUT_CLAMP_NARROW` (449 px) and `ABOUT_CLAMP_WIDE` (329 px) in `frontend/src/pages/About/AboutPage.tsx`. After editing `about_text`, re-measure them (#162), or the fade can fall mid-line, or hide most of the text.
- **`email` and `location`:** the contact card.
- **`social_links`:** `github`, `hoobe`, `spotify` and `linkedin` are required; `telegram`, `instagram_personal` and `instagram_music` are optional. The contact card and the Music tab link them.
- **Never written by the model.** SUMMON NEW LORE rewrites the About text, but the server puts `email` and `social_links` back after every rewrite (`_UNAUTHORED_KEYS` in `api/index.py`), because the page turns them straight into links.
- `role` is typed but nothing reads it.

## timeline.yaml

**`entries`**, newest first. Each has:
- `type`: `role`, `education` or `milestone`;
- `title`, `organization` and `one_liner`;
- `start_date` and `end_date`. A date is "Mon YYYY" (a three-letter month, e.g. "Nov 2025"), "YYYY", or `present`, in lowercase. Quote a bare year (`"2021"`): unquoted, YAML reads a number, and the date parser expects text.
- `domain` (optional): picks the organisation's logo, `frontend/public/logos/<domain>.png`, a self-hosted 64 px PNG (#178). With no file, there's no logo.
- `skills`: these light up as bubbles while the entry is on screen.

**`skill_categories`**, each with a `color` and the `skills` in it.
- `color` is a quoted hex colour, `"#rrggbb"` or `"#rgb"`. Unquoted, YAML reads `#` as the start of a comment. Anything else shows in the default grey.
- A skill in no category shows in grey too.

## projects/

**`index.yaml`** lists which project files the site shows.
- A file it doesn't list is shown nowhere.
- But it's still public: everything in `frontend/public/` is served as is. For example, `/content/projects/hedwig.yaml` is served today.

**Each project file:**
- **`id`:** a lowercase slug (`my-project`). It's the page's URL, `/projects/<id>`, and the name of its prerendered file.
- **`title`, `description` and `url`:** required. `url` is the main link.
- **`icon`:** one emoji, written as a YAML escape (`icon: "\U0001F680"`). The card prints it as text, and no icon font is loaded.
- **`technologies`:** the card shows the first three.
- **`github`** (optional): a public repo of the site's GitHub owner (`GITHUB_USERNAME` in `api/_lib/request_utils.py`). The page looks the repo's name up under that owner, so another owner's repo would show the wrong repo, or no README. Without `github`, a `url` that is a GitHub repo is used instead.
- **`demo`** (optional): when it differs from `url`, the page embeds it. Its exact origin must then be in `frame-src` in `vercel.json`, or the frame is blocked.
- **`order`:** where the project sits, lowest first. `index.yaml` decides which projects show, and `order` decides where.
- **`gradient`:** the card's header colour. Without one, the header is grey.
- **`status`:** a badge on the project's page (`active`, `archived` or `experimental`).
- **`category`, `featured`, `tags` and `image`** are read but not shown (#190's M24 decides their future).

The add-project skill (`.claude/skills/add-project/SKILL.md`) walks through adding a project.

## showcase.yaml

**`images`**, each with:
- `src`: a photo's base path. Its WebP variants live next to it in `frontend/public/profile-photos/`; `scripts/photos/make-variants.py` makes them.
- `alt`: the image's description.

The strip needs at least three images. With fewer, it doesn't show.

## experience.yaml, education.yaml and skills.yaml

They're loaded at start-up, but nothing renders them: the Journey tab renders `timeline.yaml`. Editing them changes nothing on the site. #159's item 1 decides whether they're deleted, or rendered on `/about`.

## What catches a mistake

- **`npm run build`** parses every project file `index.yaml` lists, so a broken one fails the build.
- **The unit tests** read the shipped content with the site's own loaders. For example, a project id the router can't serve fails `router.test.tsx`.
- **The e2e tests** run against the shipped content, and fail rather than skip when it's missing (#120).
