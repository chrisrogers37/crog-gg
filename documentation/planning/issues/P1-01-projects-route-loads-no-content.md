## Summary

Direct navigation to `/projects` or `/projects/:slug` never loads content, so the
Projects page renders its loading skeleton forever and a project detail page shows
a false "Project Not Found". Content only loads if the user visits `/` first in
the same session.

## Root cause

`useContentLoader()` (which triggers `contentStore.loadContent()`) is only called
from `HomePage`:

```ts
// frontend/src/hooks/useContentLoader.ts:16-26
export function useContentLoader() {
  const loadContent = useContentStore((state) => state.loadContent);
  useEffect(() => {
    loadContent();
  }, [loadContent]);
  ...
}
```

`ProjectsPage` reads `projects` / `isLoading` from the store but never calls
`loadContent()` on mount (it only wires it to a Retry button). The store's initial
state is `isLoading: true, projects: []` (`frontend/src/store/contentStore.ts:70`),
so a cold visit to `/projects` stays on the skeleton branch
(`ProjectsPage.tsx:52-63`) indefinitely, and `/projects/:slug` hits the
"not found" branch (`ProjectDetailPage.tsx:30-39`).

## Fix direction

Trigger content loading at a level every route shares (e.g. call
`useContentLoader()` from `Layout`, or trigger `loadContent()` from the router),
**or** add a mount effect to the project pages. Add an in-flight guard to
`loadContent()` so multiple entry points don't cause duplicate fetches.

## Acceptance criteria

- Visiting `/projects` directly (no prior `/` visit) renders the project grid.
- Visiting `/projects/:slug` directly renders the correct project detail.
- No duplicate YAML fetches when navigating between routes.
- A regression test (unit or E2E) covers cold navigation to `/projects`.

## References

- Tracker: `documentation/planning/tech-debt-triage_2026-07-02.md` — BUG-1
- Analysis: `documentation/planning/reviews/02-data-services-hooks.md` §3
