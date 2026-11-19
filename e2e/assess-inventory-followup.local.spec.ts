// SPDX-License-Identifier: AGPL-3.0-only
import { test, expect } from './fixtures/blockAnalytics'

for (const width of [1280, 390]) {
  test(`an unknown inventory leads from the wizard to the CBOM exercise at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 })
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
    await page.goto('/assess?mode=quick')
    const isPhone = width === 390
    if (isPhone) await page.getByRole('button', { name: /^Fast track/ }).click()
    const next = page.getByRole('button', { name: isPhone ? 'Next' : 'Continue', exact: true })
    const optionRole = isPhone ? 'button' : 'radio'
    await page.getByRole(optionRole, { name: /Finance & Banking/i }).click()
    await next.click()
    await page.getByRole(optionRole, { name: 'United States', exact: true }).click()
    await next.click()
    await expect(page.getByRole('heading', { name: /what kinds of cryptography/i })).toBeVisible()
    await page.getByRole('button', { name: /not sure — help me choose/i }).click()
    await expect(page.getByText(/Your inventory is recorded as unknown/)).toBeVisible()
    await next.click()
    if (isPhone) {
      await page.getByRole('button', { name: 'High', exact: true }).click()
    } else {
      await page
        .getByRole('group', { name: 'Data sensitivity levels' })
        .getByRole('button', { name: /^High / })
        .click()
    }
    await next.click()
    if (isPhone) await next.click()
    else await page.getByRole('button', { name: 'Skip', exact: true }).click()
    await page.getByRole(optionRole, { name: /^Planning to Start/ }).click()
    await page
      .getByRole('button', { name: isPhone ? 'Finish' : 'Review answers', exact: true })
      .click()
    await expect(page.getByRole('heading', { name: 'Review your answers' })).toBeVisible()
    const cryptoRow = page
      .getByRole('button', { name: 'Edit Crypto in use', exact: true })
      .locator('..')
    await expect(cryptoRow).toContainText('Unknown — inventory needed')
    await expect(cryptoRow).not.toContainText('Recommended')

    await page.getByRole('button', { name: 'Generate my report', exact: true }).click()
    const followup = page.getByRole('region', { name: 'Cryptographic inventory follow-up' })
    await expect(followup).toContainText('conservative exposure assumptions')
    await page
      .getByRole(isPhone ? 'link' : 'button', {
        name: isPhone ? 'View report' : 'View my risk report',
        exact: true,
      })
      .click()
    await expect(page).toHaveURL(/\/report$/)
    const start = page.getByRole('link', { name: 'Start a sample inventory', exact: true })
    if (!isPhone) {
      const section = page.locator('#report-section-recommendedActions')
      const toggle = section.getByRole('button', { name: /^Recommended Actions/ })
      await expect(toggle).toBeVisible()
      if ((await toggle.getAttribute('aria-expanded')) === 'false') await toggle.click()
      await expect(page.getByText(/You reported 1 quantum-vulnerable/)).toHaveCount(0)
      await expect(page.getByText(/Your cryptographic inventory is unknown/).first()).toBeVisible()
    }
    await expect(
      page.getByText('Cryptographic algorithms not yet inventoried', { exact: false })
    ).toBeVisible()
    await expect(start).toHaveAttribute('href', '/learn/cbom?tab=workshop&step=0')
    await start.click()
    await expect(
      page.getByRole('heading', { name: /Discovery coverage over the sample estate/ })
    ).toBeVisible()
  })
}
