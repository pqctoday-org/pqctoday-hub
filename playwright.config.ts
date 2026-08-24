import { defineConfig, devices } from '@playwright/test'

// Port can be overridden via PLAYWRIGHT_DEV_PORT for parallel worktrees that
// can't all bind the default (see CLAUDE.md "Parallel sessions: use git worktrees").
// Default 4173 = vite preview's default port.
const PORT = parseInt(process.env.PLAYWRIGHT_DEV_PORT ?? '4173', 10)
const BASE_URL = `http://localhost:${PORT}`

// By DEFAULT the e2e suite runs against the PRODUCTION BUILD (`vite preview`):
// prerendered <title>s and build-generated data (OSCAL/CBOM/sitemap) match what
// actually ships, so specs are reliable. The old dev-server default produced
// false failures (empty document-title a11y violations, missing generated data).
//
// For fast local iteration on a single spec, set E2E_SERVER=dev to use the dev
// server (HMR, no build) — at the cost of those dev-only artifacts. CI always
// uses the build. A build must exist first (`npm run build`); the npm
// `test:e2e*` scripts do that via a pretest hook.
// SMOKE allowlist — critical-path specs verified green against the production
// build (2026-06-25). Fast, no heavy WASM/crypto (those run in the nightly full
// suite). Keep this list short and reliable; it is the PR gate.
const SMOKE_SPECS = [
  'basic.spec.ts', // routing + document title
  'accessibility.spec.ts', // every top-level page renders + no serious a11y violations
  'timeline-freshness-badge.spec.ts', // timeline page + data freshness
  'trust-tier-filter.spec.ts', // data filtering across views (library/migrate/compliance/threats/timeline)
  'compliance-foryou-executive.spec.ts', // compliance persona deep-link
  // ACVP Validation Suite (real WASM/liboqs crypto, all ~34 test categories
  // asserted zero-fail — see the spec's own comment on that assertion). Promoted
  // 2026-08-23: it was previously nightly-only, so a regression anywhere
  // outside the 2 categories the old narrow assertion checked could ship on
  // a PR undetected. Measured cost of promoting it is small — ~21s test
  // time that mostly overlaps idle worker time under CI's workers:2 (smoke
  // alone: 55.5s wall; smoke + this spec: 58.4s wall, workers=2, local
  // measurement 2026-08-23). Remove from this list only if it stops being
  // reliably fast/green in CI, and prefer fixing the flake first.
  'acvp-validator.spec.ts',
]
// Deliberately EXCLUDED from smoke (verified slow / load-sensitive — they hit the
// 45s timeout on a saturated machine, so they'd make the gate flaky): onboarding,
// resume-banner, sim-start-over, sim-assess-return, learn-pqc-candidates. They run
// in the nightly full suite. Promote one into smoke only after it proves reliably
// fast in CI.

const useDev = process.env.E2E_SERVER === 'dev' && !process.env.CI
const serverCommand = useDev
  ? `npm run dev -- --port ${PORT} --strictPort`
  : `npm run preview -- --port ${PORT} --strictPort`

export default defineConfig({
  testDir: './e2e',
  // Warm Vite's dep optimizer before specs run, so a cold dev server (or the
  // first run after the WASM bundles change) doesn't fail specs with a transient
  // "504 Outdated Optimize Dep" on the lazy-loaded Playground routes.
  globalSetup: './e2e/global-setup.ts',
  // WASM/crypto pages need headroom; individual heavy specs may still raise their own.
  timeout: 45 * 1000,
  expect: { timeout: 7500 },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  // A retry absorbs first-load WASM-warmup flakes without masking real failures.
  retries: process.env.CI ? 2 : 1,
  // WASM-heavy specs contend badly at high concurrency (the old `undefined` =
  // CPU-count default melted under ~9 workers). Bound the pool.
  workers: process.env.CI ? 2 : 4,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    // Bounded so a zero-match interaction fails fast instead of hanging for
    // the full test (was 0 = unbounded). 15s leaves headroom for ~2 stalled
    // actions plus assertion overhead inside the 45s global `timeout` below,
    // while still failing well short of it — chosen relative to `expect.timeout`
    // (7500ms) rather than picked arbitrarily.
    actionTimeout: 15_000,
    trace: 'on-first-retry',
    baseURL: BASE_URL,
  },
  projects: [
    // Full suite — every spec EXCEPT the local-only `*.local.spec.ts` tier
    // (directive 2026-07-01: new suites are local-only). Runs nightly
    // (.github/workflows/e2e-nightly.yml) and locally via `npm run test:e2e`.
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      testIgnore: ['**/*.local.spec.ts'],
    },
    // SMOKE tier — a fast, curated, reliably-green subset of critical user
    // journeys, gated on every PR (ci.yml). Membership is an explicit allowlist
    // (verified green against the production build) so the gate stays trustworthy;
    // add a spec here only once it passes reliably. Heavy WASM/crypto specs are
    // deliberately excluded — they run in the nightly full suite instead.
    {
      name: 'smoke',
      use: { ...devices['Desktop Chrome'] },
      testMatch: SMOKE_SPECS.map((f) => `**/${f}`),
    },
    // LOCAL tier — `*.local.spec.ts` only. Never runs in CI (both CI projects
    // above exclude it); run on the local gate via `npm run test:e2e:cacp-visual`
    // or `playwright test --project=local`.
    {
      name: 'local',
      use: { ...devices['Desktop Chrome'] },
      testMatch: ['**/*.local.spec.ts'],
    },
    // MOBILE-SMOKE tier — NEW (2026-08-02), NOT yet CI-gated. Runs the same
    // SMOKE_SPECS allowlist as `smoke` above, but at an iPhone 14 viewport —
    // this product had literally zero mobile-viewport E2E coverage despite
    // mobile being its worst-scoring UX dimension. Run locally via
    // `npx playwright test --project=mobile-smoke` (build first, e.g.
    // `npm run build`). Deliberately NOT added to `ci.yml`'s PR gate yet —
    // that's a separate decision about CI time/cost budget; wire it in only
    // after that's explicitly decided.
    {
      name: 'mobile-smoke',
      use: { ...devices['iPhone 14'] },
      testMatch: SMOKE_SPECS.map((f) => `**/${f}`),
    },
  ],
  webServer: {
    command: serverCommand,
    port: PORT,
    reuseExistingServer: !process.env.CI,
    // preview serves an existing build instantly; allow room for boot + WASM warmup.
    timeout: 120_000,
  },
})
