# Model upgrade + denial-of-wallet guard (#113)

**Status:** implemented, one verification outstanding (see Bounds)
**Scope:** `OPENAI_MODEL` modernisation (requested 2026-08-01) + issue #113 fail-open

These are one job. A model change moves cost-per-call, and the only cost control
on `/api/regenerate` failed open. Shipping either alone would have been wrong:
the upgrade without the fix changes the size of an uncapped bill, and the fix
without the upgrade gets re-reasoned the moment the model changes.

## 1. The model

### There is a deadline, not just a preference

`gpt-3.5-turbo` is **deprecated with a scheduled shutdown of 2026-10-23**
(OpenAI deprecations page, checked 2026-08-03). SUMMON NEW LORE stops working
that day if nothing changes. That is ~11 weeks out and converts this from
housekeeping into dated work.

### Do not take OpenAI's suggested replacement

The deprecation page recommends `gpt-5.6-terra`. For this workload that is
**+438% per call** — it would multiply the exposure on the endpoint that was
failing open. Recommendation rejected on cost.

### Measured cost, not estimated

Input tokens counted with `tiktoken` (`o200k_base`) against the real prompts in
`api/index.py` and a representative About payload. Output is estimated at the
size of the content being rewritten (72 tok) — the live run replaces that
estimate with actual `usage`.

Per section call: **409 input / ~72 output tokens.**

| Model | $/call | $/IP-day (30 slots) | vs current |
|---|---|---|---|
| `gpt-3.5-turbo` (current) | $0.00031250 | $0.00937 | — |
| `gpt-5.6-terra` (OpenAI's suggestion) | $0.00168200 | $0.05046 | **+438%** |
| **`gpt-5.6-luna` (picked)** | **$0.00016820** | **$0.00505** | **−46%** |
| `gpt-5-mini` | $0.00024625 | $0.00739 | −21% |
| `gpt-4o-mini` | $0.00010455 | $0.00314 | −67% |
| `gpt-4.1-nano` | $0.00006970 | $0.00209 | −78% |
| `gpt-5-nano` | $0.00004925 | $0.00148 | −84% |

**The upgrade is 46% cheaper per call than today.** It reduces denial-of-wallet
exposure rather than worsening it, so the cap did not have to bite harder to
compensate.

### Why `gpt-5.6-luna` over the cheaper nanos

Weighed on the four lenses:

- **Best practice** — a current-generation small tier is the right class for a
  short structured rewrite. All candidates qualify.
- **Future-proof** — decisive. We are here *because* a model retired. `gpt-5-nano`
  is three point-releases back in the 5.x line; `gpt-5.6-luna` is the current
  generation's cheap tier and therefore has the longest runway before the next
  forced migration. Paying ~$0.0001/call more to not repeat this exercise is
  cheap at these volumes.
- **Elegant** — one constant.
- **Codebase-consistent** — the existing comment says the pick is "governed by
  cost and latency per call rather than raw capability". Luna is cheaper than
  the model that comment was written for, so it satisfies its own criterion.

`gpt-5-nano` remains the cost floor if maximum savings is preferred — a
one-word change. At 30 slots/IP-day the absolute difference is under a cent.

## 2. The fail-open (#113)

### What was actually broken

Every spend control on `/api/regenerate` — the 30s cooldown, the 30/day cap, and
the cooldown refresh — routes through the same Upstash Redis. All three returned
"allowed" on any exception, and none logged. One outage removed the entire
control surface of an unauthenticated endpoint that fans out one paid call per
section, and nothing recorded that it had.

### The fix: safe by default, opt out where it is free

Rather than special-casing the paid endpoint, the limiter's default is now
fail-closed and callers for whom an outage costs nothing pass `fail_open=True`.

The asymmetry of mistakes drove this. Forgetting the flag on a paid gate leaks
money silently; forgetting it on a free gate produces a loud, cheap 503. Making
safety the default puts the direction people forget in on the harmless side.
A future spend gate is protected without anyone remembering anything.

`RedisUnavailable` is handled once via `@app.errorhandler`, so no handler wraps
its own gates and gates added later are covered.

`start_cooldown` deliberately keeps no fail-closed mode: it runs *after* the
daily slot is consumed, so failing there would reject a request already charged
against the caller's budget. It logs.

Free endpoints (`/api/v1/github/*`, `/api/limits`) keep failing open and are
pinned by tests, so a later sweep cannot close them uniformly and take the free
surface down with it.

### Verification

`tests/test_regenerate_spend_guard.py` drives the **real** limiter with Redis
broken underneath, not a limiter patched to raise. That distinction is the
point: a raising mock proves only that the handler catches, and keeps passing if
the limiter reverts to falling open. Two-sided mutation gate, both run:

- Regress the limiter to unconditional fail-open → **4 tests fail** (both
  endpoint tests among them).
- Strip the free endpoints' opt-out → **2 tests fail**.

## 3. An independent daily spend ceiling — judged, and mostly declined in code

An in-app daily budget guard would need durable cross-invocation state. On
Vercel serverless the only such store here **is Redis** — so a budget guard
built in this codebase fails in exactly the outage it is supposed to survive.
It would be independent in name only, while adding a dependency and a failure
mode. Declined on those grounds, not on effort.

The genuinely independent control is **account-level**: a hard usage/budget cap
in the OpenAI billing dashboard. It sits outside this infrastructure entirely
and therefore holds when any mechanism here fails, including ones not
anticipated. **This is a Chris action, not a code change, and it is the single
highest-value item in this document.**

It also covers a vector the fail-closed fix does not. Fail-closed removes the
*outage* path to unbounded spend. It does not bound a **distributed** one: the
cap is per-IP, so N IPs buy 30N calls/day legitimately. At luna pricing 1,000
IPs is ~$5/day; 100,000 IPs is ~$505/day. Only an account-level ceiling bounds
that.

## Bounds

- **The model has not been exercised against the live API.** No `OPENAI_API_KEY`
  exists on the build host and the `vercel` CLI hangs on `whoami`, so the
  end-to-end run — confirming `gpt-5.6-luna` is available on this account, that
  output still parses as the JSON the frontend renders, and the real token
  `usage` — has **not** been done. The model change should not be merged on
  tests alone. Pricing and deprecation figures are from OpenAI's published pages
  on 2026-08-03, not from a billed call.
- Output token count is an estimate (size of the content being rewritten). Input
  counts are measured.
- The `#113` fix is fully verified and independent of the above.
