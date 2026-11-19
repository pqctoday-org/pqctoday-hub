// SPDX-License-Identifier: AGPL-3.0-only
import { expect, test } from './fixtures/blockAnalytics'
import { getViolations, injectAxe } from 'axe-playwright'
import { text } from 'node:stream/consumers'

for (const width of [1280, 390]) {
  test(`CBOM Builder validates, recovers and exports the selected SBOM at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 })
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.addInitScript(() => {
      localStorage.setItem(
        'pqc-disclaimer-storage',
        JSON.stringify({ state: { acknowledgedMajorVersion: 99 }, version: 0 })
      )
      localStorage.setItem(
        'pqc-version-storage',
        JSON.stringify({ state: { lastSeenVersion: '99.0.0' }, version: 3 })
      )
      localStorage.setItem('pqc-tour-completed', 'true')
    })
    await page.goto('/business/tools/crypto-cbom-builder')
    await expect(page.getByRole('heading', { name: 'Crypto BOM (CBOM) Builder' })).toBeVisible()
    await page.getByRole('button', { name: 'SBOM → CBOM' }).click()
    await expect(page.getByText(/mapped sample rows/)).toBeVisible()
    const source = page.getByLabel('Paste components-shaped JSON')
    await source.fill('{broken')
    await expect(page.getByRole('alert')).toContainText('Malformed JSON')
    await expect(page.getByRole('button', { name: 'Download CycloneDX 1.7' })).toBeDisabled()
    await source.fill('')
    await expect(page.getByText(/mapped sample rows/)).toBeVisible()
    await expect(page.getByRole('button', { name: 'Download CycloneDX 1.7' })).toBeEnabled()
    const download = page.waitForEvent('download')
    await page.getByRole('button', { name: 'Download CycloneDX 1.7' }).click()
    const artifact = await download
    expect(artifact.suggestedFilename()).toMatch(/\.json$/)
    const bom = JSON.parse(await text(await artifact.createReadStream())) as {
      bomFormat: string
      specVersion: string
      components: Array<{ type: string }>
    }
    expect(bom.bomFormat).toBe('CycloneDX')
    expect(bom.specVersion).toBe('1.7')
    expect(bom.components.length).toBeGreaterThan(0)
    expect(bom.components.some((component) => component.type === 'cryptographic-asset')).toBe(true)
    await injectAxe(page)
    const violations = await getViolations(page, 'main', {
      runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa'] },
    })
    expect(violations.filter((v) => v.impact === 'serious' || v.impact === 'critical')).toEqual([])
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)
    ).toBeLessThanOrEqual(1)
  })
}
