# Content freshness — how it's tracked and enforced

This repo has several **separate, purpose-built mechanisms** for catching
content that has silently aged, plus a much larger data-curation pipeline that
lives outside this repo. This file describes what each one actually checks,
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

**Auditor**: `scripts/audit-content-freshness.ts`.

```bash
npm run audit:content-freshness           # human report; exits non-zero if stale/malformed
npm run audit:content-freshness -- --json # machine-readable
npm run audit:content-freshness -- --warn # never fails (CI's mode today)
npm run audit:content-freshness:write     # also (re)generates reports/content-freshness.md
```

**CI**: runs in `.github/workflows/ci.yml` as a step that is currently
**non-blocking** (`continue-on-error: true`) — a stale claim shows up in the
Actions log but doesn't fail the PR.

As of this writing (`npm run audit:content-freshness`, run 2026-09) there are
**6 active claims** (5 named sources above plus 1 sim-move stamp), and all are
within the 90-day window. Don't trust that number to stay current — re-run the
command.

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

- **Relative-age (CM-C)** — `scripts/validators/trust-engine-checks.ts`. Fires
  only when a module's code changed **more than 30 days after** its
  `lastReviewed` date (i.e. someone edited the module without re-reviewing
  it). A module nobody has touched in a year trips nothing here, forever —
  that gap is what check #2 below exists for. Runs as part of
  `npm run validate:data` (and therefore `npm run gate:data` /
  `npm run gate:local`), at **WARNING** severity — it does not fail the build.
- **Absolute-age** — `scripts/moduleReviewFreshness.ts`, surfaced by the same
  `scripts/audit-content-freshness.ts` script as part #1 above. Flags any
  module whose `lastReviewed` is more than **120 days** old, full stop,
  regardless of whether the code has changed since. WARN-level by default
  (`npm run audit:content-freshness`); pass `--modules-strict` to make it
  exit non-zero. As of the last run, all 64 tracked modules were within the
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
- **`npm run audit:content-revision-coverage`** (`scripts/audit-content-revision-coverage.ts`)
  is a **CI-blocking** check: a diff that touches a Learn module's
  `content.ts`/`manifest.ts` or a Playground tool's `workshopRegistry.tsx`
  entry must carry a matching `revisions.jsonl` record for that item's id in
  the same diff, or the build fails. This is what keeps the log from going
  silently empty for organic content work.
- The file is ML-DSA-65 signed; `.husky/pre-push` and a dedicated CI step
  (`npm run verify-attestations`) verify the signature against committed
  `.sig` files before allowing a push/merge.
- The actual **writer** — `emit_revision.py --module-edit` / `--tool-edit` /
  `--promote`, which appends a compliant record and re-signs in the same
  step — lives in the private companion tooling repo (see §5), not in this
  repository. This repo only holds the resulting log file and the two checks
  above that read it.

## 4. Compliance & timeline data staleness watchdogs

Two narrower, mechanical staleness checks, unrelated to the claim manifest:

- **`npm run check:compliance-fresh`** (`scripts/ci/check-compliance-freshness.ts`)
  fails if `public/data/compliance-data.json` was last **committed** more than
  N days ago (`git log`-based, not file mtime — accurate in CI). Script
  default is 14 days; the CI invocation in `.github/workflows/ci.yml` and
  `npm run gate:data` both pass `--max-days 30`. To unblock: re-run the
  compliance scraper (in the private companion repo) and commit the refreshed
  JSON.
- **`npm run audit:enrichment-freshness`** (`scripts/audit-timeline-enrichment-freshness.ts`)
  is a best-effort heuristic: it flags a timeline row whose on-disk evidence
  file is newer than the most recent enrichment markdown that mentions it —
  i.e. someone re-downloaded evidence but nobody re-ran the enrichment pass
  against it. Runs in CI (blocking) as "Audit timeline enrichment freshness."

## 5. Everything else: the private, manual, per-source maintenance pipeline

The bulk of this project's actual content — Library, Timeline, Threats,
Vendor Roadmaps, Migrate Catalog, Compliance Landscape, Algorithms, Leaders,
Industry Landscape, Trusted Sources, and more — is discovered, checked, and
enriched by a much larger `sources.yaml`-driven system (per-source
check/discover/update scripts, an evidence cache, and a human-reviewed
`PROPOSALS-QUEUE.md`) that lives in a **private companion repository**, not in
this public repo. Key facts worth knowing even though the tooling itself
isn't here:

- **No cron, no scheduled runs, anywhere.** Every stage (`DISCOVER`, `CHECK`,
  `PROPOSE`, `REVIEW`, `APPLY`, `VERIFY`) is manually triggered — this is a
  deliberate project policy, not a gap. Staleness detection for these sources
  depends on a human running the relevant check on their own cadence.
- Its output — new dated CSV generations, evidence files, and (via
  `emit_revision.py`, see §3) `revisions.jsonl` entries — lands in **this**
  repo through normal commits/PRs, so what you see in `src/data/*.csv` and
  `public/data/` is that pipeline's committed output, current as of whenever
  someone last ran it for that source.
- Several `npm run` scripts in this repo's own `package.json` already
  reference it directly by relative path (e.g. `download:timeline-evidence`,
  `audit:trusted-source-freshness`, `enrich:compliance-gap` all shell out to
  `../pqctoday-priv/scripts/...`) — those scripts only work with that private
  repo checked out as a sibling directory, exactly like the `pqctoday-hsm`
  sibling-checkout convention documented in [TESTING.md](TESTING.md).
- This repo has **no visibility** into how stale an individual Library or
  Timeline _row_ is beyond what the checks in §1–§4 above catch (the claim
  manifest, module dates, and the two mechanical watchdogs) — there is no
  general "this CSV row hasn't been re-verified in N days" gate in this
  public repo today.

## Practical checklist

- Touching a numeric/dated claim covered in §1? Bump its `Freshness.asOf` at
  the source file, then `npm run audit:content-freshness -- --write` to
  regenerate `reports/content-freshness.md`, then `npm test -- contentFreshness`
  to confirm green.
- Reviewing a Learn module's accuracy? Bump `lastReviewed` in its
  `content.ts` — only after actually re-checking the content, per §2.
- Editing a Learn module's content or a Playground tool's registry entry?
  It needs a `revisions.jsonl` entry in the same diff (§3) or
  `audit:content-revision-coverage` will block the PR. That entry is written
  by tooling in the private companion repo.
- Touching Library/Timeline/Threats/Migrate/etc. data directly in this repo
  without going through the private pipeline? Nothing in this repo will flag
  it as stale later — you're responsible for the row's accuracy going
  forward, same as any other hand-edit.
