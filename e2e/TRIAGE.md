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
