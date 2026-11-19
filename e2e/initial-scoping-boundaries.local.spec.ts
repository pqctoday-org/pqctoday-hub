// SPDX-License-Identifier: AGPL-3.0-only
import { text } from 'node:stream/consumers'
import { expect, test } from './fixtures/blockAnalytics'

for (const width of [1280, 390]) {
  test(`the scoping worksheet preserves dependencies of included systems at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 })
    await page.addInitScript(() => {
      localStorage.setItem(
        'pqc-disclaimer-storage',
        JSON.stringify({ state: { acknowledgedMajorVersion: 99 }, version: 0 })
      )
    })
    await page.goto('/business/tools/initial-scoping')
    const systems = page.getByRole('region', { name: 'Systems under review' })
    await expect(systems).toBeVisible()
    await systems
      .getByRole('textbox', { name: 'System 1 name', exact: true })
      .fill('Fictional portal')
    const dependencies = systems.getByRole('textbox', { name: 'System 1 dependencies' })
    await dependencies.fill('Shared gateway, Metrics')
    await systems
      .getByRole('textbox', { name: 'System 1 protected assets' })
      .fill('Customer records')

    await systems.getByRole('button', { name: '+ Add', exact: true }).click()
    await systems.getByRole('textbox', { name: 'System 2 name', exact: true }).fill('Metrics')
    await systems
      .getByRole('textbox', { name: 'System 2 dependencies' })
      .fill('shared gateway, Log store')
    await systems.getByRole('textbox', { name: 'System 2 protected assets' }).fill('Usage history')
    const boundary = systems.getByRole('region', { name: 'Scope boundaries' })
    const excluded = systems.getByRole('checkbox', { name: 'Exclude system 2 from scope' })
    await expect(boundary).toContainText(
      'Dependencies of included systems: Shared gateway, Metrics, Log store'
    )
    await excluded.check()
    await expect(boundary).toContainText('Excluded systems: Metrics')
    await expect(boundary).toContainText('Assets of included systems: Customer records')
    await expect(boundary).not.toContainText('Usage history')
    await expect(boundary.getByRole('status')).toContainText(
      'Included systems still depend on excluded systems: Metrics'
    )
    await dependencies.fill('Shared gateway')
    await expect(boundary.getByRole('status')).toHaveCount(0)
    await expect(boundary).toContainText('Dependencies of included systems: Shared gateway')
    await expect(boundary).not.toContainText('Log store')

    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', { name: '.md', exact: true }).click(),
    ])
    const markdown = await text(await download.createReadStream())
    expect(markdown).toContain('- Excluded systems: Metrics')
    expect(markdown).toContain('- Dependencies of included systems: Shared gateway')
    expect(markdown).toContain('- Assets of included systems: Customer records')
    expect(markdown).not.toContain('Usage history')

    await excluded.uncheck()
    await expect(boundary).toContainText(
      'Assets of included systems: Customer records, Usage history'
    )
  })
}
