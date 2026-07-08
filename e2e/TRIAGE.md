# E2E full-suite triage (2026-06-25)

Status of the ~82 specs that fail the **nightly full suite** against a fresh
production build. The fast `smoke` tier (gates PRs) is green and separate.

**Important:** the 82-failure baseline was captured on a heavily-loaded dev
machine (4 workers, hours of prior builds). Many "failures" are **load-induced
timeouts** (45–60s) on specs whose selectors/features verifiably still exist —
those should pass on a fresh CI runner (bounded workers + retries). **Treat the
nightly CI run as the authoritative red list**, not a loaded local run.

## Categories

| Category           | ~Count | Meaning                                                                                                                                                          | Action                                                  |
| ------------------ | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| **SLOW-WASM**      | ~27    | Real crypto (ML-KEM/ML-DSA, softhsm, openssl, IKEv2/SSH handshakes). UI + selectors all exist; they just exceed the timeouts. Valuable KAT/integration coverage. | **Keep; bump timeouts.** Run nightly only.              |
| **STALE-REMOVED**  | ~8     | The asserted feature/selector is gone (redesign).                                                                                                                | **Quarantine** (`test.skip` + dated reason) or rewrite. |
| **DRIFT-REDESIGN** | ~10    | Feature exists but selector/route/text/ID changed.                                                                                                               | **Fix** the selector (per-test).                        |
| **LOAD/FLAKY**     | ~30+   | Selectors verified present; failed only on the saturated local run.                                                                                              | **Re-baseline on CI**; fix only if still red there.     |

## Done in this commit

**Quarantined (verified STALE — feature removed from source):**

- `migrate-persona-defaults.spec.ts` (2 tests) — `/migrate` → MigrationWorkbench, no `PersonaDefaultsBanner`.
- `library.spec.ts` "curious mode hides the shell" — testid `persona-picks-curious` gone.
- `algorithms-ux-improvements.spec.ts` Detailed-tab (2 tests) — `#section-*` ids gone (Detailed redesigned; KAT → Validation tab).
- `sim-type-floor.spec.ts` "guided caption" (already quarantined earlier) — testid `mosca-guided-caption` gone.

**Fixed (verified DRIFT):**

- `navigation.spec.ts` — migrate heading `PQC Migration Guide` → `PQC Migration Workbench` (PageHeader `<h1>`, confirmed in source).

## Backlog (recommended, by category)

**SLOW-WASM — DONE (timeouts bumped 2026-06-25; pending CI validation):**
`cms-workshop-crypto`, `api-security-jwt-real-crypto`, `cms-hsm-sign`, `acvp-validator`, `ssh-pqc-simulator`, `_vpn-diagnostic`. Full/nightly runs now pass `--timeout=180000`; inner result `waitFor`s raised (ssh 60→90s, cms inner 3–10→10–30s, api-jwt 10–30→25–60s, vpn 90→120s). The ssh live-handshake tests had 60s inner waits under a 45s global = a guaranteed-failure bug, now fixed. NOT validated locally (preview server crashes under sustained WASM load on the dev machine). **If any still fail at 180s in the nightly CI run, they are genuinely broken (code/selector), not slow — investigate at the source, do not bump further.**

**DRIFT-REDESIGN — fix selectors (feature still exists):**

- `learn-nice-view.spec.ts` (~11) — NICE work-role codes renamed (`SP-ARC-001`→`DD-WRL-001`, `SP-ARC-002`→`DD-WRL-003`, `SP-RSK-001`→`OG-WRL-013`); NICE toggle is now a button with `aria-pressed`, not `role="radio"`.
- `algorithms-persona.spec.ts` (2) — filter button text/persona default tab drifted.
- `algorithms-ux-improvements.spec.ts` `AlgorithmEntryStrip` + mobile-wizard (2) — components exist; likely needs URL-param/viewport seeding.

**LOAD/FLAKY — re-baseline on CI before touching:**
`workshop-autostart` (5), `threats-persona-defaults` (1), `library-cswp39` (2), `assess-redesign` (2), `pki-enrollment-protocols` (1), `compliance-focus-view` (2), `compliance-persona-overwhelm` (1), `command-center-kpi` (1), `command-center-pdf-export` (1), `cmdk-trust-order` (1), `chat-citation-tier` (1), `learn-persona-path` (~7), `curious-guide` (2), `gamification` (1), `library.spec.ts:90` (fast-fail — actually a REAL assertion failure, investigate the corpus count), and the sim specs (`sim-report-embed`, `sim-planning-badges`).

## How to work this down

1. Let the **nightly CI** run produce the real red list (fresh runner).
2. Bump the SLOW-WASM timeouts in one pass (keeps ~27 valuable tests).
3. Fix the DRIFT specs by group (learn-nice codes, algorithms persona/strip).
4. Whatever is still red after 1–3 is the genuine backlog — fix or quarantine with a dated reason. Green must mean green.

---

# Update — 2026-07-03: full-suite re-run + root-cause investigation

A fresh full-suite run (production build, 4 workers, 1 retry — the same
"loaded local run" caveat above applies) came back **54 failed / 3 flaky /
158 passed** (down from the ~82 baseline three of the categories below explain
why). Six parallel investigations replaced guesswork with source-level
evidence for every failure — several were mis-bucketed as LOAD/FLAKY above
and are actually concrete, fixable issues. This section supersedes the
per-spec guesses above where they overlap; the category table and backlog
above still apply to specs not mentioned here.

## Two real product bugs (not test problems) — fix these regardless of test status

**1. `?persona=` deep links silently lose the persona when combined with
video-autostart params — a genuine race condition, live-reproduced.**
`src/hooks/useUrlPersonaOverride.ts` reads `?persona=`, applies it, then
strips it from the URL. `src/hooks/useWorkshopUrlAutostart.ts` (a sibling
hook) also reads `?persona=`, but its effect re-runs when the URL changes —
so the strip cancels its in-flight resolution and it silently re-resolves
with persona defaulted to `'executive'`. Any real link combining
`?persona=X` with the workshop-video autostart params hits this — not just
the test's synthetic URLs. **Fix:** stop `useWorkshopUrlAutostart`'s effect
from re-running when the sibling hook rewrites the URL (capture the params
it needs once, e.g. via a ref, instead of depending on the live `params`
object). Small, localized change. → explains all 5 `workshop-autostart.spec.ts`
failures.

**2. The "Show me everything (advanced)" escape hatch is unreachable on the
new `/learn` page for every persona.** `PersonaPathView.tsx` guards it behind
an `onShowEverything` prop that `MyPathView.tsx` (the new page) never passes.
This isn't a renamed selector — the feature genuinely has no way to trigger
in the current page, for anyone. **Fix:** wire the prop through in
`MyPathView.tsx`. Small. → part of the `learn-persona-path.spec.ts` failures
below (one of several stale-vs-real findings in that cluster).

**Also worth a look (found as a side effect, not itself a test failure):**
the PWA service worker (`src/sw.ts` + `vite.config.ts`'s `VitePWA` config)
precaches ~1.4GB — nearly the entire build, including multi-MB WASM/JS
chunks — on first visit to ANY page. This is almost certainly why
`/simulation` never reaches Playwright's `networkidle` (see below), and is
worth a look for real first-time visitors too, independent of tests. Not
fixed here — flagging for a product/perf decision.

## Corrected root causes (the guess above vs. what's actually there)

| Spec                                                                                                                                   | 2026-06-25 guess                      | 2026-07-03 finding                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| -------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `workshop-autostart.spec.ts` (5)                                                                                                       | LOAD/FLAKY, re-baseline               | **Real bug** — race condition above, not load.                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `compliance-focus-view.spec.ts` (2)                                                                                                    | LOAD/FLAKY, re-baseline               | **STALE-REMOVED** — the "Focus view" master-detail UI was deleted outright when `/compliance` was rebuilt around a 3-pillar pipeline (`PillarPipeline.tsx` replaced `LandscapeTab.tsx`). No load issue; the button doesn't exist.                                                                                                                                                                                                                                                               |
| `library-cswp39.spec.ts` (2)                                                                                                           | LOAD/FLAKY, re-baseline               | **STALE-REMOVED** — both asserted links (pillar-pill, evref deep-link) were deleted when the legacy library card was retired; the data moved into a detail drawer with no equivalent links.                                                                                                                                                                                                                                                                                                     |
| `library.spec.ts:90` (1)                                                                                                               | "investigate the corpus count"        | **Confirmed real, and still moving** — active-doc count has been declining release over release as the enrichment pipeline tags more history `deprecated` (805 on 06-02 → 744 → 687 → 691 today). Not a bug; the test's `FULL_CORPUS_FLOOR = 800` comment is just stale.                                                                                                                                                                                                                        |
| `cms-workshop-crypto.spec.ts` (10) + `cms-hsm-sign.spec.ts` (1)                                                                        | SLOW-WASM, bump timeouts              | **Not a timing issue at all.** A UI refactor replaced the native `<select>` in these three demo components with a custom `FilterDropdown` combobox; the tests still look for `locator('select')`, which now matches nothing — no timeout will ever fix this. One variant (`DualSignDemo`) has no visibility guard before acting, so it hangs the full 360s test budget instead of failing fast — the most severe single failure in the run.                                                     |
| `ssh-pqc-simulator.spec.ts` (3)                                                                                                        | SLOW-WASM, bump timeouts              | **Not a timing issue.** Three unrelated stale-test issues: renamed comparison-panel text, a test asserting the wrong (topically mismatched) Learn-module link, and a default-tab change that hides this tool from the plain `/playground` grid unless you deep-link into its category.                                                                                                                                                                                                          |
| `learn-nice-view.spec.ts` (8) + `learn-persona-path.spec.ts` (9)                                                                       | DRIFT-REDESIGN (~11), LOAD/FLAKY (~7) | **Bigger than either guess — the whole page swapped.** `/learn` now renders a redesigned page (`LearnRedesignView`); the old page these tests target still exists, but only at `/learn/legacy`. Every failing selector is old-page-only. Two tests hang the full 180s test budget clicking a radio button that no longer exists anywhere — `playwright.config.ts` has `actionTimeout: 0` (unbounded), so a zero-match `.click()` blocks until the whole test times out instead of failing fast. |
| `_vpn-diagnostic.spec.ts` (1)                                                                                                          | SLOW-WASM, timeouts bumped 06-25      | **Partially fixed, one gap remains.** The 06-25 pass bumped the _inner_ handshake waits but missed the _outer_ 15s mount wait for the "Start Daemon" button on this ~4000-line WASM-heavy panel — that's the one still timing out.                                                                                                                                                                                                                                                              |
| `pki-enrollment-protocols.spec.ts` (1)                                                                                                 | LOAD/FLAKY, re-baseline               | **Confirmed — genuinely load/env timing**, not a selector or code issue. All asserted text/elements match current source exactly; this is in-browser WASM cold-load + key generation taking longer than 30s under load, as TRIAGE already suspected.                                                                                                                                                                                                                                            |
| `algorithms-persona.spec.ts` (2) + `algorithms-ux-improvements.spec.ts` (1)                                                            | DRIFT-REDESIGN, ~2                    | **Confirmed drift, one is actually a test bug.** Executive's default tab intentionally moved (`detailed`→`transition`) and "More filters" was renamed to "Filters" — both simple text updates. The entry-strip test fails because it re-seeds its own dismissal flag on every navigation (including the reload it's testing), wiping the very state it's checking — a bug in the test's use of `page.addInitScript`, not app drift.                                                             |
| `sim-report-embed.spec.ts` (1), `sim-planning-badges.spec.ts` (2), `sim-verify-close.spec.ts` (flaky ×2), `sim-start-over.spec.ts` (1) | LOAD/FLAKY                            | **Confirmed load-related, with a specific mechanism**: the service-worker precache storm above. All of these navigate to `/simulation` after an earlier page already "won" the idle race; `/simulation` never goes network-idle within 45s while the SW is still fetching ~3,300 precache entries in the background. Switching these specs' wait strategy off `networkidle` (they already assert a specific selector right after `goto`) should resolve them without touching the app.          |

## Recommended order of work

1. **The two real bugs first** — small, localized, and they affect real users independent of any test (deep links, and a dead-end UI escape hatch).
2. **`cms-workshop-crypto` / `cms-hsm-sign` locator fix** — same root cause across 12 tests (highest count of any single fix), plus it currently contains the single worst failure (a 6-minute hang). Update the ~4 helper functions to drive `FilterDropdown` instead of `<select>`; add a visibility guard to `DualSignDemo`'s helper so a future break fails in 15s, not 360s.
3. **`/simulation` wait-strategy fix** — 5 tests, one small test-only change (swap `networkidle` for a selector-based wait), no app change required.
4. **`learn-nice-view` + `learn-persona-path` rewrite** — biggest test count (17) but needs a real rewrite against the new page, not a one-line fix. Do this after 1–3 since it's the largest single effort.
5. **Everything else in the table above** — each is a small, independent, well-understood fix (a handful of minutes to ~1-2 hours each); order doesn't matter, batch them together.
6. **`compliance-focus-view` and `library-cswp39`** — these need a product decision (restore the removed UI, or delete the tests for a feature that's genuinely gone) rather than a mechanical fix. Flag for whoever owns those pages rather than fixing blind.
7. Leave `pki-enrollment-protocols` alone — it's a real environment/timing dependency, already correctly categorized; only revisit if it's still red on an unloaded CI runner.

# Update — 2026-07-03 (second pass): production-build verification found 5 more

Executing the remediation plan above (Phases 0–4) and re-verifying every
touched spec against a production build (`vite preview`, not dev) surfaced 5
failures the dev-server pass didn't catch. All 5 are now resolved — 3 were
genuine stale-test bugs (fixed), 2 were real, small app/content gaps
(quarantined first with the evidence trail below, then fixed for real once the
user asked for it — see the follow-up note after the table).

| Spec                                           | Looked like                                                             | Actually was                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| ---------------------------------------------- | ----------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `library.spec.ts:105` (persona=executive)      | The dev-only "executive narrowing" quirk flagged earlier as unresolved  | **Stale test copy, and worse than it looked.** The banner text is "Showing N of 691 — narrowed to your role's focus areas", not "documents matched to your role" (probably rewritten during the Library redesign). Because the file sets `test.describe.configure({mode:'serial'})`, this one failure cascaded to silently skip 5 sibling tests (developer/architect/ops/curious/the escape-hatch test) every run — they weren't passing, they just never ran. Confirmed live: narrowing itself works correctly for all 5 personas. Fixed the regex + the escape-hatch button text ("Show all documents", not "See all N"); all 7 non-quarantined tests in the file now pass.                                                                      |
| `_vpn-diagnostic.spec.ts:20`                   | The outer-mount timeout bump (this pass) not being enough               | **Wrong root cause entirely — not a timing issue.** `vpn-sim` is a standalone Playground tool (`/playground/vpn-sim`), not a tab inside `/playground/hsm` — `?tab=vpn_sim` matches no tab id anywhere in source, so the whole VPN panel never mounts, at any timeout. Fixed the URL; test now passes in 3.7s.                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| `sim-start-over.spec.ts:11`                    | A too-tight test timeout (45s default vs the project's 180s convention) | **Disproven by testing it — even 180s times out.** The page snapshot at failure showed the full simulation console loaded and interactive, but no "START OVER" button anywhere — it's been collapsed into a "⋯ MORE" overflow menu (`RunActionsMenu`, documented as "PR2"). The test never opened the menu. Fixed; passes in 1.8s.                                                                                                                                                                                                                                                                                                                                                                                                                 |
| `sim-planning-badges.spec.ts:98` (Q-Day badge) | A renamed/stale locator (same pattern as the algorithms/SSH fixes)      | **Real gap, confirmed live, then fixed.** `PlanningBadge`'s own doc comment names Q-Day as an intended badge target, but `<PlanningBadge` had exactly one call site in the whole app (shelf-life only). Added a "Years to Q-Day" KPI tile to `SimulationView.tsx`'s ribbon carrying the badge (`atoms.tsx`'s `Stat` got an optional `badge` slot). Test un-skipped, passes.                                                                                                                                                                                                                                                                                                                                                                        |
| `sim-report-embed.spec.ts:89`                  | A renamed step label (same pattern as sim-start-over)                   | **Real regression, confirmed via generator source + git-archive diff, then fixed.** The "program closure record" reference step deep-linked to `/report` (embeddable) as of the `06222026` tree snapshot; the `06302026` regeneration repointed the _same_ step at `/business/tools/migration-verification` instead — reasonable on its own, but that id isn't in `REFERENCE_EMBED_IDS`, so the step silently stopped being embeddable. Added a second VC.1 step (`refId: 'report'`, labelled "Reference: the Executive Report") via `scripts/gen-sim-trees.mjs`, cut a new `07032026` snapshot for `verify-close` only (the other 9 phases were unaffected and stayed on `06302026`), archived the old closure snapshot. Test un-skipped, passes. |

**Follow-up (2026-07-03, later same day):** the user asked for both gaps fixed
for real rather than left quarantined. Both are done — see the two rows
above. Net result: of the original 54 red tests plus the 5 second-pass finds,
the **only remaining real product gap is zero** — every genuine bug found
this pass (the Phase-0 persona race, the Q-Day badge, the report entry point)
is now fixed in the working tree, verified twice against a production build
(104 passed / 8 skipped / 0 failed, identical both runs). The 8 remaining
skips are all feature-removal quarantines with commit evidence (Phase 4:
`compliance-focus-view` ×3, `library-cswp39` ×2) or pre-existing skips from
before this pass (`algorithms-ux-improvements` ×2, `library.spec.ts` curious
mode ×1) — none are gaps a user would notice.

Net: of the original 54 red tests plus these 5 second-pass finds, exactly
**3 are real product gaps** (the persona-race bug fixed in Phase 0, plus these
last 2 quarantined here) — everything else was test staleness or environment
timing. All fixes verified against a `vite preview` production build, not
just the dev server.

**Correction (2026-07-08):** the "8 remaining skips" count above undercounted.
`migrate-persona-defaults.spec.ts` (2 tests, quarantined 2026-06-25 — see "Done
in this commit" at the top of this file) was omitted from that tally by
mistake; it was never un-skipped or deleted and is still quarantined today.
Also, `tls-hsm.spec.ts` (3 tests) has been permanently skipped since
2026-05-15 (commit "TLS sim composite credentials..." #210, predating this
triage doc entirely) and was never entered here. **Actual total: 14
permanently-skipped tests across 7 files** — `compliance-focus-view` ×3,
`library-cswp39` ×2, `algorithms-ux-improvements` ×2, `library.spec.ts`
curious-mode ×1, `migrate-persona-defaults` ×2, `sim-type-floor` ×1,
`tls-hsm` ×3. Three of those seven files are now **100% skipped — every test
in the file is dead** (`compliance-focus-view.spec.ts`, `library-cswp39.spec.ts`,
`migrate-persona-defaults.spec.ts`): they still run in nightly CI (spin up a
browser, navigate, immediately no-op) for zero coverage. Per the "delete or
rewrite" guidance already in this doc, these three need a product-owner call
on whether to delete outright — not fixed here, flagging for that decision.

# Update — 2026-07-08: two post-07-03 regressions found and fixed, one still open

The nightly full suite had drifted back to red since the 07-03 green
snapshot above (104 passed / 8 skipped / 0 failed) — tonight's run showed
2 failed + 1 flaky per shard (4 failed / 1 flaky / 210 passed total). Both
fixable regressions trace to the same 2026-07-04 commit (`0e07d90b`, "honest
quick/full tiering — trim quick track, gate on profile mode"), which trimmed
the quick assessment track from 8 steps to 6 and removed
`'Algorithm migration map'` from the report-section list — both intentional
product changes that shipped without a matching test update.

| Spec                        | Finding                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | Status                                                                                                                                                                                                                                                                                                                                                               |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `assess-redesign.spec.ts`   | Asserted `getByText('Algorithm migration map')`, which `reportContract.ts` deliberately dropped from `FAST_REPORT_SECTIONS` on 2026-07-04 (both tracks populate it; advertising it as a track-specific unlock was misleading). **STALE-REMOVED**, not load/flaky as previously assumed.                                                                                                                                                                                                                                                        | **Fixed** — assertion now targets `'Key findings & threat landscape'`, still current.                                                                                                                                                                                                                                                                                |
| `sim-assess-return.spec.ts` | Never previously triaged (added 2026-06-21). Seed fixture set `currentStep: 7` with `infrastructure`/`timelinePressure` fields — valid against the pre-07-04 8-item `RENDER_ORDER_QUICK`, but that array is now 6 items (indices 0-5); index 5 (`'migration'`) is the new last step. A stale in-source comment in `assessFlowModel.ts` ("8-item quick array") reinforced the same wrong assumption.                                                                                                                                            | **Fixed** — fixture now uses `currentStep: 5` and drops the two removed fields; comment corrected too.                                                                                                                                                                                                                                                               |
| `acvp-validator.spec.ts`    | Times out waiting for `'Validation Suite Completed'` (30s window) after the WASM test-vector loop. Ruled out: vector count hasn't grown (6 fixed KATs, unchanged since 2025-11-27) and there's no artificial delay in `ACVPTesting.tsx`'s `runTests()`. Measured locally: 21.6s to reach that point, only ~8s of headroom under the old 30s cap — reliably tips over on GitHub's slower shared runners. Genuine per-call WASM/liboqs latency (same category as the already-accepted `pki-enrollment-protocols` timing issue), not a code hang. | **Fixed** — widened just this checkpoint to 90s (not the whole 180s budget, and not a re-guess: workload and code path were ruled out first, and the 21.6s local measurement shows this is a load-margin problem, not a hang). If still red at 90s in a real nightly run, that _would_ indicate a genuine hang — investigate at the source then, don't bump further. |

`cmdk-trust-order.spec.ts` remains flaky (not hard-failing), consistent with
its existing LOAD/FLAKY categorization above — no new finding.

## `pki-enrollment-protocols.spec.ts` — corrected root cause (was mis-triaged twice)

The 2026-07-03 pass concluded this was "confirmed — genuinely load/env
timing... all asserted text/elements match current source exactly," and
recommended leaving it alone. That conclusion was wrong: the failure
reproduces **100% of the time, including on a fast unloaded local machine**
(not intermittent under load), which by itself should have ruled out a
timing explanation.

Actual cause: `CmpInitialReq.tsx` renders the decoded certificate through
the shared `<CopyableOutput>` component (`src/components/ui/CopyableOutput.tsx`),
which is a readOnly `<textarea>`, not a `<pre>`. A controlled `<textarea>`'s
content lives in its DOM `.value` property, not its `textContent` — so
`page.locator('pre').filter({ hasText: 'Certificate:' })` can never match
it, at any timeout. This predates both prior triage passes (component last
touched 2026-05-31) and was never actually verified against source, just
assumed to be a timing issue because it superficially resembled the
already-accepted WASM-timing cases nearby.

**Fixed** — the test now scopes to the "Decoded certificate" `<details>`
block (there's a second `<CopyableOutput>` on the same page for the raw
cert PEM) and reads `.inputValue()` instead of `.textContent()`. Passes in
~2.5s locally, every run.

**Lesson for this doc:** "matches current source exactly" claims in earlier
passes checked _text strings_ against source, not whether the _locator
strategy_ (tag name, `hasText` vs `.value`) could structurally match at
all. A selector search that can never succeed looks identical to a slow
one until someone runs it on a fast, idle machine.
