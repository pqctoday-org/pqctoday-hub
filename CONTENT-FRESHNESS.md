# Content freshness — how it's tracked and enforced

This repo has several **separate, purpose-built mechanisms** for catching
content that has silently aged; data curation and the data checks run outside
this repository. This file describes what each one actually checks,
how strict it is, and where it runs — read it before assuming "content
freshness" means one thing here.

## 1. The structured claim manifest — narrow, numeric, 90-day window

A handful of **specific, time-sensitive numeric/date claims** the simulation
and other surfaces make — not general content accuracy — are tracked as a
structured `{ asOf, recheck }` stamp at their source, never as a free-text date
buried in prose:

| Claim                                                                      | Source                                       |
| -------------------------------------------------------------------------- | -------------------------------------------- |
| Sim Q-Day planning anchor (2029) vs the public 2030–2040 CRQC range        | `src/data/quantumTimeline.ts`                |
| PQC protocol-support matrix snapshot (RFC/draft stages, vendor GA dates)   | `src/data/pqcProtocolMatrix.ts`              |
| Crypto-mechanism → CycloneDX 1.7 `algorithmFamily` mapping                 | `src/data/cryptoMechanisms.ts`               |
| Sim narration time anchors (`PROGRAM_START_YEAR`, derived CRQC band)       | `src/data/narrationFacts.ts`                 |
| Industry breach-cost baselines (IBM Cost of a Data Breach, annual refresh) | `src/data/roiBaselines.ts`                   |
| Individual sim "next move" claims that carry their own freshness stamp     | `src/data/simMoves.ts` (0 or more, per move) |

These aggregate into `src/data/contentFreshness.ts` (`FRESHNESS_CLAIMS`), which
only imports and combines the per-source stamps — the source files own their
own dates. Review window: **90 days** (`FRESHNESS_MAX_AGE_DAYS`). Unit-tested
in `contentFreshness.test.ts`.

**Auditor**: the content-freshness check, which runs outside this repository
before merge (it is not part of this repository's own gates).

As of 2026-09 there were **6 active claims** (5 named sources above plus 1
sim-move stamp), all within the 90-day window. Don't trust that number to stay
current.

## 2. Learn-module `lastReviewed` — two separate checks, different failure modes

Every Learn module's `content.ts` can carry a `lastReviewed` date (when a
human last checked its factual claims) **and**, separately, a `lastEdited`
date (when the file last changed). These were merged into one field until
2026-08-23, which meant `apply_approved`-driven mechanical edits silently
bumped `lastReviewed` on every applied fix — 55 of 64 dates were overstating
the real last human check (median 13 days off, max 148). They are now tracked
separately (`src/types/ModuleContentTypes.ts`) specifically so that distinction
can't recur. `src/data/moduleContentRegistry.ts` exposes both maps
(`MODULE_LAST_REVIEWED`, `MODULE_LAST_EDITED`) to the UI's References tab. A
module with no entry has never been reviewed — the key is absent, not a
placeholder.

Two independent, non-overlapping checks watch this date, because neither
alone can see every failure mode:

- **Relative-age (CM-C)** — the trust-engine data checks. Fires
  only when a module's code changed **more than 30 days after** its
  `lastReviewed` date (i.e. someone edited the module without re-reviewing
  it). A module nobody has touched in a year trips nothing here, forever —
  that gap is what check #2 below exists for. Runs with the data checks
  outside this repository, at **WARNING** severity.
- **Absolute-age** — the module review-freshness check, part of the
  content-freshness check in #1 above. Flags any module whose `lastReviewed`
  is more than **120 days** old, full stop, regardless of whether the code has
  changed since. WARN-level. As of the last run, all 64 tracked modules were within the
  120-day window.

Re-verify the module's claims before bumping `lastReviewed` — never bump the
date without actually re-checking the content; that's exactly the failure
mode the `lastReviewed`/`lastEdited` split above was built to stop recurring.

## 3. `public/data/revisions.jsonl` — the content-edit audit trail

Every real content edit (a Learn module, a Playground tool, a mechanical data
fix) is meant to append a structured record to
`public/data/revisions.jsonl` — reviewer, approval method, whether the edit
was LLM-authored, and which record ids it touched. This is **not** a
freshness _check_; it's the log that other checks and the UI read:

- **`/revisions`** (`src/components/Revisions/RevisionsView.tsx`) renders it
  as a public, chronological feed with a rolling 30-day activity summary —
  anyone can see what changed and when without reading git history.
- **The revision-coverage check** (run outside this repository before merge)
  blocks a diff that touches a Learn module's
  `content.ts`/`manifest.ts` or a Playground tool's `workshopRegistry.tsx`
  entry unless it carries a matching `revisions.jsonl` record for that item's
  id in the same diff. This is what keeps the log from going
  silently empty for organic content work.
- The file is ML-DSA-65 signed; `.husky/pre-push` and a dedicated CI step
  (`npm run verify-attestations`) verify the signature against committed
  `.sig` files before allowing a push/merge.
- The **writer**, which appends a compliant record and re-signs in the same
  step, is not in this repository. This repo holds the resulting log file and
  the signature check that reads it.

## 4. Compliance & timeline data staleness watchdogs

Two narrower, mechanical staleness checks, unrelated to the claim manifest:

- **The compliance-freshness check** fails if `public/data/compliance-data.json`
  was last **committed** more than 30 days ago (`git log`-based, not file
  mtime). To unblock, refresh the compliance data and commit it.
- **The enrichment-freshness check** is a best-effort heuristic: it flags a
  timeline row whose on-disk evidence file is newer than the most recent
  enrichment that mentions it.

Both run with the data checks outside this repository before merge.

## 5. Everything else: data curation outside this repository

Library, Timeline, Threats, Vendor Roadmaps, Migrate Catalog, Compliance
Landscape, Algorithms, Leaders, Industry Landscape, Trusted Sources and the
other data sources are curated outside this repository, by hand-triggered,
human-reviewed runs (there are no scheduled runs). Their output — new dated
CSV generations, evidence files and `revisions.jsonl` entries — lands here
through normal commits and PRs, so what you see in `src/data/*.csv` and
`public/data/` is current as of the last run for that source. This repository
has no gate of its own for how stale an individual Library or Timeline _row_
is beyond what §1–§4 describe.

## Practical checklist

- Touching a numeric/dated claim covered in §1? Bump its `Freshness.asOf` at
  the source file, then `npm test -- contentFreshness` to confirm green.
- Reviewing a Learn module's accuracy? Bump `lastReviewed` in its
  `content.ts` — only after actually re-checking the content, per §2.
- Editing a Learn module's content or a Playground tool's registry entry?
  It needs a `revisions.jsonl` entry in the same diff (§3) or the
  revision-coverage check will block the PR.
- Touching Library/Timeline/Threats/Migrate/etc. data directly in this repo?
  Nothing in this repo will flag
  it as stale later — you're responsible for the row's accuracy going
  forward, same as any other hand-edit.
