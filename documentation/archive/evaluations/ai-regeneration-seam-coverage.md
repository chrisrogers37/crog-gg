> Historical snapshot. All four gaps below have since closed (#105).

# AI regeneration: what the seam tests prove, and what they do not

Issue #105. Written alongside the test additions in
`frontend/src/store/__tests__/contentStore.regenerate.test.ts`.

## Why this exists

The AI regeneration path could not be verified end to end. The preview
deployment holds the `OPENAI_API_KEY`, but every path on it (including
`/api/*`) redirects to Vercel SSO, so no agent on the fleet can reach it. The
verification moved to the seam instead: mock the model's response, and prove
everything about our code that does not depend on the model being good.

## The honest split

**These tests prove:** that the store does the right thing with a given
response. One request per click, an in-flight click refused, a refusal that
keeps the page's content, a malformed body that does not take the page down
with it.

**These tests cannot prove:** that the new model writes good lore. Not its
tone, not its length in practice, not whether it reads like this site or like
a different product, not whether the rendered page still looks right. Every
response in this file is one a human wrote. A green suite here is not evidence
that the model swap was safe -- it is evidence that our code is not the thing
that will break if it was not.

That distinction is the point. The remaining check is a human loading the page
and reading what comes back.

## Coverage against the four priorities

| # | Asked for | State |
|---|---|---|
| 1 | A failed regeneration must not blank the page | Covered, mostly pre-existing |
| 2 | One request per click | Covered; the double-click half is new |
| 3 | Malformed or unexpected model output | New; 3 gaps found |
| 4 | Rate limit / cooldown surfaces in the UI | New; 1 gap found |

### A note on the issue's premise

#105 describes the path as untested. That is now out of date. PR #134 added
six tests to this file covering one-request-per-click, partial-section
failure, and the white-screen regression from #131. The additions here extend
that file rather than starting a second one, and two drafted tests were
dropped because they restated coverage that already existed under a different
name.

## Gaps found

All four are recorded as `it.fails` in the test file: the assertion states the
behaviour we want, and the marker records that today's code does the opposite.
They pass while the gap exists and start reporting the day it closes.

**One root cause covers three of them.** `regenerateContent` guards the
content it applies with `??`, which only catches `null` and `undefined`. An
empty object, an empty array and a bare string are all non-nullish, so each
one replaces the content the visitor was reading:

- `content.about = {}` replaces the bio with an empty object
- `content.portfolio.experience = []` empties the experience list
- `content.about = "some string"` puts a string where a `BioData` belongs

Each produces a blank section from an HTTP 200 the server called a success --
the same visible outcome as the #131 white screen, arriving through the
success path instead of the failure path. The fix may belong server-side, in
validating what the model returned before calling it a success. The tests say
what the visitor should experience, not where to repair it.

**The fourth is a message, not a crash.** The store throws
`new Error(result.error)` carrying the server's "Rate limit exceeded. Try
again in 30 seconds", and the catch block then discards it for a fixed
"Failed to regenerate content. Please try again." So the one refusal a visitor
could act on is phrased as though retrying were the answer, which is exactly
what re-triggers the cooldown. The paid endpoint refuses on cooldown far more
often than it errors, so this is the common path, not the exceptional one.

## Why these tests should be believed

A test that passes against current code proves nothing until it has been shown
it can fail. Two mutations were applied to `contentStore.ts` and reverted:

- removing `state.isRegenerating` from the entry guard killed exactly the
  double-click test and nothing else
- replacing `bio: about ?? state.bio` with `bio: about` killed the
  content-preservation tests, including one pre-existing one

The file was confirmed byte-identical to `HEAD` afterwards.

## Not covered

- The cooldown timer itself (`useCooldown` / `useRegeneration`). The
  store-level in-flight guard is what actually stops a double request; the
  hook's `isOnCooldown` check is a second layer that is not exercised here.
- Anything at render level. Whether a long or oddly-shaped generation still
  fits its container is a component question this seam cannot see.
- The live model. See the honest split above.
