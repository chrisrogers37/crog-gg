# site.example

A fictional site, in the same shape as `site/` (#191). The unit tests read it
instead of the owner's site, so a fork can change `site/` without turning the
tests red, and a fork can copy it as a starting point.

Nothing here is real: Ada Example, their projects and their photos are made up,
and the folder is dedicated to the public domain ([LICENSE](LICENSE)).

To build or check the site with it instead of `site/`, set `SITE_DIR`:

```bash
cd frontend
SITE_DIR=site.example npm run build
SITE_DIR=site.example npm run site:check
```

The API reads the same variable (`SITE_DIR=site.example python3 -m api.index`,
from the repo root), and its tests always use this folder. On Vercel, the
function bundles only `site/site.yaml` (`includeFiles` in `vercel.json`), so a
deploy of another folder needs that pattern widened.
