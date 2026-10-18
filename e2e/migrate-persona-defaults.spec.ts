// SPDX-License-Identifier: AGPL-3.0-only
import { expect, test, type Page } from '@playwright/test'

async function setRole(page: Page, role: string) {
  await page.addInitScript((selectedPersona: string) => {
    localStorage.setItem(
      'pqc-learning-persona',
      JSON.stringify({
        state: {
          selectedPersona,
          selectedRegion: 'global',
          selectedIndustry: null,
          selectedIndustries: [],
          experienceLevel: 'expert',
          viewAccess: { allowed: [] },
        },
        version: 0,
      })
    )
    localStorage.setItem(
      'pqc-disclaimer-storage',
      JSON.stringify({ state: { acknowledgedMajorVersion: 99 }, version: 0 })
    )
    localStorage.setItem(
      'pqc-version-storage',
      JSON.stringify({ state: { lastSeenVersion: '99.0.0' }, version: 0 })
    )
  }, role)
}

test('certification engineer gets evidence-first planning without false readiness', async ({ page }) => {
  await setRole(page, 'cert-engineer')
  await page.goto('/migrate')

  await expect(page.getByText(/Educational planning exercise/i)).toBeVisible()
  await expect(page.getByText(/not a readiness or compliance assessment/i)).toBeVisible()
  await page.getByRole('button', { name: /Add TLS key exchange to plan/i }).click()
  await expect(page.getByText('Planning coverage')).toBeVisible()
  await expect(page.getByText('0%')).toBeVisible()
  await expect(page.getByText(/have a catalog example selected/i)).toBeVisible()
  await expect(page.getByText(/Nearest CNSA deadline/i)).toHaveCount(0)
  await expect(page.getByText(/^2025$/)).toHaveCount(0)

  await page.getByRole('tab', { name: /Plan & sequence/i }).click()
  await expect(page.getByRole('button', { name: /Export planning draft/i })).toBeVisible()
})

test('role narrowing can be dismissed and all educational tabs are reachable', async ({ page }) => {
  await setRole(page, 'executive')
  await page.goto('/migrate')

  const roleNote = page.getByText(/matched to your role/i).first()
  await expect(roleNote).toBeVisible()
  await page.getByRole('button', { name: 'See all' }).first().click()
  await expect(roleNote).toHaveCount(0)

  for (const name of ['Plan & sequence', 'Vendor roadmaps', 'Evidence gaps', 'Replace what you own']) {
    await page.getByRole('tab', { name }).click()
    await expect(page.getByRole('tab', { name })).toHaveAttribute('aria-selected', 'true')
  }
  await page.getByRole('tab', { name: 'Evidence gaps' }).click()
  await expect(page.getByText(/not likelihood, vendor-risk, suitability or compliance scores/i)).toBeVisible()
})

for (const width of [320, 390]) {
  test(`phone ${width}px keeps the four-step flow usable without document overflow`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 })
    await setRole(page, 'cert-engineer')
    await page.goto('/migrate')
    await expect(page.getByText(/Educational planning exercise/i)).toBeVisible()

    for (const name of ['Replace', 'Plan', 'Vendors', 'Evidence']) {
      await page.getByRole('button', { name, exact: true }).click()
    }
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1)
    expect(overflow).toBe(false)
  })
}
