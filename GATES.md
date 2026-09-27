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
- ~~automatic~~ `sync:wasm:check` is **manual only since 2026-09-27** (owner decision — it failed every hub push whenever pqctoday-hsm moved; run it by hand during a wasm rebuild) — the vendored wasm bundles are built from the pqctoday-hsm commit they claim (needs the sibling checkout — only meaningful here). Since 2026-09-26 a Rust bundle's inputs come from its Cargo build graph (`cargoManifest` in `public/wasm/wasm-provenance.json`, derived by `scripts/ci/wasm-build-inputs.ts`) rather than a hand-written `sourceDirs` list. That hand-written list had missed a linked crate: cacp-kmip never saw a Rust engine change. It had also flagged changes that cannot alter the binary (reports, committed wasm output, the bench crate). `scripts/ci/wasm-build-inputs.local.test.ts` replays both kinds of error against real hsm commits. On CI's blobless clone the derivation reads each Rust source once, lazily: measured at ~96 s for cacp-kmip.
- `import:native-conformance:check` — `src/data/validation/native-conformance.generated.json` (the hsm engines' own PKCS#11 conformance reports, shown in the Playground conformance workbench) still equals a fresh import at the pinned hsm commit, and hsm main has committed no newer report than that pin. Reads the sibling `../pqctoday-hsm` by commit (`git show`); skips cleanly when the checkout or the pinned commit is absent, which is why it is not in GitHub CI (CI clones only the hub). Refresh: move `PINNED_HSM_COMMIT` in `scripts/import-native-conformance.ts`, then `npm run import:native-conformance`. It imports reports; regenerating them means re-running the suites in pqctoday-hsm.
- `gen:landing-counts:check` — landing hero counts match the CSVs.
- `audit:csv-copy-forward` — no silent row loss between two generations of a dated CSV.
- `audit:test-reachability` — every test-shaped file in the repo is actually run by some enforced gate (~2.5 min: it asks `vitest list` and `playwright --list` which files each gate resolves, rather than re-implementing their glob/filter semantics). Added 2026-09-26 after three misses in one day from files that existed, ran and FAILED while no gate ran them; its first run named 87 such files. Deliberately here rather than only as a manual command — a check for ungated checks that is itself ungated is the joke it exists to prevent. Anything intentionally left out goes in the script's own `ALLOWLIST` with a reason, and a rotted allowlist entry fails too.
- `test` — the full vitest suite (also in GitHub, sharded; the local run is the fast path on an M-series machine).
- `test:local` — the `*.local.test.{ts,tsx}` tier, UNSCOPED (80 files, 1,017 tests). Added 2026-09-26: 69 of those files were run by no gate at all (the only enforced invocation of `vitest.local.config.ts` was `test:local:cacp`'s two kmip paths). See the sabotage table below — many of the sabotage proofs live in this tier, so before this they were proofs nothing checked. **Cost: ~19 min measured** (1,159 s, M-series, 2026-09-26), dominated by a few real-WASM/vector suites rather than by breadth — much slower than `test`, and the main thing to weigh if pre-push starts feeling too heavy. Moving it to a receipt-only or nightly venue is a real option; running it nowhere is what created the hole. **Update, same day:** it later grew to 28.6 min, 26.3 of which was one file, the SLH-DSA NIST-vector suite; that file moved to the nightly venue below (`*.nightly.test.ts`), and everything else stays here.

then the receipt is written. (`gate:cacp` was removed from the hook and from GitHub on 2026-09-27 by owner decision; run `npm run gate:cacp` by hand when changing the KMIP/CACP playground or rebuilding its wasm.)

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
  - `audit:validation-manifest` — every `src/data/acvp` vector file is registered in `src/data/validation/vector-manifest.json` with a matching SHA-256, a known evidence class, NIST upstream commit/path/date/hash, registered cases and lineage, and every in-hub copy of a vector (templates, snapshots, `kat/`) is declared and still equal. Local only: `--cross-repo ../pqctoday-hsm` reports sibling-repo copies.
  - `gen:validation-counts:check` — `validation-counts.generated.json` (the numbers the deck and UI quote) matches the manifest.
  <!-- claims-lint-allow: this entry quotes the phrases the gate bans -->
  - `audit:validation-claims` — no banned validation claims ("ACVP validated", "complete ACVP", "all mechanisms covered", "NIST validated", suite-level "NIST ACVP Known Answer Tests", "Run NIST KAT", self-applied FIPS/CMVP certification) in UI copy, Learn content or the root validation docs; negated uses pass, legitimate ones go in `scripts/audit-validation-claims.allowlist.json`. Pass a path to also lint the conference deck and check its NIST ACVP-Server count (`npm run audit:validation-claims -- ../presentations/fipsandchips2026`; not in CI — the deck is not in this repo).
  - `gen:coverage-matrix:check` — the WS-C coverage-diff gate. Rebuilds the capability × evidence matrix from `mechanism-inventory.generated.json`, `capability-map.json`, `testRegistry.ts`, the vector manifest and any committed wasm run results, and fails when: an advertised capability cell (engine × mechanism × operation × parameter set × sign variant) has no registered test and no waiver in `coverage-waivers.json` (reason + owner + date; `baseline-pending-review` entries are NOT approvals); an advertised mechanism is missing from the capability map; a registry case is quarantined, absent from the manifest, or disagrees with it on evidence class or polarity; a status falls outside the plan C-2 vocabulary; an open gap lacks an owner or status; or `coverage-matrix.generated.json` / `public/data/validation/coverage-matrix.{json,md,html}` are stale. Run results count only for the artifact sha256 the inventory records. Regenerate with `npm run gen:coverage-matrix`; refresh the recorded wasm results with `WRITE_RUN_RESULTS=1 npx vitest run --config vitest.local.config.ts src/components/Playground/hsm/acvp/useAcvpSuite.runResults.local.test.ts` (local only).
  - `gen:release-evidence:check` — the WS-J release evidence report (`public/data/validation/release-evidence.{json,md}`) equals a fresh generation from the generated sources only (vector counts, coverage matrix, waivers, open gaps, native suites, recorded runs, frozen cross-target runs, workbench CATEGORIES); fails first, naming the generator to run, when one of those inputs is itself stale (it never regenerates them); fails when the published coverage matrix differs from the generated one, when a two-person review record in `src/data/validation/reviews/` is invalid (plan J-5: two distinct named reviewers, source verification + claim review, bound to the subject hash), or when a figure in README/TESTING/GATES/CONTRIBUTING differs from its generated value. The report carries the machine-evaluated §10.1 conference checklist (PASS / FAIL / HUMAN-REQUIRED — human items are never PASS). With the conference deck: `npm run gen:release-evidence:check -- ../presentations/fipsandchips2026` also runs the claims lint and every bound deck figure (not in CI — the deck is not in this repo). Regenerate with `npm run gen:release-evidence`; `-- --print-review-items` prints the subject hashes a review record must quote.
  - `validate:data:without-priv` — the unified validator minus the checks that need gitignored evidence caches (N18/N22/MP-2/TP-1). Carries TP-2/TP-3.
- `verify-attestations` — signatures on shipped trust artifacts.
- `build` — clean-checkout `tsc -b` + vite + Playwright prerender + precache/TLA budgets; on main its `dist/` is uploaded for deploy.
- `test:e2e:ci-smoke` — the 6-spec Playwright smoke tier against the build.
- ~~PR only~~ — **GitHub CI no longer runs on pull requests (owner decision D20, 2026-09-27)**: it runs on push to `main` (concurrency group `ci-main`, superseded runs cancelled) and on `workflow_dispatch`. PRs are validated only by the full local gates (`.husky/pre-push`) and merged with `gh pr merge --admin` on local green (D21). `check-tool-version-bump` / `check-module-version-bump` moved into `gate:local` (`npm run check:version-bumps`). `validate-offline-attestation` is not run anywhere now: it needs a PR number, and no `approvals/offline-*` file has ever been committed. Re-home it if SME attestations start being used.
- `audit:deps` — high/critical advisories, with dated exceptions (`scripts/ci/audit-gate.ts`). Last on purpose: if it is the only red step, it is the known `pptxgenjs → image-size` pair.

`test` (matrix ×2) ≈ 8 min each: `vitest run --shard=N/2` — the unit suite.

`gate-cacp` — **removed 2026-09-27** (owner decision). It gated every hub PR on pqctoday-hsm's state. `npm run gate:cacp` stays available to run by hand.

## GitHub — deploy (`.github/workflows/deploy.yml`)

Runs only after CI **succeeds** on main (`workflow_run`), and publishes the
`dist` artifact that run built — a red main no longer deploys. A manual
`workflow_dispatch` rebuilds from source. `retain-live-boot-assets` keeps the
previous release's boot chunks so a cached `index.html` still starts.

## GitHub — nightly (`.github/workflows/e2e-nightly.yml`, 07:00 UTC)

The full Playwright suite, 2 shards. Not a required check. The `notify` job
opens/updates one issue, **"Nightly E2E is red"**, with the run URL and the
failing test names, and closes it on the next green run.

## GitHub — nightly vector suites (`.github/workflows/validation-nightly.yml`, 05:00 UTC)

`npm run test:nightly` — the `*.nightly.test.{ts,tsx}` tier, unscoped, via
`vitest.nightly.config.ts`. Both `vite.config.ts` and `vitest.local.config.ts`
exclude that tier, so it runs here and nowhere else. It is for suites that must
run but are too slow for pre-push. Today it has one file:
`useAcvpSuite.slhdsaAcvp.nightly.test.ts`, which took 26.3 of `test:local`'s
28.6 min on an M-series Mac, because it runs the whole slh_stateful category on
both engines three times (baseline plus two sabotage proofs). Moved here by
maintainer decision, 2026-09-26.

Not a required check, so a regression here can sit on `main` for up to a day.
The `notify` job opens or updates ONE issue, **"Nightly validation vectors are
red"**, with the failing test names, and closes it on the next green run. The
per-step time budget comes from `SLHDSA_BUDGET_MS` (60 min on the runner; the
file's own default is tuned to a Mac). Runner timing has not been measured yet.
Before a release, run it on demand (`workflow_dispatch`) or locally with
`npm run test:nightly`. `audit:test-reachability` lists this gate and fails if
the workflow stops invoking it.

## Before a release — `npm run gate:release`

`gate:local` + `gate:e2e` (`build` + the full Playwright suite against the
production build — the round-9 lesson: 15 browser regressions shipped through
13 green releases while only the smoke tier ran per PR) +
`test:e2e:local-tier` (`E2E_SERVER=dev playwright test --project=local` — the 18
`*.local.spec.ts` specs, which both CI projects exclude and which no gate ran
before 2026-09-26) (`gate:cacp` and `sync:wasm:check` are manual-only since 2026-09-27, H2), then the receipt `.gate-ok-<sha>` so the
pre-push hook does not repeat it.

`E2E_SERVER=dev`, matching every other local-tier script here
(`test:e2e:cacp-visual`, `test:e2e:cacp-local`): several of these specs
`page.evaluate`-import source modules, which resolves under the dev server and
not against a `vite preview` bundle. So this step does not itself need the build
— it sits on `gate:release` rather than pre-push for time, not for the build:
`--project=local` is 18 specs of WASM/crypto/WebGL work, which is minutes, and
pre-push already carries the full unit suite plus `test:local`.

## Conference/release freeze — `npm run release:freeze` (plan J-4)

Dry run by default (prints the manifest, writes nothing). `npm run release:freeze -- --write --label <label> --presentation <deck dir>` writes `evidence/release-freeze/<label>.freeze.json`: hub commit + describe + version, every vendored WASM bundle's hsm commit and file SHA-256s, the engine artifacts the coverage matrix was built from, the release evidence report and its inputs, the frozen cross-target runs, and the deck files + deck-check result. Refused on a dirty tree, a failing `gen:release-evidence:check` or deck check, an artifact that no longer matches its inventory hash, or an existing file. `npm run release:freeze -- --check evidence/release-freeze/<label>.freeze.json` fails when any frozen artifact, report figure, report input or evidence run changed, and lists the commits made since the freeze (J-4: blocker fixes only). Recording a review after the freeze does not break it: the freeze binds the report's figure sections, not its review status.

## Sabotage proofs for the validation gates (plan J-3)

A gate is trusted only once a deliberately broken input is shown to fail it. Every proof below runs on a temp copy or a synthetic fixture, never on the real files. `*.local.test.ts` files run in the local venue (`npm run test:local`), the rest in the unit suite.

| Sabotage                          | Gate                                             | Proof (file › test)                                                                                                                                                                                                                                               |
| --------------------------------- | ------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Wrong expected byte               | `audit:validation-manifest`                      | `scripts/audit-validation-manifest.test.ts` › fails when one byte of a vector file changes                                                                                                                                                                        |
| Wrong expected byte               | workbench runner (dual engine)                   | `src/components/Playground/hsm/acvp/useAcvpSuite.mldsaAcvp.local.test.ts` › flipped disposition / expected bytes are detected on both engines                                                                                                                     |
| Wrong expected byte               | ACVP-format prototype (F-4 golden check)         | `src/services/acvp/pipeline.test.ts` › golden comparison can FAIL; `src/services/acvp/acvp.engines.local.test.ts` › a flipped byte in a valid ML-DSA signature …, a flipped ciphertext byte changes k …                                                           |
| Wrong expected byte               | cross-target comparator                          | `src/services/acvp-xplat/compare.test.ts` › SABOTAGE: one flipped shared-secret byte …, a flipped sigVer verdict …                                                                                                                                                |
| Wrong evidence label              | `audit:validation-manifest`                      | `scripts/audit-validation-manifest.test.ts` › fails when a file is relabelled to a class its source evidence does not support; fails on an unknown evidence class                                                                                                 |
| Wrong evidence label              | `gen:coverage-matrix:check`                      | `src/data/validation/coverageModel.test.ts` › refuses quarantined, unknown or misclassified manifest cases                                                                                                                                                        |
| Wrong evidence label              | `gen:validation-counts:check`                    | `scripts/generate-validation-counts.test.ts` › moving a file to another class changes the generated output                                                                                                                                                        |
| Wrong evidence label (copy)       | `audit:validation-claims`                        | `scripts/audit-validation-claims.test.ts` › a temp tree with one prohibited phrase fails                                                                                                                                                                          |
| Wrong evidence label (UI rows)    | static guards in `src/utils/katEvidence.test.ts` | `src/utils/katEvidence.test.ts` › sabotage: the spec guard fails a non-ACVP spec labelled NIST/ACVP; sabotage: the workbench guard fails an ACVP claim on a non-NIST row (synthetic specs / synthetic source text, WS-I)                                          |
| Wrong evidence label (records)    | `gen:case-evidence:check`                        | `src/utils/katEvidence.test.ts` › every katRunner / workbench record carries its manifest case class; `src/data/validation/caseEvidence.test.ts` › a workbench row reads the manifest class, not its producer string                                              |
| Unchecked KAT (false pass)        | real engines, both (`test:local`) + unit         | `src/wasm/katRunner.suci.test.ts` › sabotage: one flipped ICB bit fails the KDF and encrypt steps; `src/utils/katRunner.engines.local.test.ts` fails on any non-pass on either engine (reverting aescbc-decrypt to CBC_PAD failed it on both, checked 2026-09-24) |
| Missing provenance (contribution) | `audit:validation-manifest` (WS-I check 9)       | `scripts/audit-validation-manifest.test.ts` › contributor flow: a new file without a two-person review fails; without a reviewed license, source identity or expectations fails; one reviewer twice or a stale record fails                                       |
| Skip counted as pass              | `gen:coverage-matrix:check`                      | `src/data/validation/coverageModel.test.ts` › a skip never counts as a pass, on either side (counted as skippedCells); `src/utils/katRunner.test.ts` › summarizeKatResults keeps skip as its own bucket                                                           |
| Missing provenance                | `audit:validation-manifest`                      | `scripts/audit-validation-manifest.test.ts` › fails when a NIST record loses its upstream SHA-256; fails on a vector file that is not registered; fails when an unverified case is left active                                                                    |
| Missing provenance                | evidence badges                                  | `src/data/validation/evidenceClasses.test.ts` › never badges an unverified or quarantined entry                                                                                                                                                                   |
| Missing provenance                | ACVP-format prototype                            | `src/services/acvp/fixtures.test.ts` › recognises a pinned prompt by hash and nothing else; `src/services/acvp/pipeline.test.ts` (an unpinned prompt is `unverified-imported-vector-set`)                                                                         |
| Unsupported parameter coercion    | ACVP-format prototype (F-3)                      | `src/services/acvp/coercion.sabotage.test.ts` (one mutated option refused at its path; SHA2-512/256 → unsupported, never sent, never answered); `src/services/acvp/parser.test.ts` › a revision that is not pinned is refused, never coerced                      |
| Unsupported parameter coercion    | `gen:coverage-matrix:check`                      | `src/data/validation/coverageModel.test.ts` › fails when a new declared parameter set lands inside an advertised range; keeps a declared parameter set only inside the engine-reported key-size range                                                             |
| Changed artifact hash             | `gen:coverage-matrix:check`                      | `src/data/validation/coverageModel.test.ts` › ignores results recorded against a different artifact than the inventory records                                                                                                                                    |
| Changed artifact hash             | cross-target comparator                          | `src/services/acvp-xplat/compare.test.ts` › SABOTAGE: editing response.json without re-sealing evidence …; a tampered execution-environment.json …                                                                                                                |
| Changed artifact hash             | `import:native-conformance:check`                | `scripts/import-native-conformance.test.ts` › fails when an engine commit is changed; when a suite count is hand-edited                                                                                                                                           |
| Changed artifact hash             | `release:freeze --check`                         | `scripts/release-freeze.test.ts` › SABOTAGE: one changed artifact byte …; a moved hsm commit …; a changed report figure or evidence run …                                                                                                                         |
| Hand-edited public figure         | `gen:release-evidence:check`                     | `scripts/generate-release-evidence.test.ts` › SABOTAGE: a hand-edited number …; a changed generated source …; an input changed without regenerating …; a published matrix that differs …; a stale class count, total or native-check figure is drift              |
| Deck figure drift                 | `audit:validation-claims` (extra path)           | `scripts/audit-validation-claims.test.ts` › flags a stale count and accepts the live one; accepts the live figures in the deck/script/README shapes, flags stale ones                                                                                             |
| One-person review                 | `gen:release-evidence:check` (J-5)               | `src/data/validation/reviewRecords.test.ts` › SABOTAGE: the same person in both roles …; a placeholder or role …; `scripts/generate-release-evidence.test.ts` › a review record naming one person twice fails                                                     |

## Not gated anywhere

`audit:sbom-versions` (being replaced by generating the About-page SBOM from
`package.json`), the `kat-node24` job and the PR classifier / CSV-diff comment
/ WASM label (deleted 2026-09-21 — nothing consumed them).
