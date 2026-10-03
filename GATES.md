# Gates — what runs where, and why

Repo-root file on purpose: `docs/` is gitignored (private internal docs).

Rules (2026-09-21 plan): a GitHub job carries only what guards the quality or
security of `main` **and** needs a clean machine to prove it; the local gate
is the advanced tier; a check runs in exactly one place. One line per check —
what it guards.

## pre-commit (`.husky/pre-commit`, every commit)

- `tsc --noEmit` — the tree still type-checks.
- `lint-staged` — eslint `--fix` + prettier on staged files; CRLF stripped from CSVs.

## pre-push (`.husky/pre-push`, every push) — `gate:prepush` (fast tier)

**Changed 2026-09-29 (owner decision):** the hook runs `npm run gate:prepush`
(~3–5 min), which is `gate:local` below **minus** `test` and `test:local`. The
unit suite (`test`) now runs on GitHub for every PR (`pr-test` in
`pr-check.yml`); the ~19 min `test:local` tier runs once per release
(`npm run gate:release-local`, see "Merging a PR"). `npm run gate:local` is
unchanged and still runs everything by hand. The list below describes
`gate:local`.

Always, receipt or not (a second each):

- `audit:ci-workflow-files` — every file a workflow runs is tracked (`scripts/*` is gitignored; `git add` there is a silent no-op).
- `verify-attestations` — ML-DSA-65 signatures on the trust artifacts still verify (also in GitHub: the one deliberate overlap, it is a security gate there).

Then, unless `.gate-ok-<short HEAD sha>` exists and is newer than the commit
(written only by a fully green `gate:release` or this hook — so a gate already
run on this exact commit is not paid twice):

`npm run gate:local`:

- `format:check` — prettier over the whole tree (lint-staged only sees staged files).
- `lint` — eslint incl. `eslint-plugin-security`.
- `check:version-bumps` — a changed tool or Learn module carries its version bump.
- `audit:matrix-refs` — protocol-matrix doc-ID references are backed by structured refs, `stage` and `value` agree, and ref ids are well formed.
- `audit:role-board-drift` — `roleBoardContent.generated.ts` matches `role_board_content_*.csv`.
- `gen:timeline-facts:check` — `timelineFacts.generated.ts` matches the CSV.
- ~~automatic~~ `sync:wasm:check` is **manual only since 2026-09-27** (owner decision — it failed every hub push whenever pqctoday-hsm moved; run it by hand during a wasm rebuild) — the vendored wasm bundles are built from the pqctoday-hsm commit they claim (needs the sibling checkout — only meaningful here). Since 2026-09-26 a Rust bundle's inputs come from its Cargo build graph (`cargoManifest` in `public/wasm/wasm-provenance.json`, derived by `scripts/ci/wasm-build-inputs.ts`) rather than a hand-written `sourceDirs` list. That hand-written list had missed a linked crate: cacp-kmip never saw a Rust engine change. It had also flagged changes that cannot alter the binary (reports, committed wasm output, the bench crate). `scripts/ci/wasm-build-inputs.local.test.ts` replays both kinds of error against real hsm commits. On CI's blobless clone the derivation reads each Rust source once, lazily: measured at ~96 s for cacp-kmip.
- `gen:landing-counts:check` — landing hero counts match the CSVs.
- `gen:sbom-versions:check` — the committed SBOM version list matches `package.json`.
- `audit:test-reachability` — every test-shaped file in the repo is actually run by some enforced gate (~2.5 min: it asks `vitest list` and `playwright --list` which files each gate resolves, rather than re-implementing their glob/filter semantics). Added 2026-09-26 after three misses in one day from files that existed, ran and FAILED while no gate ran them; its first run named 87 such files. Deliberately here rather than only as a manual command — a check for ungated checks that is itself ungated is the joke it exists to prevent. Anything intentionally left out goes in the script's own `ALLOWLIST` with a reason, and a rotted allowlist entry fails too.
- `test` — the full vitest suite (also in GitHub, sharded; the local run is the fast path on an M-series machine).
- `test:local` — the `*.local.test.{ts,tsx}` tier, UNSCOPED (80 files, 1,017 tests). Added 2026-09-26: 69 of those files were run by no gate at all (the only enforced invocation of `vitest.local.config.ts` was `test:local:cacp`'s two kmip paths). See the sabotage table below — many of the sabotage proofs live in this tier, so before this they were proofs nothing checked. **Cost: ~19 min measured** (1,159 s, M-series, 2026-09-26), dominated by a few real-WASM/vector suites rather than by breadth — much slower than `test`, and the main thing to weigh if pre-push starts feeling too heavy. Moving it to a receipt-only or nightly venue is a real option; running it nowhere is what created the hole. **Update, same day:** it later grew to 28.6 min, 26.3 of which was one file, the SLH-DSA NIST-vector suite; that file moved to the nightly venue below (`*.nightly.test.ts`), and everything else stays here.

then the receipt is written. Data checks (data integrity, archival, evidence,
editorial and validation-evidence checks) are not part of this gate: they run
outside this repository on each PR head before merge. (`gate:cacp` was removed from the hook and from GitHub on 2026-09-27 by owner decision; run `npm run gate:cacp` by hand when changing the KMIP/CACP playground or rebuilding its wasm.)

## GitHub — `.github/workflows/ci.yml` (push to main, every PR)

`checks` (the required status check) ≈ 13–15 min:

- `lint` — security lint on a clean checkout.
- Data checks are not run here: they run outside this repository on each PR head before merge.
- `verify-attestations` — signatures on shipped trust artifacts.
- `build` — clean-checkout `tsc -b` + vite + Playwright prerender + precache/TLA budgets; on main its `dist/` is uploaded for deploy.
- `test:e2e:ci-smoke` — the 6-spec Playwright smoke tier against the build.
- ~~PR only~~ — **GitHub CI no longer runs on pull requests (owner decision D20, 2026-09-27)**: it runs on push to `main` (concurrency group `ci-main`, superseded runs cancelled) and on `workflow_dispatch`. PRs are validated by the full local gates (`.husky/pre-push`) plus the small `pr-check` workflow below. ~~Merged with `gh pr merge --admin` on local green (D21)~~ — **superseded 2026-09-29**: D21 left `main` requiring `checks`/`test (1)`/`test (2)`, which never run on a PR, so every PR was BLOCKED and every merge needed an admin override that the Claude Code auto-mode classifier refuses. Merges are now plain (see "Merging a PR"). `check-tool-version-bump` / `check-module-version-bump` moved into `gate:local` (`npm run check:version-bumps`). `validate-offline-attestation` was removed (it needed a PR number, and no `approvals/offline-*` file was ever committed).
- `audit:deps` — high/critical advisories, with dated exceptions (`scripts/ci/audit-gate.ts`). Last on purpose: if it is the only red step, it is the known `pptxgenjs → image-size` pair.

`test` (matrix ×2) ≈ 8 min each: `vitest run --shard=N/2` — the unit suite.

`gate-cacp` — **removed 2026-09-27** (owner decision). It gated every hub PR on pqctoday-hsm's state. `npm run gate:cacp` stays available to run by hand.

## GitHub — PR check (`.github/workflows/pr-check.yml`, every PR to main)

The only checks `main`'s branch protection requires: `pr-check`, `pr-test (1)`,
`pr-test (2)`, with "branch must be up to date". `pr-check`: install, the committed SBOM version list check
(`gen:sbom-versions:check`, skipped for dependabot PRs), `lint`
(security rules), `verify-attestations`, and a clean `build`
(which includes `tsc -b`), ~8–10 min. `pr-test`: the unit suite in 2 shards,
~8 min, in parallel. It exists so a PR can satisfy protection
without an override, and so the proof that a PR builds does not rest on a
developer machine. Data checks run outside this repository on the same head
before merge. No `paths-ignore`: a required check that some PRs skip
blocks those PRs forever.

**Invariant:** branch protection on `main` must only ever require checks that
run on `pull_request`. Requiring a push-only job (like `checks` or `test`)
makes every PR unmergeable without `--admin`. This happened from 2026-09-27
to 2026-09-29.

## Merging a PR and verifying the release

1. The fast tier passed on push (`gate:prepush`, via the hook). For a
   **release** (anything that deploys app changes), `npm run gate:release-local`
   (`test:local`, ~19 min) also passed on the exact head, run once, just before
   asking for the merge yes.
2. `pr-check`, `pr-test (1)` and `pr-test (2)` are green and the branch is up
   to date with `main` (`gh pr update-branch <n>` or merge `origin/main`; the
   checks re-run on the new head).
3. The owner's yes for this PR and head (given directly, or relayed verbatim
   by the coordinator session per the workspace `CLAUDE.md` relay rule). Post
   the approval line as a PR comment.
4. Plain merge, pinned to the gated head:
   `gh pr merge <n> --repo pqctoday-org/pqctoday-hub --merge --match-head-commit <full sha>`.
   **Never `--admin`.**
5. Not done until production is verified: wait for CI and Deploy on the merge
   commit, then run the live smoke check for the release (the release's own
   spot-check; `npm run check:sbom-production` for SBOM changes). On any
   failure, open a `git revert -m 1 <merge sha>` PR at once and put it
   through the same steps.
6. While the nightly E2E is red, only fix and revert PRs merge unless the
   owner overrides for a named PR (owner decision 2026-09-29).
7. Cleanup: remove the worktree only if clean, delete the local branch with
   `git branch -d` (merged-only), and delete the remote branch with
   `gh api -X DELETE repos/pqctoday-org/pqctoday-hub/git/refs/heads/<branch>`.
   Never `git push --delete`: it runs this hook's full ~30 min gate.

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

Dry run by default (prints the manifest, writes nothing). `npm run release:freeze -- --write --label <label> --presentation <deck dir>` writes `evidence/release-freeze/<label>.freeze.json`: hub commit + describe + version, every vendored WASM bundle's hsm commit and file SHA-256s, the engine artifacts the coverage matrix was built from, the release evidence report and its inputs, the frozen cross-target runs, and the deck files + deck-check result. Refused on a dirty tree, a failing release-evidence check or deck check (the release-evidence check runs outside this repository and is supplied with `--evidence-checker <module>`; without it the check counts as failed), an artifact that no longer matches its inventory hash, or an existing file. `npm run release:freeze -- --check evidence/release-freeze/<label>.freeze.json` fails when any frozen artifact, report figure, report input or evidence run changed, and lists the commits made since the freeze (J-4: blocker fixes only). Recording a review after the freeze does not break it: the freeze binds the report's figure sections, not its review status.

## Sabotage proofs for the validation gates (plan J-3)

A gate is trusted only once a deliberately broken input is shown to fail it. Gates named in plain words (not an npm script) run outside this repository before merge; only their proofs that live in this repository are listed. Every proof below runs on a temp copy or a synthetic fixture, never on the real files. `*.local.test.ts` files run in the local venue (`npm run test:local`), the rest in the unit suite.

| Sabotage                       | Gate                                             | Proof (file › test)                                                                                                                                                                                                                                               |
| ------------------------------ | ------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Wrong expected byte            | workbench runner (dual engine)                   | `src/components/Playground/hsm/acvp/useAcvpSuite.mldsaAcvp.local.test.ts` › flipped disposition / expected bytes are detected on both engines                                                                                                                     |
| Wrong expected byte            | ACVP-format prototype (F-4 golden check)         | `src/services/acvp/pipeline.test.ts` › golden comparison can FAIL; `src/services/acvp/acvp.engines.local.test.ts` › a flipped byte in a valid ML-DSA signature …, a flipped ciphertext byte changes k …                                                           |
| Wrong expected byte            | cross-target comparator                          | `src/services/acvp-xplat/compare.test.ts` › SABOTAGE: one flipped shared-secret byte …, a flipped sigVer verdict …                                                                                                                                                |
| Wrong evidence label           | coverage matrix check                            | `src/data/validation/coverageModel.test.ts` › refuses quarantined, unknown or misclassified manifest cases                                                                                                                                                        |
| Wrong evidence label (UI rows) | static guards in `src/utils/katEvidence.test.ts` | `src/utils/katEvidence.test.ts` › sabotage: the spec guard fails a non-ACVP spec labelled NIST/ACVP; sabotage: the workbench guard fails an ACVP claim on a non-NIST row (synthetic specs / synthetic source text, WS-I)                                          |
| Wrong evidence label (records) | case evidence check                              | `src/utils/katEvidence.test.ts` › every katRunner / workbench record carries its manifest case class; `src/data/validation/caseEvidence.test.ts` › a workbench row reads the manifest class, not its producer string                                              |
| Unchecked KAT (false pass)     | real engines, both (`test:local`) + unit         | `src/wasm/katRunner.suci.test.ts` › sabotage: one flipped ICB bit fails the KDF and encrypt steps; `src/utils/katRunner.engines.local.test.ts` fails on any non-pass on either engine (reverting aescbc-decrypt to CBC_PAD failed it on both, checked 2026-09-24) |
| Skip counted as pass           | coverage matrix check                            | `src/data/validation/coverageModel.test.ts` › a skip never counts as a pass, on either side (counted as skippedCells); `src/utils/katRunner.test.ts` › summarizeKatResults keeps skip as its own bucket                                                           |
| Missing provenance             | evidence badges                                  | `src/data/validation/evidenceClasses.test.ts` › never badges an unverified or quarantined entry                                                                                                                                                                   |
| Missing provenance             | ACVP-format prototype                            | `src/services/acvp/fixtures.test.ts` › recognises a pinned prompt by hash and nothing else; `src/services/acvp/pipeline.test.ts` (an unpinned prompt is `unverified-imported-vector-set`)                                                                         |
| Unsupported parameter coercion | ACVP-format prototype (F-3)                      | `src/services/acvp/coercion.sabotage.test.ts` (one mutated option refused at its path; SHA2-512/256 → unsupported, never sent, never answered); `src/services/acvp/parser.test.ts` › a revision that is not pinned is refused, never coerced                      |
| Unsupported parameter coercion | coverage matrix check                            | `src/data/validation/coverageModel.test.ts` › fails when a new declared parameter set lands inside an advertised range; keeps a declared parameter set only inside the engine-reported key-size range                                                             |
| Changed artifact hash          | coverage matrix check                            | `src/data/validation/coverageModel.test.ts` › ignores results recorded against a different artifact than the inventory records                                                                                                                                    |
| Changed artifact hash          | cross-target comparator                          | `src/services/acvp-xplat/compare.test.ts` › SABOTAGE: editing response.json without re-sealing evidence …; a tampered execution-environment.json …                                                                                                                |
| Changed artifact hash          | `release:freeze --check`                         | `scripts/release-freeze.test.ts` › SABOTAGE: one changed artifact byte …; a moved hsm commit …; a changed report figure or evidence run …                                                                                                                         |
| One-person review              | release evidence check (J-5)                     | `src/data/validation/reviewRecords.test.ts` › SABOTAGE: the same person in both roles …; a placeholder or role …                                                                                                                                                  |

## Not gated anywhere

`audit:sbom-versions` (being replaced by generating the About-page SBOM from
`package.json`), the `kat-node24` job and the PR classifier / CSV-diff comment
/ WASM label (deleted 2026-09-21 — nothing consumed them).
