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
    actionTimeout: 0,
    trace: 'on-first-retry',
    baseURL: BASE_URL,
  },
  projects: [
    // Full suite — every spec. Runs nightly (.github/workflows/e2e-nightly.yml)
    // and locally via `npm run test:e2e`.
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
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
  ],
  webServer: {
    command: serverCommand,
    port: PORT,
    reuseExistingServer: !process.env.CI,
    // preview serves an existing build instantly; allow room for boot + WASM warmup.
    timeout: 120_000,
  },
})
