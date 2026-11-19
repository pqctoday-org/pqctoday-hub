// SPDX-License-Identifier: AGPL-3.0-only
import { text } from 'node:stream/consumers'
import { expect, test } from './fixtures/blockAnalytics'

for (const width of [1280, 390]) {
  test(`delaying a roadmap prerequisite flags the dependent milestone at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 })
    await page.addInitScript(() => {
      localStorage.setItem(
        'pqc-disclaimer-storage',
        JSON.stringify({ state: { acknowledgedMajorVersion: 99 }, version: 0 })
      )
    })
    await page.goto('/business/tools/roadmap-builder')
    const timeline = page.getByTestId('roadmap-timeline')
    const inventory = timeline.getByRole('combobox', {
      name: 'Planned year for Cryptographic inventory complete',
    })
    const cbom = timeline.getByRole('combobox', {
      name: 'Planned year for CBOM published (machine-verifiable)',
    })
    const warning = timeline.getByRole('status')
    const conflict =
      'CBOM published (machine-verifiable) (2027) is planned before Cryptographic inventory complete (2029).'
    const download = async () => {
      const [file] = await Promise.all([
        page.waitForEvent('download'),
        page.getByRole('button', { name: '.md', exact: true }).click(),
      ])
      return text(await file.createReadStream())
    }
    await expect(inventory).toHaveValue('2026')
    await expect(warning).toHaveCount(0)
    await inventory.selectOption('2029')
    await expect(cbom).toHaveValue('2027')
    await expect(warning).toContainText(conflict)
    const latePlan = await download()
    expect(latePlan).toContain('2029 | P1')
    expect(latePlan).toContain(conflict)
    await inventory.selectOption('2027')
    await expect(warning).toHaveCount(0)
    expect(await download()).not.toContain(conflict)
  })
}
