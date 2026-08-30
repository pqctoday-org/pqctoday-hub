// SPDX-License-Identifier: GPL-3.0-only
/**
 * WS9 — axe coverage for the TOOL tier.
 *
 * `e2e/accessibility.spec.ts` scans 14 page routes and deliberately excludes
 * `/playground*` because those are WASM-heavy and a 60 s load races axe
 * injection. The consequence, though, was that **none** of the 71 graded tool
 * items had any accessibility evidence at all — which is why the audit's
 * `a11y` scores for that whole tier were a factory default nobody measured, and
 * why the WS0 rubric had to list "descope a11y" as the honest option.
 *
 * This file closes that gap where it can be closed honestly:
 *
 *   - All /business/tools/* routes sampled below are plain React forms with no
 *     WASM, so they scan as reliably as any page route.
 *   - The /playground/* routes sampled below are the compute-only tools
 *     (calculators, entropy demos) — no engine download, no SharedArrayBuffer.
 *
 * NOT covered, on purpose: the WASM labs (OpenSSL Studio, HSM, TPM, CACP, the
 * VPN/SSH simulators). Their load time makes an axe scan a coin flip, and a
 * flaky a11y test is worse than an absent one — it teaches people to ignore
 * red. Those remain a manual-review item.
 *
 * Tiering: this file is NOT in `SMOKE_SPECS`, so it runs in the nightly full
 * suite rather than the PR gate. That follows the repo's existing rule — only
 * fast, reliably-green specs gate a PR.
 *
 * WS14 (2026-08-21) extends it two ways, without weakening the exclusion above:
 *
 *   - three more `ArtifactBuilder`-backed business tools and one more pure-JS
 *     lab tool (`hd-wallet`: @scure/@noble, no WASM engine, no SharedArrayBuffer)
 *     join the full-page scan lists;
 *   - a NEW block below scans the VPN/SSH simulators — but ONLY the individual
 *     scrollable visualisation containers, with a single axe rule, never the
 *     whole WASM page. That is what makes it safe to look at an excluded tool:
 *     the flakiness the exclusion avoids comes from full-page scans racing the
 *     engine load, not from asserting on one already-rendered `<div>`.
 */
import { test, expect } from '@playwright/test'
import { injectAxe, checkA11y } from 'axe-playwright'

test.use({ reducedMotion: 'reduce' })

/**
 * The `test.use({ reducedMotion })` above was not reaching the page: measured
 * 2026-08-21 against the production build, `matchMedia('(prefers-reduced-motion:
 * reduce)').matches` was **false** inside every test in this file, from the first
 * evaluate after `goto`. The app's own reduced-motion rule (`styles/index.css`,
 * "Respect user's reduced-motion preference", `animation-duration: 0.01ms
 * !important`) therefore never applied, `animate-fade-in` ran at full length, and
 * axe sampled elements at ~73 % opacity — reporting 14 `color-contrast` failures
 * on pages whose settled colours measure clean. That is the exact "7 flaky a11y
 * specs that pass on retry" pattern CLAUDE.md documents: a retry warms the cache,
 * the fade finishes sooner, and the same page reports zero violations.
 *
 * `page.emulateMedia()` is the direct API and does take effect, so call it
 * explicitly rather than trusting the fixture. This makes the file deterministic
 * without weakening any assertion — axe now measures the settled colours a user
 * actually sees, which is what the WCAG contrast rule is about.
 */
test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
})

const A11Y_OPTIONS = {
  axeOptions: {
    runOnly: { type: 'tag' as const, values: ['wcag2a', 'wcag2aa'] },
  },
  includedImpacts: ['critical', 'serious'] as ('critical' | 'serious')[],
}

/**
 * Business tools — one per pillar, so a systemic violation in the shared
 * standalone-tool shell surfaces without scanning all 37.
 */
const BUSINESS_TOOLS = [
  { path: '/business/tools/roi-calculator', name: 'ROI Calculator' },
  { path: '/business/tools/board-pitch', name: 'Board Pitch Builder' },
  { path: '/business/tools/compliance-checklist', name: 'Compliance Checklist' },
  { path: '/business/tools/raci-builder', name: 'RACI Builder' },
  { path: '/business/tools/risk-register', name: 'Risk Register Builder' },
  { path: '/business/tools/roadmap-builder', name: 'Roadmap Builder' },
  // WS14: three more `ArtifactBuilder` consumers. The original 6 only reach that
  // shared renderer through `board-pitch` / `compliance-checklist`, so these
  // regression-guard the WS9-era `controlId`/`htmlFor`/`id` fix (and the
  // `FilterDropdown` label pass-through) on tools it never covered.
  { path: '/business/tools/contract-clause', name: 'Contract Clause Generator' },
  { path: '/business/tools/policy-generator', name: 'Policy Template Generator' },
  { path: '/business/tools/hybrid-transition-planner', name: 'Hybrid Transition Planner' },
  // Wave D (2026-08-29): the remaining 28 of 37. Confirmed zero WASM/
  // SharedArrayBuffer signal anywhere under src/components/BusinessCenter —
  // every business tool is a plain React form, same safety class as the 9
  // above, so the exclusion this file documents never applied to this tier.
  { path: '/business/tools/breach-simulator', name: 'Breach Scenario Simulator' },
  { path: '/business/tools/cost-of-inaction', name: 'Cost of Inaction Analyzer' },
  { path: '/business/tools/cost-model-explorer', name: 'Cost Model Explorer' },
  { path: '/business/tools/crqc-scenario', name: 'CRQC Scenario Planner' },
  { path: '/business/tools/risk-treatment-plan', name: 'Risk Heatmap & Treatment Plan' },
  { path: '/business/tools/audit-checklist', name: 'Audit Readiness Checklist' },
  { path: '/business/tools/compliance-timeline', name: 'Compliance Timeline Builder' },
  { path: '/business/tools/kpi-dashboard', name: 'KPI Dashboard Builder' },
  { path: '/business/tools/vendor-scorecard', name: 'Vendor Scorecard Builder' },
  { path: '/business/tools/supply-chain-matrix', name: 'Supply Chain Risk Matrix' },
  { path: '/business/tools/stakeholder-comms', name: 'Stakeholder Comms Planner' },
  { path: '/business/tools/kpi-tracker', name: 'KPI Tracker Template' },
  { path: '/business/tools/deployment-playbook', name: 'Deployment Playbook' },
  { path: '/business/tools/mti-negotiator', name: 'MTI Negotiator' },
  { path: '/business/tools/crypto-api-refactor-audit', name: 'Crypto API Refactor Audit' },
  { path: '/business/tools/cloud-responsibility-matrix', name: 'Cloud Responsibility Matrix' },
  { path: '/business/tools/crypto-architecture-diagram', name: 'Crypto Architecture Diagram' },
  { path: '/business/tools/management-tools-audit', name: 'Management Tools Audit' },
  { path: '/business/tools/crypto-cbom-builder', name: 'Crypto BOM (CBOM) Builder' },
  { path: '/business/tools/crypto-vulnerability-watch', name: 'Crypto Vulnerability Watch' },
  { path: '/business/tools/program-charter', name: 'Program Charter' },
  { path: '/business/tools/initial-scoping', name: 'Initial Scoping Assessment' },
  { path: '/business/tools/skills-team-plan', name: 'Skills & Team Plan' },
  {
    path: '/business/tools/infra-modernization-planner',
    name: 'Infrastructure Modernization Planner',
  },
  { path: '/business/tools/refresh-cycle-alignment', name: 'Refresh-Cycle Alignment' },
  {
    path: '/business/tools/accelerated-execution-profile',
    name: 'Accelerated Execution Profile',
  },
  { path: '/business/tools/data-at-rest-strategy', name: 'Data-at-Rest Strategy' },
  { path: '/business/tools/migration-verification', name: 'Migration Verification & Closure' },
]

/** Crypto Lab tools that need no engine — safe to scan. */
const COMPUTE_ONLY_LAB_TOOLS = [
  { path: '/playground/cert-capacity', name: 'Cert Capacity Calculator' },
  { path: '/playground/hsm-capacity', name: 'HSM Capacity Calculator' },
  { path: '/playground/qrng-demo', name: 'QRNG Demo' },
  { path: '/playground/source-combining', name: 'Source Combining' },
  // WS14: `hd-wallet` routes to DigitalAssets/flows/HDWalletFlow, which is
  // @scure/@noble pure JS (BIP39/BIP32/PBKDF2) per CLAUDE.md's crypto-stack
  // layering — no engine download, no SharedArrayBuffer. Same safety class as
  // the four above, not a reclassification of a WASM-excluded tool.
  { path: '/playground/hd-wallet', name: 'HD Wallet Derivation' },
  // Wave D (2026-08-29): 8 more, individually verified pure-JS by tracing each
  // component's imports (not a blind sweep — 16 of the 24 remaining tools DO
  // pull in useHSM/@pqctoday/softhsm-wasm/liboqs and stay excluded). These 3
  // (rng-demo/entropy-test/drbg-demo) are Entropy-module siblings of the
  // already-covered qrng-demo/source-combining, consistent with that module
  // being pure-JS throughout.
  { path: '/playground/rng-demo', name: 'Random Generation' },
  { path: '/playground/entropy-test', name: 'Entropy Testing' },
  { path: '/playground/drbg-demo', name: 'SP 800-90A DRBG' },
  { path: '/playground/pki-enrollment', name: 'PKI Enrollment (EST + CMP)' },
  { path: '/playground/merkle-proof', name: 'Merkle Tree Workshop' },
  { path: '/playground/pki-workshop', name: 'PKI Workshop' },
  { path: '/playground/mls-group-messaging', name: 'MLS Group Messaging' },
  { path: '/playground/suci-flow', name: '5G SUCI Construction' },
]

/** The grid itself — the surface every tool is reached through. */
const GRIDS = [
  { path: '/business/tools', name: 'Command Center tool grid' },
  { path: '/playground', name: 'Crypto Lab grid' },
]

async function scan(page: import('@playwright/test').Page, path: string) {
  await page.goto(path)
  // Same stabilisation the page-level spec uses: wait for primary content, then
  // let the reduced-motion transition settle so axe never samples a mid-fade
  // frame as a contrast failure.
  await page.waitForSelector('h1, h2, [data-testid]', { timeout: 20_000 }).catch(() => undefined)
  await page.waitForTimeout(400)
  await injectAxe(page)
  await checkA11y(page, undefined, A11Y_OPTIONS)
}

for (const { path, name } of GRIDS) {
  test(`${name} (${path}) — no serious/critical a11y violations`, async ({ page }) => {
    await scan(page, path)
  })
}

for (const { path, name } of BUSINESS_TOOLS) {
  test(`business tool: ${name} — no serious/critical a11y violations`, async ({ page }) => {
    await scan(page, path)
  })
}

for (const { path, name } of COMPUTE_ONLY_LAB_TOOLS) {
  test(`lab tool: ${name} — no serious/critical a11y violations`, async ({ page }) => {
    await scan(page, path)
  })
}

/* ───────────────────────────────────────────────────────────────────────────
 * WS14 — scrollable-visualisation keyboard reachability (WASM tools).
 *
 * This block deliberately does NOT do what the exclusion above forbids. It never
 * calls `checkA11y(page)` on a WASM page; it runs ONE axe rule
 * (`scrollable-region-focusable`) scoped to ONE already-rendered container, and
 * it proves keyboard reachability by actually pressing Tab until focus lands on
 * that container. An added `tabIndex` nothing can reach is not a fix, so the Tab
 * traversal — not the attribute — is the assertion that matters.
 *
 * Measured baseline (2026-08-21, production build, Chrome UA, 1280/768/375):
 * none of the three containers reported a `scrollable-region-focusable`
 * violation *before* the fix either. Two of them (`vpn-wire-scroll`,
 * `ssh-wire-ladder`) never overflow — their content is `w-full` / `flex-1`
 * + `truncate`, so `overflow-*` never engages and the rule never matches. The
 * third (`vpn-handshake-diagram`) does overflow below ~480px, but already
 * contained four focusable `<button>`s, so axe passed it on `focusable-content`
 * — the same shape as `WireTreeView.tsx`, the doc's own contrast case. The
 * `tabIndex` additions are therefore a *defensive* fix (these regions are
 * declared scrollable and would become keyboard-dead the moment their content
 * grows), and these tests are the regression guard that keeps them reachable.
 * They are not evidence of violations removed — see the WS14 report.
 * ─────────────────────────────────────────────────────────────────────────── */

/** One axe rule, scoped to one container — never the whole WASM page. */
const SCROLL_RULE_OPTIONS = {
  axeOptions: { runOnly: { type: 'rule' as const, values: ['scrollable-region-focusable'] } },
}

/**
 * Press Tab from the top of the document until focus lands on `selector`.
 * Returns the number of presses, or -1 if never reached. `document.body` is
 * made momentarily focusable so Chrome's *sequential focus navigation starting
 * point* is genuinely reset to the top — blurring alone leaves it where it was
 * and would understate the traversal.
 */
async function tabUntilFocused(
  page: import('@playwright/test').Page,
  selector: string,
  maxPresses = 400
): Promise<number> {
  await page.evaluate(() => {
    document.body.setAttribute('tabindex', '-1')
    document.body.focus()
    document.body.removeAttribute('tabindex')
  })
  for (let i = 1; i <= maxPresses; i++) {
    await page.keyboard.press('Tab')
    const landed = await page.evaluate(
      (sel) => document.activeElement === document.querySelector(sel),
      selector
    )
    if (landed) return i
  }
  return -1
}

async function assertScrollRegionReachable(
  page: import('@playwright/test').Page,
  selector: string
) {
  const region = page.locator(selector).first()
  await expect(region).toBeVisible()
  // The fix itself: the container is in the tab order and carries a name.
  await expect(region).toHaveAttribute('tabindex', '0')
  await expect(region).toHaveAttribute('role', 'region')
  await expect(region).toHaveAttribute('aria-label', /\S/)

  await injectAxe(page)
  await checkA11y(page, selector, SCROLL_RULE_OPTIONS)

  const presses = await tabUntilFocused(page, selector)
  expect(presses, `Tab never reached ${selector} — the tabIndex is unreachable`).toBeGreaterThan(0)
  await expect(region).toBeFocused()
}

test.describe('WS14 — scrollable visualisations reachable by keyboard', () => {
  test.skip(
    ({ browserName }) => browserName !== 'chromium',
    'The VPN/SSH simulators are Chromium-gated (browserDetect.ts)'
  )

  test('vpn-sim: IKEv2 handshake diagram + wire visualisation are tab-reachable', async ({
    page,
  }) => {
    test.slow() // ~4000-line WASM-backed panel; mount alone can take seconds.
    await page.goto('/playground/vpn-sim')
    await page.waitForSelector('[data-testid="vpn-handshake-diagram"]', { timeout: 60_000 })
    await page.waitForTimeout(600)

    await assertScrollRegionReachable(page, '[data-testid="vpn-handshake-diagram"]')
    await assertScrollRegionReachable(page, '[data-testid="vpn-wire-scroll"]')
  })

  test('pqc-ssh-sim: wire packet ladder is tab-reachable', async ({ page }) => {
    // The ladder only exists once a handshake has produced wire packets, so this
    // one test does drive the live engine — same flow, same waits as the sibling
    // `ssh-pqc-simulator.spec.ts` live tests. It is the single heavy test here;
    // everything else in this file stays static.
    test.setTimeout(300_000)
    await page.goto('/playground/pqc-ssh-sim')
    const runBtn = page.getByRole('button', { name: /run.*handshake/i }).first()
    await expect(runBtn).toBeEnabled({ timeout: 30_000 })
    await runBtn.click()
    await expect(page.getByText(/Both handshakes complete/i).first()).toBeVisible({
      timeout: 180_000,
    })
    // WS7 (2026-08-21): the wire-packets toggle became a real ARIA tab when
    // ModuleTabBar/tabs.tsx adopted the APG pattern, so `role: 'button'` no
    // longer matches it.
    await page
      .getByRole('tab', { name: /wire packets/i })
      .first()
      .click()

    // Two ladders render (classical + PQC leg); `assertScrollRegionReachable`
    // asserts on the first and scopes the axe scan to both.
    await assertScrollRegionReachable(page, '[data-testid="ssh-wire-ladder"]')
  })
})
