# Gates — what runs where, and why

Repo-root file on purpose: `docs/` is gitignored (private internal docs).

Rules (2026-09-21 plan): a GitHub job carries only what guards the quality or
security of `main` **and** needs a clean machine to prove it; the local gate
is the advanced tier; a check runs in exactly one place. One line per check —
what it guards.

## pre-commit (`.husky/pre-commit`, every commit)

- `tsc --noEmit` — the tree still type-checks.
- `lint-staged` — eslint `--fix` + prettier on staged files; CRLF stripped from CSVs.

## pre-push (`.husky/pre-push`, every push) — `gate:local` + receipt

Always, receipt or not (a second each):

- `audit:ci-workflow-files` — every file a workflow runs is tracked (`scripts/*` is gitignored; `git add` there is a silent no-op).
- `verify-attestations` — ML-DSA-65 signatures on the trust artifacts still verify (also in GitHub: the one deliberate overlap, it is a security gate there).

Then, unless `.gate-ok-<short HEAD sha>` exists and is newer than the commit
(written only by a fully green `gate:release` or this hook — so a gate already
run on this exact commit is not paid twice):

`npm run gate:local`:

- `format:check` — prettier over the whole tree (lint-staged only sees staged files).
- `lint` — eslint incl. `eslint-plugin-security`.
- `gate:data:audits` — the data-truth audits (see the GitHub section; same script, run here so the FULL validator below is not run twice).
- `validate:data:local` — the unified validator (N*/CM-_/TP-*/MP-*/DS_/GC-*/LN-\*), excluding only TP-1/MP-2 (on-disk proof files that exist only after a manual download run). Includes the N18/N22 checks that read `pqctoday-priv` evidence caches — they cannot run on a clean runner.
- `gate:editorial` — policy checks that never break the product for a visitor:
  - `audit:content-revision-coverage` — a Learn/Playground content edit carries its `revisions.jsonl` entry.
  - `audit:role-board-drift` — `roleBoardContent.generated.ts` matches `role_board_content_*.csv`.
  - `audit:role-board-ctas` — every board CTA is registered, resolves, and its claim is in date.
  - `audit:role-board-coverage` — every role's home reaches every section.
  - `audit:persona-lens` — every surface declares how it treats roles.
  - `audit:changelog-personas` — the current release's changelog entries carry `[persona:id]` tags.
  - `audit:content-freshness` — dated claims (CMVP status, matrix snapshot, Q-Day anchor) under 90 days.
  - `audit:module-infographics` — every Learn module has its poster PNG.
  - `audit:tokens` — no hard-coded colours.
  - `validate:workshop` — every workshop cue resolves to a real route/slug/fixture.
- `sync:wasm:check` — the vendored wasm bundles are built from the pqctoday-hsm commit they claim (needs the sibling checkout — only meaningful here).
- `gen:landing-counts:check` — landing hero counts match the CSVs.
- `audit:csv-copy-forward` — no silent row loss between two generations of a dated CSV.
- `test` — the full vitest suite (also in GitHub, sharded; the local run is the fast path on an M-series machine).

then `npm run gate:cacp` (see GitHub `gate-cacp`; here it runs against the real sibling `../pqctoday-hsm`, where the full drift guards work), then the receipt is written.

## GitHub — `.github/workflows/ci.yml` (push to main, every PR)

`checks` (the required status check) ≈ 13–15 min:

- `lint` — security lint on a clean checkout.
- `gate:data` — ONE step, `gate:data:audits` + `validate:data:without-priv`:
  - `audit:matrix-refs` — protocol-matrix refs resolve.
  - `sync:sandbox:check` — generated sandbox scenarios match the sandbox source.
  - `audit:vendor-refs` — product → VND-\* vendor ids are right.
  - `audit:timeline-aliases`, `audit:migration-phases`, `audit:compliance-countries` — token vocabularies stay valid.
  - `audit:timeline-evidence` — every active timeline row has manifest-backed evidence.
  - `check:compliance-fresh` — `compliance-data.json` committed within 30 days.
  - `audit:data-regressions` — no silent record/field loss vs the base branch.
  - `audit:csv-archival` — at most 2 live generations per dated CSV (the loaders eager-glob them into the bundle).
  - `audit:merge-all-coverage` — archived files stay reachable by merge-all loaders.
  - `audit:publication-dates` — source dates are the document's, not our ingest day.
  - `audit:leaders-refs` — leaders' proof refs resolve (the source where fabricated profiles were found).
  - `audit:migrate-proof` — no product claim without evidence.
  - `audit:enrichment-freshness` — enrichment `verify:` steps ran within their window.
  - `gen:timeline-facts:check` — `timelineFacts.generated.ts` matches the CSV.
  - `validate:data:without-priv` — the unified validator minus the checks that need gitignored evidence caches (N18/N22/MP-2/TP-1). Carries TP-2/TP-3.
- `verify-attestations` — signatures on shipped trust artifacts.
- `build` — clean-checkout `tsc -b` + vite + Playwright prerender + precache/TLA budgets; on main its `dist/` is uploaded for deploy.
- `test:e2e:ci-smoke` — the 6-spec Playwright smoke tier against the build.
- PR only: `check-tool-version-bump`, `check-module-version-bump` — content edits bump their version; `validate-offline-attestation` — committed SME attestations are well-formed and authorised.
- `audit:deps` — high/critical advisories, with dated exceptions (`scripts/ci/audit-gate.ts`). Last on purpose: if it is the only red step, it is the known `pptxgenjs → image-size` pair.

`test` (matrix ×2) ≈ 8 min each: `vitest run --shard=N/2` — the unit suite.

`gate-cacp` ≈ 2 min: `gate:cacp` — KMIP/CACP tests, the `*.local.test.ts` drift guards and the cacp-kmip wasm-provenance check against a sparse clone of pqctoday-hsm. Make it a required check alongside `checks`.

## GitHub — deploy (`.github/workflows/deploy.yml`)

Runs only after CI **succeeds** on main (`workflow_run`), and publishes the
`dist` artifact that run built — a red main no longer deploys. A manual
`workflow_dispatch` rebuilds from source. `retain-live-boot-assets` keeps the
previous release's boot chunks so a cached `index.html` still starts.

## GitHub — nightly (`.github/workflows/e2e-nightly.yml`, 07:00 UTC)

The full Playwright suite, 2 shards. Not a required check. The `notify` job
opens/updates one issue, **"Nightly E2E is red"**, with the run URL and the
failing test names, and closes it on the next green run.

## Before a release — `npm run gate:release`

`gate:local` + `gate:e2e` (`build` + the full Playwright suite against the
production build — the round-9 lesson: 15 browser regressions shipped through
13 green releases while only the smoke tier ran per PR) + `gate:cacp`, then
the receipt `.gate-ok-<sha>` so the pre-push hook does not repeat it.

## Not gated anywhere

`audit:sbom-versions` (being replaced by generating the About-page SBOM from
`package.json`), the `kat-node24` job and the PR classifier / CSV-diff comment
/ WASM label (deleted 2026-09-21 — nothing consumed them).
