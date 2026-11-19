// SPDX-License-Identifier: AGPL-3.0-only
import { test, expect } from './fixtures/blockAnalytics'

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
    localStorage.setItem('pqc-tour-completed', 'true')
  })
})

for (const width of [1280, 390]) {
  test(`Changelog retains the named historical release and role at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 })
    await page.goto('/')
    await page.getByRole('button', { name: /^Security Architect/ }).press('Enter')
    await page.goto('/changelog')
    const release = page.getByRole('combobox', { name: 'Release', exact: true })
    await release.selectOption('4.213.0')
    const role = page.getByRole('button', { name: 'For me', exact: true })
    await role.press('Enter')
    await expect(role).toHaveAttribute('aria-pressed', 'true')
    await expect(page.getByText('v4.213.0', { exact: true }).last()).toBeVisible()
    await expect(page.getByText('Current', { exact: true })).toHaveCount(0)
    await expect(page.getByText(/explicitly tagged for your role/)).toBeVisible()
    const query = page.getByRole('textbox', { name: 'Search changelog entries' })
    await query.fill('Common Criteria Security Target')
    await expect(
      page.getByText('Expanded Common Criteria Security Target scope examples')
    ).toBeVisible()
    await query.fill('deliberately-absent-release-fixture')
    await expect(page.getByText('No releases match these filters.')).toBeVisible()
    await page.getByRole('button', { name: 'Clear changelog search' }).press('Enter')
    await expect(query).toBeFocused()
    await query.fill('Common Criteria Security Target')
    const link = page.getByRole('link', {
      name: 'Common Criteria, EUCC & eIDAS Certification',
      exact: true,
    })
    await expect(link).toHaveAttribute('href', '/learn/cc-eucc-certification')
    await link.press('Enter')
    await expect(page).toHaveURL(/\/learn\/cc-eucc-certification/)
    await page.goBack()
    await expect(release).toHaveValue('4.213.0')
    await expect(role).toHaveAttribute('aria-pressed', 'true')
    await expect(query).toHaveValue('Common Criteria Security Target')
  })

  test(`Explore opens the named certificate comparison and requirements source at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 })
    await page.goto('/explore')
    const tasks = page.getByRole('navigation', { name: 'Try a specific task' })
    await tasks
      .getByRole('link', { name: 'Compare TLS certificates and key exchange' })
      .press('Enter')
    await expect(page).toHaveURL(/\/playground\/hybrid-certs/)
    await expect(page.getByText(/certificate.to.TLS/i).first()).toBeVisible()
    await page.goBack()
    await tasks.getByRole('link', { name: 'Look up a requirement and its source' }).press('Enter')
    await expect(page).toHaveURL(/\/compliance\?tab=requirements/)
    if (width === 390)
      await expect(
        page.getByRole('button', { name: 'Sources & Practices', exact: true })
      ).toHaveAttribute('aria-pressed', 'true')
    else
      await expect(page.getByRole('tab', { name: /Sources & Practices/ })).toHaveAttribute(
        'aria-selected',
        'true'
      )
  })
}
