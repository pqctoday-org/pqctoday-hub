// SPDX-License-Identifier: GPL-3.0-only
import { test, expect } from '@playwright/test'
import { injectAxe, checkA11y } from 'axe-playwright'

// Only fail on serious and critical violations; moderate/minor tracked separately.
const A11Y_OPTIONS = {
  axeOptions: {
    runOnly: { type: 'tag' as const, values: ['wcag2a', 'wcag2aa'] },
  },
  includedImpacts: ['critical', 'serious'] as ('critical' | 'serious')[],
}

// Routes excluded from automated axe scanning:
// - /playground, /openssl, /playground/hsm: WASM-heavy; 60 s+ load can race axe injection.
//   Focus-trap and label issues are covered by manual test and unit tests instead.
const ROUTES = [
  { path: '/', name: 'Landing' },
  { path: '/timeline', name: 'Timeline' },
  { path: '/algorithms', name: 'Algorithms' },
  { path: '/library', name: 'Library' },
  { path: '/threats', name: 'Threats' },
  { path: '/leaders', name: 'Leaders' },
  { path: '/compliance', name: 'Compliance' },
  { path: '/changelog', name: 'Changelog' },
  { path: '/migrate', name: 'Migrate' },
  { path: '/about', name: 'About' },
  { path: '/assess', name: 'Assess' },
  { path: '/report', name: 'Report' },
  { path: '/business', name: 'Business Center' },
  { path: '/faq', name: 'FAQ' },
]

// Navigation content is identical across all routes — the test focuses on
// page-level violations only; the nav landmark is handled by axe's default
// global checks. (Prior `SKIP_SELECTOR` constant was declared but never
// referenced; removed to satisfy @typescript-eslint/no-unused-vars.)

for (const { path, name } of ROUTES) {
  test(`${name} (${path}) — no serious/critical a11y violations`, async ({ page }) => {
    await page.goto(path)

    // Wait for the page's primary content to stabilise before running axe.
    // Most pages render an h1 or the PageHeader; waiting for that confirms hydration.
    await page.waitForSelector('h1, h2, [data-testid]', { timeout: 15000 }).catch(() => {
      // Some pages (Landing, Assess) may not have h1/h2 — that's fine, axe will catch it.
    })

    await injectAxe(page)
    await checkA11y(page, 'html', A11Y_OPTIONS, false, 'default')
  })
}

test('RightPanel chat drawer — focus is trapped inside when open', async ({ page }) => {
  await page.goto('/')

  // Open the chat panel programmatically utilizing the ASR hook pattern we injected
  // This bypasses issues where the FAB button animation may block click listeners under high load
  await page.waitForFunction(
    () =>
      typeof (window as unknown as { __e2e_toggle_panel?: () => void }).__e2e_toggle_panel ===
      'function'
  )
  await page.evaluate(() => {
    const fn = (window as unknown as { __e2e_toggle_panel?: () => void }).__e2e_toggle_panel
    fn?.()
  })

  // Panel should be visible
  const panel = page.getByRole('dialog', { name: /pqc assistant/i })
  await expect(panel).toBeVisible({ timeout: 5000 })

  // Press Tab repeatedly; focus must cycle within the panel, never reach body or nav
  for (let i = 0; i < 6; i++) {
    await page.keyboard.press('Tab')
    const focused = await page.evaluate(() => {
      const el = document.activeElement
      if (!el) return false
      // Verify focused element is inside the dialog
      const dialog = document.querySelector('[role="dialog"]')
      return dialog ? dialog.contains(el) : false
    })
    expect(focused).toBe(true)
  }

  // Esc closes the panel
  await page.keyboard.press('Escape')
  await expect(panel).not.toBeVisible({ timeout: 3000 })
})

test('Assess wizard inputs — all labelled', async ({ page }) => {
  await page.goto('/assess')
  await page.waitForSelector('[data-testid="assess-view"], [role="form"], main', { timeout: 10000 })
  await injectAxe(page)
  await checkA11y(
    page,
    'html',
    {
      axeOptions: { runOnly: { type: 'tag' as const, values: ['wcag2a'] } },
      includedImpacts: ['critical', 'serious'] as ('critical' | 'serious')[],
    },
    false,
    'default'
  )
})
