# Phase 07: Rewrite About and Timeline Copy for Human Tone

## PR Title

**content: rewrite about bio and timeline one-liners to sound casual and human**

## Status: ✅ COMPLETE

Completed: 2026-02-16

## Metadata

| Field                | Value                                                |
| -------------------- | ---------------------------------------------------- |
| **Risk Level**       | Low                                                  |
| **Estimated Effort** | 30 minutes                                           |
| **Files Modified**   | 3 (`bio.yaml`, `timeline.yaml`, `Timeline.test.tsx`) |
| **Dependencies**     | None                                                 |

## Overview

The `about_text` in `bio.yaml` and several `one_liner` fields in `timeline.yaml` use corporate-sounding or AI-generated phrasing. This phase rewrites all of that copy to match Chris's preferred tone: casual, lowercase, conversational, self-deprecating, no em-dashes. One unit test file also hardcodes `one_liner` values in mock data and assertions, so it needs to be updated to match.

This is a content-only change. No component logic, styling, or structure changes.

## Changes

### File 1: `frontend/public/content/bio.yaml`

Only the `about_text` field changes. All other fields (`display_name`, `tagline`, `welcome_message`, `social_links`) remain untouched.

#### `about_text`

**Before:**

```
alright, here goes...

i spend a lot of time making music, messing with audio engineering, and occasionally djing around nyc.

i stay pretty close to the cutting edge... lately that means claude code, claude code, and more claude code, building out things i'm passionate about.

when i need to recharge, i'm usually traveling somewhere new or escaping to maine to disconnect. just me, some books, and nature.

professionally, i work in data. i like taking ambiguity and creating clarity...figuring out what actually matters, building metrics that make sense, and designing infrastructure that makes insights easy for everyone, not just us data nerds.

i've been diving into crypto lately in my newest role as a blockchain data engineer and am currently re-architecting a multi trillion+ record scale blockchain data dbt analytics ecosystem.

anyways, feel free to poke around. there's plenty more to explore.

or flip the whole thing on its head and click the button below to activate FANTASY MODE.
```

**After:**

```
alright, here goes...

i make music, mess around with audio engineering, and occasionally dj around nyc. it's probably the thing i'd do if money didn't exist.

i'm kind of obsessed with ai right now... claude code has basically taken over my life. i just like building stuff and seeing what's possible.

when i need to unplug, i'm usually traveling somewhere new or hiding out in maine. just me, some books, and zero cell service.

work-wise, i'm a data person. i like figuring out what actually matters, building metrics that don't make people's eyes glaze over, and making data useful for everyone... not just us nerds who think a well-structured dbt model is beautiful.

most recently i've been doing blockchain data engineering, which basically means wrangling trillions of records and trying not to break things.

anyways, poke around. there's more to see.

or flip the whole thing on its head and click the button below to activate FANTASY MODE.
```

**Rationale:**

- Removed "i spend a lot of time" (filler) and "passionate about" (corporate cliche)
- "it's probably the thing i'd do if money didn't exist" adds personality and self-awareness
- "claude code has basically taken over my life" is more honest and funny than "staying close to the cutting edge"
- "hiding out in maine" and "zero cell service" are more vivid and human than "escaping to maine to disconnect"
- "taking ambiguity and creating clarity" is classic corporate-speak. Replaced with self-deprecating humor about dbt models being beautiful
- "re-architecting a multi trillion+ record scale blockchain data dbt analytics ecosystem" is resume-speak. Simplified to "wrangling trillions of records and trying not to break things"
- Shortened the closing. "feel free to poke around. there's plenty more to explore." is unnecessarily wordy
- No em-dashes used anywhere. Ellipses and commas only

### File 2: `frontend/public/content/timeline.yaml`

Only `one_liner` fields change. All other fields (`type`, `title`, `organization`, `domain`, dates, `skills`) remain untouched.

#### Entry 1: Artemis (Senior Data Scientist and Engineer)

**Before:**

```
building data science and engineering solutions at artemis
```

**After:**

```
data science and engineering for blockchain analytics
```

**Rationale:** "Building solutions" is generic corporate filler. The new version says what the work actually is without the buzzword wrapper. Dropped "at artemis" since the organization is already shown on the card.

#### Entry 2: AI-Maxxing (Independent)

**Before:**

```
went full send on ai - built production apps with llms, prompt engineering, and a whole lot of curiosity
```

**After:**

```
quit my job and went full send on ai. built things, broke things, learned a ton
```

**Rationale:** "A whole lot of curiosity" sounds like a cover letter. The rewrite is more honest and punchy. Adding "quit my job" gives it real stakes and personality.

#### Entry 3: Citadel (Senior Analytics Engineer)

**Before:**

```
pioneered automation in strategic finance, centralizing workflows and reducing manual processing by 90%
```

**After:**

```
automated a bunch of finance workflows that people were doing by hand. saved everyone a lot of time
```

**Rationale:** "Pioneered automation in strategic finance" is pure resume language. "Centralizing workflows and reducing manual processing by 90%" reads like a bullet point from a performance review. The rewrite says the same thing in the way you'd describe it to a friend.

#### Entry 4: Meta (Data Scientist)

**Before:**

```
supported recruiting product teams with metric design, experimentation, and forecasting
```

**After:**

```
helped recruiting teams figure out what metrics actually mattered and ran a bunch of experiments
```

**Rationale:** "Supported recruiting product teams with metric design, experimentation, and forecasting" is a job description, not a one-liner. The rewrite sounds like how you'd explain it at a dinner party.

#### Entry 5: Columbia University (MS partial)

**Before:**

```
completed 50% of coursework toward ms in applied analytics before accepting meta offer (3.83 gpa)
```

**After:**

```
got halfway through a masters before meta came calling. no regrets (3.83 gpa)
```

**Rationale:** "Completed 50% of coursework toward ms in applied analytics before accepting meta offer" is overly formal and reads like an academic record. The rewrite is honest and a little playful about leaving early for a job.

#### Entry 6: Memorial Sloan Kettering (BI Analyst II)

**Before:**

```
published nlp research and built analytics that informed hospital-wide policy
```

**After:**

```
published nlp research and built dashboards that actually changed how the hospital made decisions
```

**Rationale:** "Informed hospital-wide policy" is vague corporate-speak. "Actually changed how the hospital made decisions" is more concrete and conversational.

#### Entry 7: Memorial Sloan Kettering (BI Analyst I)

**Before:**

```
built reporting and analytics foundations supporting clinical operations
```

**After:**

```
built the reporting and analytics setup from scratch for clinical ops
```

**Rationale:** "Foundations supporting clinical operations" is textbook corporate. "Setup from scratch" is how a person would say it.

#### Entry 8: VillageMD (Data Analyst / Senior Data Analyst)

**Before:**

```
early career analytics work in healthcare, growing from data analyst to senior
```

**After:**

```
first real data job. started as an analyst, worked my way up
```

**Rationale:** "Early career analytics work in healthcare, growing from data analyst to senior" is narrating your own career arc in third person. "First real data job" is more natural and honest.

#### Entry 9: Cornell (MEng, Chemical Engineering)

**Before:**

```
engineering masters with a focus on process optimization (3.96 gpa)
```

**After:**

```
engineering masters, mostly spent optimizing chemical processes and wondering if i'd actually be a chemical engineer (3.96 gpa)
```

**Rationale:** Adds personality and foreshadowing of the career pivot. More memorable than a dry description.

#### Entry 10: Cornell (BS, Chemical Engineering)

**Before:**

```
where it all started - engineering fundamentals and problem solving
```

**After:**

```
where it all started. go big red
```

**Rationale:** "Engineering fundamentals and problem solving" is unnecessary context for a BS degree. Everyone knows what undergrad is. "Go big red" adds school spirit and personality. Replaced dash with period.

### File 3: `frontend/src/components/sections/Timeline/__tests__/Timeline.test.tsx`

The test file contains mock `one_liner` data and assertions that match exact text from `timeline.yaml`. These must be updated to match the new copy.

#### Mock data updates

Update the mock `one_liner` values to match new copy:

| Mock Entry | Before                                              | After                                                                                                   |
| ---------- | --------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| Citadel    | `"pioneered automation in strategic finance"`       | `"automated a bunch of finance workflows that people were doing by hand. saved everyone a lot of time"` |
| Artemis    | `"building data science and engineering solutions"` | `"data science and engineering for blockchain analytics"`                                               |
| Cornell BS | `"engineering fundamentals"`                        | `"where it all started. go big red"`                                                                    |
| AI-Maxxing | `"went full send on ai"`                            | `"quit my job and went full send on ai. built things, broke things, learned a ton"`                     |

#### Assertion updates

Update the test assertions that check for specific one-liner text:

**Before:**

```typescript
screen.getByText("pioneered automation in strategic finance"),
```

**After:**

```typescript
screen.getByText("automated a bunch of finance workflows that people were doing by hand. saved everyone a lot of time"),
```

**Before:**

```typescript
expect(screen.getByText("engineering fundamentals")).toBeInTheDocument();
```

**After:**

```typescript
expect(
  screen.getByText("where it all started. go big red"),
).toBeInTheDocument();
```

## Test Plan

1. `cd frontend && npm run build` - TypeScript check + build
2. `cd frontend && npm run test:run` - All unit tests including updated Timeline tests
3. `cd frontend && npm run lint` - ESLint
4. Visual: Open site locally, verify About section text renders correctly with line breaks preserved
5. Visual: Verify timeline one-liners display properly on each card
6. Visual: No text overflow or layout issues from copy length changes
7. Visual: FANTASY MODE button reference at end of about text still makes sense

## Verification Checklist

- [ ] No em-dashes in any rewritten copy
- [ ] All copy is lowercase (except "FANTASY MODE" which is intentionally caps)
- [ ] No corporate buzzwords: "pioneered", "leveraging", "passionate about", "creating clarity", "solutions"
- [ ] Tone is conversational, sounds like a person talking, not a resume
- [ ] `bio.yaml` parses correctly as valid YAML (especially multiline `|` block)
- [ ] `timeline.yaml` parses correctly as valid YAML (quotes around one-liners with special characters)
- [ ] Test mock data matches the new one-liner values exactly
- [ ] Test assertions match the new one-liner values exactly
- [ ] `npm run build` passes
- [ ] `npm run test:run` passes (all tests green)
- [ ] `npm run lint` passes
- [ ] Visual inspection confirms text renders without layout issues

## What NOT to Do

1. **Do NOT change any component code** (`.tsx`, `.ts`, `.css` files other than the test file). This is a content-only change.
2. **Do NOT change the YAML structure** (field names, nesting, types). Only change string values.
3. **Do NOT use em-dashes** (`—`) anywhere in the rewritten copy.
4. **Do NOT capitalize** the copy (keep lowercase tone). Exception: "FANTASY MODE" stays caps as it's a deliberate stylistic choice.
5. **Do NOT change** `tagline`, `welcome_message`, `display_name`, `email`, `location`, or `social_links` in `bio.yaml`.
6. **Do NOT change** `type`, `title`, `organization`, `domain`, dates, or `skills` in `timeline.yaml`.
7. **Do NOT remove the trailing newline** in YAML multiline blocks. The `|` syntax requires consistent formatting.
8. **Do NOT add quotes or special YAML characters** in one-liners without escaping. If a one-liner contains a colon, wrap it in quotes.
