<!-- `Closes #N` only for a full fix; otherwise `Refs #N`, with no closing keyword anywhere (CONTRIBUTING.md, #169). -->
Refs #

## What changes

## How it was checked
<!-- The commands you ran and what they showed. For a UI change, before and after screenshots, in light and dark. -->

- [ ] `npm run lint`, `npm run typecheck`, `npm run test:run` and `npm run build` in `frontend/`
- [ ] `npm run test:e2e` in `frontend/`
- [ ] `python3 -m pytest -q` and CI's flake8, black and isort lines, if `api/` changed
- [ ] Docs updated for any change to behaviour, an env var, a command or a limit
