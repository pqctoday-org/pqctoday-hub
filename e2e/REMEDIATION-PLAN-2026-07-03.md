# E2E Remediation Plan — 2026-07-03

Detailed, per-item plan to take the full Playwright suite from **54 failed / 3
flaky / 158 passed** back to green. Every root cause below is backed by
source-level evidence (file:line + the commit that caused the drift), not
inference from the error text. This is the companion to `TRIAGE.md` — that file
has the one-paragraph summary; this file has the how.

**Baseline caveat:** captured on a loaded dev machine (production build, 4
workers, 1 retry). A few items are load/timing artifacts that should pass on a
fresh CI runner; those are called out explicitly and sequenced last so they
don't block real fixes.

## The 54 failures at a glance

| Cluster                                                                  | Count  | Type                                            | Root cause in one line                                                                   |
| ------------------------------------------------------------------------ | ------ | ----------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Learn page (`learn-nice-view` 9, `learn-persona-path` 10)                | 19     | Stale tests + 1 confirm-intent (4.3)            | `/learn` was redesigned; old page moved to `/learn/legacy`. Tests target the old DOM.    |
| S/MIME workshop (`cms-workshop-crypto` 12, `cms-hsm-sign` 1)             | 13     | Stale tests                                     | `<select>` → `FilterDropdown` combobox refactor; tests still look for `<select>`.        |
| Workshop autostart (`workshop-autostart`)                                | 5      | **Real product bug** (reproduced)               | Race condition drops `?persona=` from the URL; everyone gets the Executive workshop.     |
| SSH simulator (`ssh-pqc-simulator`)                                      | 3      | Stale tests                                     | Renamed text, wrong asserted link, tool hidden from default grid.                        |
| Algorithms (`algorithms-persona` 2, `algorithms-ux-improvements` 1)      | 3      | Stale tests (1 is a test bug)                   | Tab default + button text changed; entry-strip test wipes its own state.                 |
| Simulation (`sim-report-embed`, `sim-planning-badges`, `sim-start-over`) | 3      | Load artifact (root cause _likely_, not proven) | Service-worker precache storm probably blocks `networkidle` on `/simulation`.            |
| Library (`library-cswp39` 2, `library` 1)                                | 3      | Stale tests + data drift                        | Deep links removed in legacy retire; corpus count legitimately shrank.                   |
| Compliance (`compliance-focus-view`)                                     | 2      | Confirm-intent (4.1)                            | "Focus view" absent after the `/compliance` pillar-pipeline rebuild (intent unverified). |
| VPN diagnostic (`_vpn-diagnostic`)                                       | 1      | Load artifact                                   | Outer mount-wait timeout not bumped in the 06-25 SLOW-WASM pass.                         |
| PKI enrollment (`pki-enrollment-protocols`)                              | 1      | Load artifact                                   | In-browser WASM CA gen exceeds 30s under load. Not broken.                               |
| **Total**                                                                | **54** |                                                 |                                                                                          |

Plus **3 flaky** (passed on retry): `sim-verify-close` ×2, `sim-planning-badges:103` — same service-worker cause as the Simulation cluster; fixed by the same change.

**Bottom line:** **1 confirmed user bug** (the deep-link race — the only failure
actually reproduced live in a browser), ~46 stale/drifted tests, ~5 load/timing
artifacts (nothing broken), and **3 that need a product-intent decision** (0.2,
4.1, 4.2 — features absent from a redesign, where I have no evidence the removal
was accidental vs. deliberate).

> **Read this before trusting the "stale test" counts.** This plan was built from
> six parallel source investigations plus two partial live reproductions. For the
> ~46 "stale test" items, the agents proved the **old** selectors are gone — they
> mostly did **not** drive the **new** feature end-to-end to prove it's healthy.
> So "the feature works, only the test is stale" is a well-founded assumption, not
> a verified fact. Where a fix is a rewrite (Phase 3), verify the replacement page
> actually works **before** rewriting the test against it — if it has its own
> runtime bug, that's a separate real defect and the effort estimate is void.

---

## Phase 0 — Confirmed user bug (do first)

The one failure where a user demonstrably hits a real defect, independent of any
test — and the only one reproduced live rather than reasoned from source.
(What was originally listed here as 0.2, "Show me everything," has moved to Phase 4
as 4.3 — on reflection I can't tell whether that feature's absence is a bug or a
deliberate cut, which is the same question 4.1/4.2 raise.)

### 0.1 — `?persona=` deep links silently drop the persona (race condition)

- **Symptom:** a URL combining `?persona=X` with the workshop-video autostart
  params resolves to the wrong workshop — architect/developer/ops/researcher all
  land on "Executive PQC Workshop — Finance", curious lands on the generic
  overview. Live-reproduced in a real browser.
- **Root cause:** two hooks read `?persona=` and fight.
  - `src/hooks/useUrlPersonaOverride.ts:28-48` (mounted in `App.tsx:199`) reads
    the param, applies it, then **strips `persona` from the URL** via
    `setSearchParams(next, { replace: true })` (lines 42-44).
  - `src/hooks/useWorkshopUrlAutostart.ts:21-67` (mounted in `MainLayout.tsx:73`,
    a descendant) also reads it, but its effect dependency array includes the
    live `params` object (line 66). The sibling's URL rewrite gives `params` a
    new identity → this effect re-runs → cancels its in-flight (correct)
    resolution (lines 63-65) → recomputes `persona = params.get('persona') ??
'executive'` (line 39), but `persona` is now gone from the URL, so it
    defaults to `'executive'`. `proficiency`/`region` are untouched, which is why
    the failure signature is "persona wrong, everything else right."
- **Fix (choose one):**
  - **(A, preferred)** In `useWorkshopUrlAutostart.ts`, stop depending on the
    live `params` object. Read the needed params once (into a ref, or gate on the
    existing `fired` guard) so the sibling's URL rewrite can't retrigger the
    effect.
  - **(B, alternative)** In `useUrlPersonaOverride.ts`, skip stripping `persona`
    when the workshop-autostart params (`workshop=video`) are also present.
  - Prefer (A) — it fixes the consuming hook's own fragility rather than making
    one feature aware of another.
- **⚠ The fix is subtle — do not treat it as trivial.** Fixing a race by editing
  effect dependencies can trade one race for another. A one-shot ref capture
  freezes ALL params, so a _legitimate_ later change to `region`/`proficiency`
  (e.g. via in-app navigation, not just this deep-link) would no longer
  re-resolve the workshop. The implementer must reason about every param the
  effect consumes and confirm which ones _should_ still retrigger it — not just
  make the persona symptom go away. Prescribed here from a second-hand read of
  the hooks; treat the specific approach as a starting point, not a spec.
- **Files:** `src/hooks/useWorkshopUrlAutostart.ts` (or `useUrlPersonaOverride.ts`).
- **Verify:** `E2E_SERVER=dev npx playwright test --project=chromium e2e/workshop-autostart.spec.ts` → all 5 green. Manually load `/?workshop=video&autoplay=1&persona=developer&proficiency=basics&region=US` and confirm the Developer workshop opens. **Also** manually confirm a mid-session change to region/proficiency still re-resolves (guard against the ref-capture regression above).
- **Effort:** S–M (few lines, but the reasoning is the work). **Risk:** Medium
  (race-condition edit). **Type:** app code.

---

## Phase 1 — Highest-leverage test fix (13 tests, one root cause)

### 1.1 — CMS workshop: drive `FilterDropdown`, not `<select>`

- **Symptom:** 12 `cms-workshop-crypto` + 1 `cms-hsm-sign` tests time out waiting
  for a `<select>` that no longer exists. One (`DualSignDemo`, "D1") hangs the
  full **360s** test budget — the single worst failure in the run.
- **Root cause:** commit `88fd4a77` (2026-05-19) replaced the native `<select>`
  in `MLDSASignDemo.tsx`, `MLKEMEncryptDemo.tsx`, and `DualSignDemo.tsx` with the
  shared `FilterDropdown` combobox (`src/components/common/FilterDropdown.tsx`).
  It renders `<button data-testid="filter-dropdown" aria-haspopup="listbox">`
  plus a `createPortal`-ed `<div role="listbox"><button role="option">…` on
  `document.body` — no `<select>` anywhere. The specs (authored `2026-05-17`,
  two days before the refactor) still call `demo.locator('select')` at
  `cms-workshop-crypto.spec.ts:193, 239, 273` and `cms-hsm-sign.spec.ts:331-334`.
  **This is not a timeout issue** — no timeout bump fixes a zero-match locator.
  (Confirmed WASM is fine: `openssl.wasm` is present and the `S0` smoke test,
  which uses no `select`, passes.)
- **The 360s hang specifically:** `playwright.config.ts:57` sets
  `actionTimeout: 0` (unbounded), and `runDualDemo()`
  (`cms-workshop-crypto.spec.ts:273-276`) calls `.selectOption()` with **no**
  preceding `toBeVisible()` guard (unlike the sign/kem helpers, which cap at
  15s). So D1 retries until its own `test.setTimeout` (360000ms) expires.
- **Fix (test-only):** update the ~4 helper functions in both specs to (a) click
  the demo's `FilterDropdown` trigger — scope with the demo container +
  `getByTestId('filter-dropdown')`, `.nth(i)` for multi-dropdown demos — then (b)
  click the matching `role="option"` in the portaled listbox. **Add a
  `toBeVisible({ timeout: 15_000 })` guard in `runDualDemo` before interacting**
  so a future break fails in 15s, not 6 minutes.
- **Files:** `e2e/cms-workshop-crypto.spec.ts`, `e2e/cms-hsm-sign.spec.ts`. No app
  changes.
- **Verify:** `E2E_SERVER=dev npx playwright test --project=chromium e2e/cms-workshop-crypto.spec.ts e2e/cms-hsm-sign.spec.ts` → all green; confirm D1 now fails-or-passes within ~15s if the dropdown is ever missing, not 360s.
- **Effort:** M (~half a day — several helpers, but mechanical). **Risk:** Low.
  **Type:** test-only.

---

## Phase 2 — Scattered small test fixes (each independent, minutes each)

Batch these; order doesn't matter. All test-only unless noted.

### 2.1 — Simulation: stop waiting on `networkidle` (3 hard + 3 flaky)

- **Root cause (LIKELY, not proven):** the leading hypothesis is the PWA service
  worker — `src/main.tsx:97-119` registers it unconditionally; `vite.config.ts:56-76`
  `VitePWA` precaches `globPatterns: ['**/*.{js,css,html,svg,png,wasm,json}']` up
  to 48MB each = **~3,309 entries / ~1.4GB** on first load (`dist/sw.js`). The
  theory: the specs `goto('/report', networkidle)` first (wins the idle race
  before the storm ramps), poll ~30s, then `goto('/simulation', networkidle)`
  never goes idle within 45s while the SW is still fetching. `/simulation` itself
  has **no** polling loop (verified in source). **Caveats I did NOT close:** (a)
  nobody disabled the SW and re-ran to confirm it's actually the cause; (b) three
  of these were _flaky_ (passed on retry), which a purely deterministic storm
  doesn't cleanly explain — points somewhat toward ordinary timing jitter. One
  corroborating data point: `e2e/vpn-rust-module.spec.ts:22-23` already
  unregisters service workers in setup, so SWs have caused test trouble here
  before. Net: the diagnosis is plausible and partly corroborated, not confirmed.
  **The fix below is correct regardless of which of these is the true cause** —
  it removes the dependency on `networkidle` entirely.
- **Fix (test-only):** in `sim-report-embed.spec.ts:85`,
  `sim-planning-badges.spec.ts:94` (and `:103`), `sim-start-over.spec.ts`,
  `sim-verify-close.spec.ts` (both) — change the `/simulation` (and `/report`)
  `goto` from `{ waitUntil: 'networkidle' }` to `{ waitUntil: 'domcontentloaded' }`
  and rely on the `getByRole('button', { name: /End Quarter/i })` assertion these
  specs already make right after.
- **Verify:** run the 4 sim specs; all green, no 45s stalls.
- **Effort:** S (~30 min). **Risk:** Low. **Type:** test-only.
- **Possible app-side follow-up (investigate first, don't assume):** _IF_ the SW
  root cause is confirmed, the ~1.4GB first-load precache may also affect real
  first-time visitors — worth measuring (does a cold real-browser first visit
  actually pull ~1.4GB, or does the SW precache lazily/off the critical path?).
  This is a hypothesis to check, not a confirmed user-facing defect. If confirmed
  and product cares: scope `globPatterns` to the app shell and runtime-cache the
  multi-MB WASM/ONNX chunks on first use. Effort M (~2-4h), higher risk.

### 2.2 — Algorithms: two renames + one test bug (3)

- **Executive default tab** `detailed` → `transition`
  (`src/data/personaConfig.ts:149-156`, commit `15f7f95c`). Update
  `algorithms-persona.spec.ts` expected tab/hint to `transition`. Effort: ~5 min.
- **"More filters" → "Filters"** (`AlgorithmFilters.tsx:264-273`, commit
  `ff3f309a`). Update the spec's button regex to `/^Filters$/i` (or add an
  `aria-label` to the button in the component for a stabler hook). Effort: ~5 min.
- **Entry-strip test bug (not app drift):**
  `algorithms-ux-improvements.spec.ts:115-118` calls `page.addInitScript(... sessionStorage.removeItem('algorithms-entry-strip-dismissed'))`, which Playwright
  re-runs on **every** navigation including the `page.reload()` at line 136 — so
  the test wipes the dismissal flag right before asserting it persisted
  (`AlgorithmEntryStrip.tsx:80-96` is correct). Fix: seed the flag once via
  `page.evaluate` after reload instead of `addInitScript`, or make the init
  script idempotent. Effort: ~10 min.
- **Files:** the 2 algorithms specs (+ optional `AlgorithmFilters.tsx` aria-label).

### 2.3 — SSH simulator: three stale assertions (3)

- **Comparison text** `Classical (ed25519 + curve25519)` →
  `Classical (ecdsa-nistp256 + curve25519)` (`SshComparisonPanel.tsx:252`, commit
  `87042141` — the unit test was updated then, the e2e spec wasn't). Update
  `ssh-pqc-simulator.spec.ts:42`. Trivial.
- **Wrong asserted link:** the test expects `/learn/network-security-pqc` but the
  app correctly links to `/learn/vpn-ssh-pqc` (`workshopRegistry.tsx:277`,
  `SshSimulationPanel.tsx:230`) — both routes exist; the SSH tool should point at
  the SSH module. The **test** asserts the wrong module. Update the expected
  href. Trivial.
- **Not in the default grid:** `page.goto('/playground')` (no `?cat=`) lands on
  the Overview tab (`PlaygroundWorkshop.tsx:829-835`), which shows only
  beginner-difficulty tools (`:984-985`); `pqc-ssh-sim` is `advanced`
  (`workshopRegistry.tsx:291`). Change the test to
  `goto('/playground?cat=Protocol%20Simulations')` (same pattern the sandbox spec
  already uses). Trivial.
- **Files:** `e2e/ssh-pqc-simulator.spec.ts`.

### 2.4 — Library: corpus-count threshold is stale (1)

- **Root cause:** `libraryData.ts:337-338` drops `status !== 'active'` rows; the
  active-doc count has legitimately shrunk as the enrichment pipeline tags more
  history `deprecated` (805 on 06-02 → 744 → 687 → **691 today**).
  `library.spec.ts:87-88` still asserts `FULL_CORPUS_FLOOR = 800`.
- **Fix (test-only):** either lower the floor/ceiling to a safe margin (e.g.
  600/700) or, better, compute it dynamically from the loaded `libraryData`
  length so it self-adjusts as the corpus changes.
- **Files:** `e2e/library.spec.ts`. **Effort:** ~10 min.

### 2.5 — Sandbox: assert the new "hidden" wording (1)

- **Root cause:** commit `ee6651aa` (Crypto Lab redesign) changed offline
  behavior to **strip** sandbox tools from category grids
  (`PlaygroundWorkshop.tsx:906-907`) and replaced the inline "Docker scenarios
  locked" card with an `"Off · N Docker scenarios hidden"` hint (`:692`). The
  exact old string no longer exists.
- **Fix (test-only):** update `playground-sandbox.spec.ts:63` assertions to the
  new stripped-grid + "hidden" wording.
- **Files:** `e2e/playground-sandbox.spec.ts`. **Effort:** S (~15 lines).

### 2.6 — VPN diagnostic: bump the one missed timeout (1)

- **Root cause:** the 06-25 SLOW-WASM pass bumped `_vpn-diagnostic`'s inner
  handshake waits (90→120s) but missed the **outer 15s** mount wait for the
  "Start Daemon" button on the ~4000-line `VpnSimulationPanel.tsx`. (Filename
  underscore is not a Playwright ignore convention — this is real, valuable
  WASM coverage per `TRIAGE.md`.)
- **Fix (test-only):** raise that one `toBeVisible({ timeout })` to match the
  other SLOW-WASM bumps.
- **Files:** `e2e/_vpn-diagnostic.spec.ts`. **Effort:** trivial.

---

## Phase 3 — The big rewrite (19 tests; needs real work, not one-liners)

### 3.1 — Learn: rewrite both specs against the redesigned page

- **Root cause:** commit `2add4c82` (2026-06-21) made `/learn` render
  `<LearnRedesignView>` (via `PKILearningView.tsx`); the old `<Dashboard>` these
  tests assert against now lives only at `/learn/legacy`. Every failing selector
  is old-page-only:
  - `h1 "Learning Workshops"` (`Dashboard.tsx:1058`) → new `h1` is "Learn" from
    `PageHeader` (`LearnRedesignView.tsx:102-106`).
  - `"Browse all N modules (M tracks)"` `<details>` (`Dashboard.tsx:1397`) → new
    mode-toggle `<button>` "Browse all {N}" (`LearnRedesignView.tsx:187-198`).
  - `"NICE roles"` toggle (`LearnViewToggle.tsx:78`) → renamed "Workforce view"
    (`BrowseAllView.tsx:147-161`).
  - `"Stack"/"Cards"` radios (`LearnViewToggle.tsx:27-28`) → no equivalent in the
    new tree. **Combined with `actionTimeout: 0`, `.click()` on these zero-match
    locators hangs the full 180s test budget** (2 tests).
  - `section[aria-label="Your curated learning path"]` → renamed "…journey"
    (`PersonaPathView.tsx:90`).
  - Researcher taxonomy region (`ResearcherTaxonomyFilter.tsx:41`) only renders
    in Browse mode, but `/learn` opens on My Path.
- **STEP 0 — verify the new page actually works before writing a single
  assertion.** Drive the redesigned `/learn` by hand (all five personas, the
  Workforce/NICE view, the My-Path↔Browse switch). The agents proved the _old_
  DOM is gone; nobody confirmed the _new_ page is healthy. If it renders and
  functions, proceed. If any of it is itself broken, that is a **separate real
  bug** to file — do not paper over it by writing a test that asserts the broken
  state. This step is why the effort estimate below is a range, not a number.
- **Fix (test-only, but substantial):** rewrite `learn-nice-view.spec.ts` and
  `learn-persona-path.spec.ts` against `LearnRedesignView` / `MyPathView` /
  `BrowseAllView` — new headings, the "Workforce view" toggle, the My-Path-vs-
  Browse mode switch, the renamed section labels. The "Show me everything" test
  can only pass once the 4.3 decision resolves (wire the prop, or delete/rewrite
  that assertion).
- **Stopgap if you need green sooner:** point these specs' `page.goto('/learn')`
  at `/learn/legacy` (the old page still exists there) — small, but tests the
  deprecated page, so only a bridge until the real rewrite.
- **Files:** `e2e/learn-nice-view.spec.ts`, `e2e/learn-persona-path.spec.ts`.
- **Effort:** M (~0.5-1 day) **IF the new page is healthy** — unverified, so
  treat as a floor, not a ceiling. **Risk:** Low (test-only). **Type:** test rewrite.
- **Do after Phases 0-2** — largest single effort; the "Show me everything"
  subset depends on the 4.3 decision.

---

## Phase 4 — Product-intent decisions (don't fix blind)

These test features that are **absent from a redesign**. The trap: "just delete
the test" hides a real regression if the removal was _collateral_ rather than
_intended_. So the first move on each is the same — **confirm with the redesign
owner whether the feature was meant to go.** Only then: restore it, or delete/
quarantine the test with a dated reason. I did **not** establish intent for any
of these three; the agents established the feature is _gone_, not _why_.

### 4.1 — Compliance "Focus view" (2)

- Commit `9e44eb8d` (2026-06-20) rebuilt `/compliance` around a 3-pillar pipeline;
  `ComplianceView.tsx:864-873` now renders `<PillarPipeline>` instead of
  `<LandscapeTab>`, which held the "Focus view" master-detail toggle
  (`LandscapeTab.tsx:107-122`). `LandscapeTab.tsx` / `FrameworkFocusView.tsx` are
  now dead code. **Decision:** confirm intent → reintroduce an equivalent
  focus/detail affordance in `PillarPipeline`, or quarantine/delete
  `compliance-focus-view.spec.ts`. Quarantine ~30 min; restore is larger.

### 4.2 — Library CSWP-39 deep links (2)

- Commit `13a35844` (2026-06-24, "retire /legacy page trees") deleted the legacy
  `DocumentCard` that carried the CSWP-39 pillar-pill and the
  `/compliance?tab=cswp39&evref=` deep link. The data moved into
  `LibraryDetailDrawer.tsx:268` ("CSWP-39 requirements"), reachable only by
  opening the drawer, with no business/compliance deep links. **Decision:**
  confirm intent → add the pillar-pill / evref links into the drawer, or
  quarantine/delete `library-cswp39.spec.ts`. Quarantine ~10 min; restore ~1-2h.

### 4.3 — Learn "Show me everything (advanced)" unreachable (part of the Learn cluster)

- _(Was 0.1's sibling "0.2" in the first draft — reclassified here because it's
  the same question as 4.1/4.2, and I over-called it a definite bug.)_
  `PersonaPathView.tsx:196-198` gates the "show the full catalog" button on an
  `onShowEverything` prop that the new-page parent `MyPathView.tsx:297-307` never
  passes. So on the redesigned `/learn`, no persona can reach it. **But I don't
  know if that escape hatch was _meant_ to survive the redesign** — the new IA
  opens everyone on "My Path" with a separate "Browse all" mode, which may have
  been the intended replacement, making the old button redundant-by-design.
  **Decision:** confirm intent → if it should exist, wire `onShowEverything`
  through `MyPathView` (small app change; then verify a mid-session persona
  change still behaves); if the "Browse all" mode is the intended replacement,
  rewrite the test to assert _that_ path instead. Either resolves the
  `learn-persona-path` "Show me everything" assertion in Phase 3.

---

## Phase 5 — Leave alone (genuinely load/env, not broken)

### 5.1 — PKI enrollment (1)

- `pki-enrollment-protocols.spec.ts:81` — the "openssl x509 -text" step runs
  through the in-browser `openssl.wasm` (`CmpInitialReq.tsx:122`,
  `v2p7CertProvisioner.ts:14`), **not** a CLI binary. All selectors match current
  source. `TRIAGE.md` already flags it LOAD/FLAKY: WASM cold-load + ML-DSA-65 CA
  generation can exceed 30s under load. **Action:** re-run on an unloaded CI
  runner; bump the timeout only if still red there. Do not "fix" — nothing is
  broken.

---

## Suggested execution order & sizing

| Phase | Items         | Fixes                       | Type                                        | Effort                          |
| ----- | ------------- | --------------------------- | ------------------------------------------- | ------------------------------- |
| **0** | 0.1           | 5                           | **app (confirmed bug)**                     | S–M                             |
| **1** | 1.1           | 13                          | test-only                                   | M (~½ day)                      |
| **2** | 2.1–2.6       | 3+3+3+1+1+1 = 12 (+3 flaky) | test-only                                   | S each; ~½ day total            |
| **3** | 3.1           | 19                          | test rewrite (after verifying the new page) | M+ (≥½–1 day, unverified floor) |
| **4** | 4.1, 4.2, 4.3 | 6                           | **product-intent decision**                 | varies                          |
| **5** | 5.1           | 1                           | none (re-baseline)                          | —                               |

**Recommended sequence:** 0 → 1 → 2 → 3, then bring 4 to whoever owns those pages,
and re-baseline 5 on CI. Phases 0-3 clear ~50 of 54 — but only Phase 1's 13 and
Phase 2's copy/route fixes are truly "well-understood, low-risk." Phase 0 is one
subtle race-condition edit, and Phase 3's estimate is a floor conditioned on the
new page being healthy (unverified).

## Definition of done

- Phases 0-3 committed; the affected specs pass locally against a **production
  build** (`npm run test:e2e`, not dev — the SLOW-WASM/precache behavior only
  reproduces on the build).
- Phase 0's app fix has a manual-repro note in the PR (the deep-link URL that
  used to misroute) **and** a note confirming a mid-session region/proficiency
  change still re-resolves (the ref-capture regression guard).
- Phase 3 records whether the new `/learn` was verified healthy before the
  rewrite; any runtime issue found is filed as its own bug, not absorbed.
- Phase 4 items are either fixed or quarantined with a **dated `test.skip`
  reason** pointing at the removing commit — never left as an ambiguous red —
  and only after intent is confirmed.
- `TRIAGE.md` updated so the next person sees which of these are done.

> **On `actionTimeout: 0`:** an earlier draft recommended setting it non-zero so
> zero-match `.click()`s fail fast (they're why Learn ×2 and CMS D1 each ate a
> multi-minute budget). **Retracted** — it's deliberate. The ~27 SLOW-WASM specs
> rely on the unbounded action window for `.click()`s on elements that only
> appear after 60–120s WASM handshakes; a global cap would destabilize them to
> fix three. The right fix is **targeted visibility guards before slow clicks**
> (already prescribed in 1.1 for D1), not a global config change.

## Why these keep rotting (the actual root cause behind the 54)

Fixing all 54 makes the suite green today; it does nothing to stop the next
redesign from turning it red again. The pattern behind ~46 of these is
structural, not incidental:

1. **Tests assert exact copy and DOM structure** ("Learning Workshops", "More
   filters", `Classical (ed25519 + curve25519)`, `<select>`, `<details>`). Any
   redesign that touches wording or markup breaks them even when the feature is
   fine. Prefer stable `data-testid` / `aria-label` hooks and role-based queries
   over literal text where the text is incidental to what's being verified.
2. **Redesigns land without updating or quarantining their own specs.** Every
   cluster here traces to a dated redesign commit whose PR left the matching
   e2e spec untouched. The durable fix is a team rule: _a PR that redesigns a
   surface must update or `test.skip`-with-reason its specs in the same PR_ —
   enforced by making the full suite a required (even if non-blocking-visible)
   signal owners are expected to keep green, not a nightly nobody reads.
3. **The full suite isn't gated**, so drift accumulates silently between the
   quarterly triage passes (this is the second — see `TRIAGE.md` for the first).
   Consider promoting a handful of the highest-value, fastest specs into the
   `smoke` gate once green, so at least the critical paths can't silently rot.

Without (1) and (2), a third triage pass in ~3 months is the realistic
expectation. Worth asking, before investing the ~2 days Phases 1-3 cost, which
of these brittle copy-assertion tests are even worth keeping versus deleting
outright.
