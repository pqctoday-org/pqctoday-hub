// SPDX-License-Identifier: AGPL-3.0-only
import { test, expect } from './fixtures/blockAnalytics'
import { injectAxe, checkA11y } from 'axe-playwright'
import { TOOL_ROUTE_META } from '../src/seo/toolRouteMeta.generated'

const MOBILE_HOTSPOTS = [
  '/playground',
  '/playground/cacp',
  '/playground/cert-capacity',
  '/playground/firmware-signing',
  '/playground/lms-hss',
  '/playground/mls-group-messaging',
  '/playground/pki-workshop',
  '/playground/pqc-ssh-sim',
  '/playground/suci-flow',
  '/playground/tpm-playground',
  '/playground/vpn-sim',
  '/playground/bitcoin-flow',
  '/playground/solana-flow',
]

const BROWSER_TOOL_ROUTES = TOOL_ROUTE_META.filter((route) => route.kind === 'browser-tool')
const SPECIAL_BROWSER_ROUTES = ['/playground/interactive', '/playground/hsm', '/playground/cacp']
const RESPONSIVE_WIDTHS = [
  { label: '320px phone', width: 320, height: 800 },
  { label: '768px tablet', width: 768, height: 1024 },
  {
    label: '200% zoom equivalent',
    width: 720,
    height: 500,
  },
] as const

function personaState(persona: string) {
  return JSON.stringify({
    state: { selectedPersona: persona, hasAcknowledgedExecutiveGrcSplit: true },
    version: 8,
  })
}

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.addInitScript(() => {
    localStorage.setItem(
      'pqc-disclaimer-storage',
      JSON.stringify({ state: { acknowledgedMajorVersion: 99 }, version: 0 })
    )
    localStorage.setItem(
      'pqc-version-storage',
      JSON.stringify({ state: { lastSeenVersion: '99.0.0' }, version: 0 })
    )
    localStorage.setItem('pqc-tour-completed', 'true')
  })
})

test('Playground landing is accessible and does not probe a local sandbox on arrival', async ({
  page,
  baseURL,
}) => {
  const privateRequests: string[] = []
  const appPort = new URL(baseURL ?? 'http://localhost:4173').port
  page.on('request', (request) => {
    const url = new URL(request.url())
    if (url.hostname === '127.0.0.1' || url.hostname === 'localhost') {
      if (url.port !== appPort) {
        privateRequests.push(request.url())
      }
    }
  })
  await page.goto('/playground')
  await expect(page.locator('h1').first()).toBeVisible({ timeout: 15_000 })
  await injectAxe(page)
  await checkA11y(page, 'main', {
    axeOptions: { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa'] } },
    includedImpacts: ['critical', 'serious'],
  })
  expect(privateRequests).toEqual([])
})

for (const [persona, heading, expectedTools] of [
  ['executive', 'Executive / Business Leader', ['HSM Capacity', 'Cert Capacity']],
  ['cert-engineer', 'Certification & Validation Engineer', ['Entropy Testing', 'DRBG']],
  ['curious', 'Curious Explorer', ['QRNG', 'PKI Workshop']],
] as const) {
  test(`${persona} gets its canonical short journey and a Learn exit`, async ({ page }) => {
    await page.addInitScript(([key, value]) => localStorage.setItem(key, value), [
      'pqc-learning-persona',
      personaState(persona),
    ] as const)
    await page.goto('/playground')
    await expect(page.getByText(`Recommended for ${heading}`)).toBeVisible({ timeout: 15_000 })
    for (const name of expectedTools) {
      await expect(page.getByText(name, { exact: false }).first()).toBeVisible()
    }
    await expect(page.getByRole('link', { name: /Continue in Learn/i })).toBeVisible()
  })
}

for (const route of BROWSER_TOOL_ROUTES) {
  test(`${route.path} loads and declares how its evidence was produced`, async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, 'The mobile project samples the known layout hotspots below.')
    await page.goto(route.path)
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 20_000 })
    await expect(page.getByLabel('How this tool runs').first()).toBeVisible()
    await expect(page.getByText('Page not found')).toHaveCount(0)
  })
}

for (const path of SPECIAL_BROWSER_ROUTES) {
  test(`${path} special browser entry point loads`, async ({ page, isMobile }) => {
    test.skip(isMobile, 'The mobile project samples the known layout hotspots below.')
    await page.goto(path)
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 20_000 })
    await expect(page.getByText('Page not found')).toHaveCount(0)
  })
}

test('representative browser tools load with evidence labels and no page-level phone spillover', async ({
  page,
  isMobile,
}) => {
  for (const path of MOBILE_HOTSPOTS) {
    await page.goto(path)
    await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 20_000 })
    if (path !== '/playground' && !SPECIAL_BROWSER_ROUTES.includes(path)) {
      await expect(page.getByLabel('How this tool runs').first()).toBeVisible()
    }
    if (isMobile) {
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth
      )
      expect(overflow, `${path} widens the document`).toBeLessThanOrEqual(1)
    }
  }
})

for (const viewport of RESPONSIVE_WIDTHS) {
  test(`responsive hotspots do not widen the page at ${viewport.label}`, async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, 'The responsive-width matrix runs once in the desktop Chromium project.')
    await page.setViewportSize({ width: viewport.width, height: viewport.height })
    for (const path of MOBILE_HOTSPOTS) {
      await page.goto(path)
      await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 20_000 })
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth
      )
      expect(overflow, `${path} widens the document at ${viewport.label}`).toBeLessThanOrEqual(1)
    }
  })
}
