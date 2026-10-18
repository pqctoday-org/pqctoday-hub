// SPDX-License-Identifier: AGPL-3.0-only
import { test, expect } from '@playwright/test'

/**
 * Persona-overwhelm audit acceptance — /threats page.
 *
 * Role is not applicability. A role with no chosen sector must see the neutral
 * catalogue and an explicit scope prompt; it must not inherit an imagined
 * industry. This pins the post-audit behavior for two different roles.
 */
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      'pqc-disclaimer-storage',
      JSON.stringify({ state: { acknowledgedMajorVersion: 99 }, version: 0 })
    )
    localStorage.setItem(
      'pqc-version-storage',
      JSON.stringify({ state: { lastSeenVersion: '99.0.0' }, version: 0 })
    )
  })
})

test('executive persona does not imply an industry on /threats', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      'pqc-learning-persona',
      JSON.stringify({
        state: {
          selectedPersona: 'executive',
          hasAcknowledgedExecutiveGrcSplit: true,
          selectedRegion: 'global',
          // selectedIndustry intentionally null + selectedIndustries empty so
          // the persona-default kicks in.
          selectedIndustry: null,
          selectedIndustries: [],
          experienceLevel: 'expert',
          viewAccess: { allowed: [] },
        },
        version: 0,
      })
    )
  })

  await page.goto('/threats')

  await expect(page.getByRole('heading', { name: /Quantum Threats/i })).toBeVisible({
    timeout: 15000,
  })
  await expect(page.getByRole('group', { name: /Complete your scope/i })).toContainText(
    /Still unknown: sector/i
  )
  await expect(page.getByText('71 in scope', { exact: true })).toBeVisible()
  await expect(page.getByRole('status').filter({ hasText: /matched to your role/i })).toHaveCount(0)
})

test('researcher persona (no industry picked) does not narrow /threats', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      'pqc-learning-persona',
      JSON.stringify({
        state: {
          selectedPersona: 'researcher',
          selectedRegion: 'global',
          selectedIndustry: null,
          selectedIndustries: [],
          experienceLevel: 'expert',
          viewAccess: { allowed: [] },
        },
        version: 0,
      })
    )
  })

  await page.goto('/threats')

  // Wait for the page to mount.
  const pageHeader = page.getByRole('heading', { name: /Quantum Threats/i })
  await expect(pageHeader).toBeVisible({ timeout: 15000 })

  // Researcher has no default industries → no banner.
  const banner = page.getByRole('status').filter({ hasText: /matched to your role/i })
  await expect(banner).toHaveCount(0)
})

test('phone Threats runner stays within the viewport and exposes progressive search', async ({
  page,
}) => {
  for (const width of [320, 390]) {
    await page.setViewportSize({ width, height: 844 })
    await page.goto('/threats')

    await expect(page.getByPlaceholder('Search threats, crypto, mitigations…')).toBeVisible({
      timeout: 15000,
    })
    await expect(page.getByRole('button', { name: /Show 12 more/i })).toBeVisible()

    const overflow = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }))
    expect(overflow.scrollWidth, `${width}px phone page`).toBeLessThanOrEqual(overflow.clientWidth)
  }
})

test('tablet-width Threats shell stays within the viewport', async ({ page }) => {
  await page.setViewportSize({ width: 768, height: 900 })
  await page.goto('/threats')

  // The responsive breakpoint intentionally uses the compact shell at 768px.
  await expect(page.getByPlaceholder('Search threats, crypto, mitigations…')).toBeVisible({
    timeout: 15000,
  })
  const overflow = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }))
  expect(overflow.scrollWidth, '768px tablet page').toBeLessThanOrEqual(overflow.clientWidth)
})

test('desktop Threats cards and dossier do not spill at supported widths', async ({ page }) => {
  for (const width of [1024, 1440]) {
    await page.setViewportSize({ width, height: 900 })
    await page.goto('/threats')
    await expect(page.getByRole('heading', { name: /Quantum Threats/i })).toBeVisible({
      timeout: 15000,
    })
    await page.getByRole('radio', { name: 'Cards' }).click()
    await expect(page.getByRole('radio', { name: 'Cards' })).toBeChecked()

    const cardOverflow = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }))
    expect(cardOverflow.scrollWidth, `${width}px card view`).toBeLessThanOrEqual(
      cardOverflow.clientWidth
    )

    await page.getByRole('button', { name: 'Open dossier' }).first().click()
    await expect(page.getByRole('button', { name: 'Close details' })).toBeVisible()
    const dossierOverflow = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }))
    expect(dossierOverflow.scrollWidth, `${width}px dossier`).toBeLessThanOrEqual(
      dossierOverflow.clientWidth
    )
    await page.getByRole('button', { name: 'Close details' }).click()
  }
})

test('desktop Threats controls complete the core journey from the keyboard', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 })
  await page.goto('/threats')
  await expect(page.getByRole('heading', { name: /Quantum Threats/i })).toBeVisible({
    timeout: 15000,
  })

  const cards = page.getByRole('radio', { name: 'Cards' })
  await cards.focus()
  await page.keyboard.press('Space')
  await expect(cards).toBeChecked()

  const opener = page.getByRole('button', { name: 'Open dossier' }).first()
  await opener.focus()
  await page.keyboard.press('Enter')
  await expect(page.getByRole('dialog')).toBeVisible()

  const responseTab = page.getByRole('tab', { name: /Incident Response/i })
  await responseTab.focus()
  await page.keyboard.press('Enter')
  await expect(responseTab).toHaveAttribute('aria-selected', 'true')

  const close = page.getByRole('button', { name: 'Close details' })
  await close.focus()
  await page.keyboard.press('Enter')
  await expect(page.getByRole('dialog')).toHaveCount(0)

  const table = page.getByRole('radio', { name: 'Table' })
  await table.focus()
  await page.keyboard.press('Space')
  await expect(table).toBeChecked()
  const prioritySort = page.getByRole('button', { name: 'Site priority' })
  await prioritySort.focus()
  await page.keyboard.press('Enter')
  await expect(prioritySort.locator('xpath=ancestor::th')).toHaveAttribute('aria-sort', /.+/)
})
