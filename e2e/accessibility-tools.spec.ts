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
 */
import { test } from '@playwright/test'
import { injectAxe, checkA11y } from 'axe-playwright'

test.use({ reducedMotion: 'reduce' })

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
]

/** Crypto Lab tools that need no engine — safe to scan. */
const COMPUTE_ONLY_LAB_TOOLS = [
  { path: '/playground/cert-capacity', name: 'Cert Capacity Calculator' },
  { path: '/playground/hsm-capacity', name: 'HSM Capacity Calculator' },
  { path: '/playground/qrng-demo', name: 'QRNG Demo' },
  { path: '/playground/source-combining', name: 'Source Combining' },
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
