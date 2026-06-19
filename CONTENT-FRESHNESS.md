# Content freshness — owner & cadence

The simulation surfaces a handful of **time-sensitive claims** — CMVP/FIPS-140-3
validation status, the PQC protocol-support matrix snapshot, and the deliberately
aggressive 2029 Q-Day planning anchor. These are correct _as of_ a date; left
unowned, they silently age. This file assigns the recurring review so they can't.

## Owner

- **Owner:** _PQC Hub content maintainer_ — **set the GitHub handle here.** (Until
  assigned, the repo maintainer holds it.)
- **Backup:** _set a second handle so the review survives PTO._

## Cadence

- **Quarterly**, on the **1st of Jan / Apr / Jul / Oct**.
- **Next review due: 2026-07-01.**

## What's tracked

Every dated claim lives as a structured `Freshness` (`{ asOf, recheck }`) at its
source — never as a free-text date in prose — and is aggregated into the manifest:

| Source                          | Claim                                                                |
| ------------------------------- | -------------------------------------------------------------------- |
| `src/data/quantumTimeline.ts`   | Q-Day planning anchor (2029) vs the public 2030–2040 CRQC range      |
| `src/data/pqcProtocolMatrix.ts` | Protocol-support matrix snapshot (RFC/draft stages, vendor GA dates) |
| `src/data/simMoves.ts`          | CMVP/FIPS-140-3 trap ("re-check the live CMVP list")                 |

The generated checklist is **[`reports/content-freshness.md`](reports/content-freshness.md)**
(regenerate, never hand-edit).

## How the check works

- Manifest + pure staleness logic: `src/data/contentFreshness.ts` (review window
  **90 days**). Unit-tested in `contentFreshness.test.ts`.
- Auditor: `scripts/audit-content-freshness.ts`.
  - `npm run audit:content-freshness` — report; **exits non-zero** if any claim is
    stale or malformed.
  - `npm run audit:content-freshness:write` — also regenerate the report.
  - `... -- --json` — machine-readable; `... -- --warn` — never fails (CI warn mode).
- CI: runs in `.github/workflows/ci.yml` as a **non-blocking** step
  (`continue-on-error: true`) during first rollout. **Flip it to blocking** (remove
  that line) once the first quarterly pass below has cleared any backlog.

## Quarterly review procedure

1. `npm run audit:content-freshness` — note anything flagged `STALE`.
2. For each claim, open its `recheck` URL and re-verify the fact is still current
   (update the surrounding prose if the world changed).
3. Bump the claim's `asOf` (and the wording) at its **source** file.
4. `npm run audit:content-freshness:write` to regenerate the report, then
   `npm test -- contentFreshness` to confirm green.
5. Commit. If the backlog is clear, consider removing `continue-on-error` in CI to
   make the check blocking.
