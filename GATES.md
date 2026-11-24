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
- `audit:matrix-refs` — protocol-matrix doc-ID references (also those in a row's description, recommended reason and vendor-availability text) are backed by structured refs, `stage` and `value` agree, ref ids are well formed, a published RFC is not listed under drafts (nor a draft under releases), and every library `productId` is an active catalog row whose licence does not contradict its open-source / commercial list.
- `audit:role-board-drift` — `roleBoardContent.generated.ts` matches `role_board_content_*.csv`.
- `gen:timeline-facts:check` — `timelineFacts.generated.ts` matches the CSV.
- ~~automatic~~ `sync:wasm:check` is **manual only since 2026-09-27** (owner decision — it failed every hub push whenever pqctoday-hsm moved; run it by hand during a wasm rebuild) — the vendored wasm bundles are built from the pqctoday-hsm commit they claim (needs the sibling checkout — only meaningful here). Since 2026-09-26 a Rust bundle's inputs come from its Cargo build graph (`cargoManifest` in `public/wasm/wasm-provenance.json`, derived by `scripts/ci/wasm-build-inputs.ts`) rather than a hand-written `sourceDirs` list. That hand-written list had missed a linked crate: cacp-kmip never saw a Rust engine change. It had also flagged changes that cannot alter the binary (reports, committed wasm output, the bench crate). `scripts/ci/wasm-build-inputs.local.test.ts` replays both kinds of error against real hsm commits. On CI's blobless clone the derivation reads each Rust source once, lazily: measured at ~96 s for cacp-kmip.
- `gen:algorithm-properties:check` — `algorithmProperties.ts` matches the newest algorithm reference CSV (the rows with a `registry_order`).
- `gen:landing-counts:check` — landing hero counts match the CSVs.
- GitHub also runs `gen:timeline-facts:check`, `gen:landing-counts:check`, `generate:data-filenames:check` and `gen:algorithm-properties:check` as one step ("Generated data files are current") in `pr-check.yml` and in `ci.yml` `checks` (added 2026-11-25; until then they ran only here).
- `gen:readme-facts:check` — the bounded README snapshot matches the current
  release and committed data lineages.
- `audit:readme` — README repository links, canonical product routes, source
  boundaries and product-positioning claims satisfy the documentation contract.
- `gen:sbom-versions:check` — the committed SBOM version list matches `package.json`.
- `audit:test-reachability` — every test-shaped file in the repo is actually run by some enforced gate, and every declared gate in `scripts/ci/check-test-reachability.ts` is verified against the actual workflow YAML job, hook, or `package.json` script that invokes it (it asks `vitest list` and `playwright --list` which files each gate resolves, rather than re-implementing their glob/filter semantics). Anything intentionally left out goes in the script's own `ALLOWLIST` with a reason, and a rotted allowlist entry or deleted/rerouted gate fails too.
- `test` — the full vitest suite (runs on GitHub in `pr-check.yml` `pr-test` and `ci.yml` `test` across 3 shards, and locally via `gate:local` / `gate:release`; not run by `.husky/pre-push`).
- `test:local` — the `*.local.test.{ts,tsx}` tier, UNSCOPED (`vitest.local.config.ts`). Release-only local gate: reached through `npm run gate:release` (`gate:local` → `test:local`) and `npm run gate:release-local`, not by `.husky/pre-push` or GitHub CI. `gate:cacp` and `gate:pkcs11` are manual-only commands. **Update (2026-09-26):** the SLH-DSA NIST-vector suite moved to the nightly venue below (`*.nightly.test.ts`), and all other `*.local.test.*` files stay in `test:local`.

then the hook writes the receipt (`gate:prepush` ends with `gate:receipt`). Since 4.207,
`gate:local` run by hand writes no receipt: inside `gate:release` it is only the first
half, and a receipt written there let a push skip the hook while the rest of the
release check was still running or had failed. Data checks (data integrity, archival, evidence,
editorial and validation-evidence checks) are not part of this gate: they run
outside this repository on each PR head before merge. (`gate:cacp` was removed from the hook and from GitHub on 2026-09-27 by owner decision; run `npm run gate:cacp` by hand when changing the KMIP/CACP playground or rebuilding its wasm.)

## Engine files and the HSM sibling (2026-10-12)

- `npm run verify:engines` (in `gate:local`, `gate:prepush` and CI's `checks` job) proves the vendored
  engine files match `public/wasm/engines.lock.json`: SHA-256 and size of every file, the HSM commit per
  bundle, and that `wasm-provenance.json` names files, never folders. It needs **no sibling checkout**.
  It also locks the engines not built in `pqctoday-hsm` (TPM emulator, LMS module, NIST SP 800-90B
  tools) from `src/data/sbomWasmArtifacts.json`: their pinned binaries plus the loaders in `lockFiles`,
  with producer and build commit. After rebuilding an engine: update its provenance entry (or its
  artifact record), run `npm run verify:engines -- --write-lock`, commit the lock with the files.
  Rollback is reverting that commit. Bundles built in `pqctoday-hsm` are also pinned to a published
  engine release (`release`: tag, asset, tarball SHA-256). After publishing a new engine release, pin
  it with `npm run verify:engines -- --pin-release engines-N --sums <that release's SHA256SUMS>`. A pin
  whose asset name no longer matches the bundle's build commit fails `verify:engines` as `release stale`.
- Guards that read the sibling `pqctoday-hsm` checkout (`constantTables`, `policyCatalogSync`,
  `wasm-build-inputs` replay, `sync:wasm:check`) used to skip quietly when it was absent. They now **fail
  loudly**; set `ALLOW_MISSING_HSM=1` to skip knowingly (a WARNING names each skipped guard) or
  `HSM_REPO_PATH` to point at the checkout. GitHub CI never runs them.

## GitHub — `.github/workflows/ci.yml` (push to main)

`checks` (the required status check) ≈ 13–15 min:

- `lint` — security lint on a clean checkout.
- Data checks are not run here: they run outside this repository on each PR head before merge.
- `verify-attestations` — signatures on shipped trust artifacts.
- `build` — clean-checkout `tsc -b` + vite + Playwright prerender + precache/TLA budgets; on main its `dist/` is uploaded for deploy.
- `test:e2e:ci-smoke` — the 6-spec Playwright smoke tier against the build.
- ~~PR only~~ — **GitHub CI no longer runs on pull requests (owner decision D20, 2026-09-27)**: it runs on push to `main` (concurrency group `ci-main`, superseded runs cancelled) and on `workflow_dispatch`. PRs are validated by the full local gates (`.husky/pre-push`) plus the small `pr-check` workflow below. ~~Merged with `gh pr merge --admin` on local green (D21)~~ — **superseded 2026-09-29**: D21 left `main` requiring `checks`/`test (1)`/`test (2)`, which never run on a PR, so every PR was BLOCKED and every merge needed an admin override that the Claude Code auto-mode classifier refuses. Merges are now plain (see "Merging a PR"). `check-tool-version-bump` / `check-module-version-bump` moved into `gate:local` (`npm run check:version-bumps`). `validate-offline-attestation` was removed (it needed a PR number, and no `approvals/offline-*` file was ever committed).
- `audit:deps` — high/critical advisories, with dated exceptions (`scripts/ci/audit-gate.ts`). Last on purpose: if it is the only red step, it is the known `pptxgenjs → image-size` pair.

`test` (matrix ×3) ≈ 8 min each: `vitest run --shard=N/3` — the unit suite.

**Page-load budget — report-only.** `e2e/perf-budget.spec.ts` (nightly full suite, `chromium` project) loads `/`, `/learn`, `/migrate`, `/library`, `/threats` and `/report` from the build and prints each page's downloaded JavaScript (decoded KB), DOMContentLoaded, load and LCP, marking a page `OVER` when it passes its budget. It never fails on a budget: runner timing varies. `PERF_BUDGET_ENFORCE=1` makes an over-budget page fail (use on a quiet machine). Production builds also ship only the newest dated library and threats enrichment file (`scripts/lib/newestEnrichmentOnly.ts`, checked at build time; the build log prints one line per family).

`gate-cacp` — **removed 2026-09-27** (owner decision). It gated every hub PR on pqctoday-hsm's state. `npm run gate:cacp` stays available to run by hand.

## GitHub — PR check (`.github/workflows/pr-check.yml`, every PR to main)

The only checks `main`'s branch protection requires: `pr-check`, `pr-test (1)`,
`pr-test (2)`, with "branch must be up to date". `pr-check`: install, the committed SBOM version list check
(`gen:sbom-versions:check`, skipped for dependabot PRs), `lint`
(security rules), `verify-attestations`, and a clean `build`
(which includes `tsc -b`), then a short browser tier against that build
(`playground-pr-desktop`, `playground-pr-mobile`, and `a11y-modules-pr`: the Playground and Business
Tool contract, and the Learn-module tab, phone and accessibility spec), ~8–10 min. `pr-test`: the unit suite in 3 shards
(`pr-test (1)` to `pr-test (3)`), in parallel; all three must pass before a
merge, including `pr-test (3)` while protection does not yet require it. It exists so a PR can satisfy protection
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
2. `pr-check`, `pr-test (1)`, `pr-test (2)` and `pr-test (3)` are green and the branch is up
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
   - **Release PRs:** once the release is verified live (step 5), also clean
     up every worktree whose work the release carried, not only the release's
     own. A worktree qualifies when its head is an ancestor of `origin/main`
     or `git cherry origin/main <head>` prints no `+` lines, and it has no
     uncommitted changes and no process running inside it. Remove it with a
     plain `git worktree remove` (never `--force`). Leave any worktree that an
     open release or lane still uses.
   - Run `git branch -d` from a checkout that is on an up-to-date `main`.
     `-d` checks against the current branch, so it refuses merged branches
     while that checkout sits on an old one.

## GitHub — deploy (`.github/workflows/deploy.yml`)

Runs only after CI **succeeds** on main (`workflow_run`), and publishes the
`dist` artifact that run built — a red main no longer deploys. A manual
`workflow_dispatch` rebuilds from source. `retain-live-boot-assets` keeps the
previous release's boot chunks so a cached `index.html` still starts.

## GitHub — nightly (`.github/workflows/e2e-nightly.yml`, 07:00 UTC)

The full Playwright suite, 2 shards. Not a required check. The `notify` job
opens/updates one issue, **"Nightly E2E is red"**, with the run URL and the
failing test names, and closes it on the next green run.

## GitHub — nightly deep links (`.github/workflows/deeplinks-nightly.yml`, 07:30 UTC)

`e2e/deeplinks.local.spec.ts` (the `local` Playwright project, so neither PR
CI nor the full nightly runs it) against the production build via `vite
preview`. It guards that every shared-link kind opens its item, on desktop and
phones, first-time and returning, and that each item overlay's Share copies the
clean link. Report-only (owner decision 2026-10-03): not a required check, and
its own issue, **"Nightly deep links are red"** — it does not trigger the
nightly-E2E merge rule above. Reproduce: `npm run build`, then
`npx playwright test --project=local e2e/deeplinks.local.spec.ts`.

## GitHub — nightly vector suites (`.github/workflows/validation-nightly.yml`, 05:00 UTC)

`npm run test:nightly` — the `*.nightly.test.{ts,tsx}` tier, unscoped, via
`vitest.nightly.config.ts`. Both `vite.config.ts` and `vitest.local.config.ts`
exclude that tier, so it runs here and nowhere else. It is for suites that must
run but are too slow for pre-push. The SLH-DSA checks run in three independent
files: the baseline (`useAcvpSuite.slhdsaAcvp.nightly.test.ts`), length mutation
(`useAcvpSuite.slhdsaAcvp.lengthMutation.nightly.test.ts`) and expectation
mutation (`useAcvpSuite.slhdsaAcvp.expectationMutation.nightly.test.ts`). Each
loads its own C++ and Rust engines in an isolated process; the mutation mocks
cannot affect another pass. All 14 tests and their original assertions remain.
The worker count uses available CPU capacity, up to three, locally and in CI. Each pass logs
its process ID and elapsed time. Measured locally on 16 November 2026 with
Node 26.3.0 and Vitest 5.0.5: the sequential run took 2,597.55 seconds (43.3 min);
the three-worker run took 779.91 seconds (13.0 min), about 70% less elapsed time.
All 14 tests passed, with 3,078 rows executed per pass. This is a local
measurement; runner performance remains unmeasured.
The suite originally moved here by maintainer decision, 2026-09-26.

| Independent pass     | Tests | Purpose                                                                                 |
| -------------------- | ----- | --------------------------------------------------------------------------------------- |
| Baseline             | 12    | Real reference vectors and cross-engine agreement                                       |
| Length mutation      | 1     | A falsely labelled signature-length negative must fail                                  |
| Expectation mutation | 1     | Corrupted expected dispositions and signature bytes must fail exactly the affected rows |

During a repair, select the affected file for feedback. For release acceptance,
run the unscoped command once and retain its JSON report; a filtered pass does
not establish that all three passes succeeded. Progress messages identify each
pass and process and report elapsed time on completion.

Not a required check, so a regression here can sit on `main` for up to a day.
The `notify` job opens or updates ONE issue, **"Nightly validation vectors are
red"**, with the failing test names, and closes it on the next green run. The
per-step time budget comes from `SLHDSA_BUDGET_MS` (60 min on the runner; the
file's own default is tuned to a Mac). Runner timing has not been measured yet.
Before a release, run it on demand (`workflow_dispatch`) or locally with
`npm run test:nightly`. `audit:test-reachability` lists this gate and fails if
the workflow stops invoking it.

## Before a release — `npm run gate:release`

`gate:leak` (since 4.207: GitHub's leak-guard checks, run first and blocking —
the whole tracked tree against `scripts/ci/leak-baseline-source.json`, and the
added lines and commit messages of `origin/main...HEAD`; the range step is
report-only on GitHub, enforced here so a finding is fixed before the push rather
than read after it) + `gate:local` + `verify:engines:release` (downloads each engine release a bundle
is pinned to, checks the tarball SHA-256 against the pin and every file against
the lock; needs the network, so it is here and in the weekly
`engines-release-weekly.yml`, not in pre-push) + `gate:e2e` (`build` + the full Playwright suite against the
production build — the round-9 lesson: 15 browser regressions shipped through
13 green releases while only the smoke tier ran per PR) +
`gate:leak:dist` (since 4.207: the built `dist/` against
`scripts/ci/leak-baseline-dist.json`, the same scan GitHub's CI build job and the
deploy run, so a finding in the built site shows up before the push) +
`test:e2e:local-tier` (`E2E_SERVER=dev playwright test --project=local` — the 18
`*.local.spec.ts` specs, which both CI projects exclude and which no gate ran
before 2026-09-26) (`gate:cacp` and `sync:wasm:check` are manual-only since 2026-09-27, H2), then the receipt `.gate-ok-<sha>` so the
pre-push hook does not repeat it.

**Sitemap dates, before signing.** Each route's `<lastmod>` in `public/sitemap.xml` is the date of the
last commit that touched the files behind it, and every `npm run build` rewrites the file. Commits made
after it was last committed (a release's own content commits) move those dates, so the build leaves the
tree dirty and the live sitemap would stay a day behind. Make the build-outputs commit (the sitemap
included) the last commit before signing. The sitemap is not a signed file, so this needs no re-sign.
`generate:sitemap:check` compares the URL set only, not the dates, so it does not catch this.

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
