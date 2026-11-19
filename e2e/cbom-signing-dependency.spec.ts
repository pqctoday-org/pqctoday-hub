// SPDX-License-Identifier: AGPL-3.0-only
import Ajv from 'ajv'
import addFormats from 'ajv-formats'
import bomSchema from '../src/services/cbom/schema/bom-1.7.schema.json' with { type: 'json' }
import spdxSchema from '../src/services/cbom/schema/spdx.schema.json' with { type: 'json' }
import jsfSchema from '../src/services/cbom/schema/jsf-0.82.schema.json' with { type: 'json' }
import cryptoSchema from '../src/services/cbom/schema/cryptography-defs.schema.json' with { type: 'json' }
import { test, expect } from './fixtures/blockAnalytics'
import { getViolations, injectAxe } from 'axe-playwright'

const ajv = new Ajv({ strict: false, allErrors: true })
addFormats(ajv)
ajv.addSchema([spdxSchema, jsfSchema, cryptoSchema])
const validate = ajv.compile(bomSchema)

for (const width of [1280, 390]) {
  test(`the downloaded CBOM reconciles a library upgrade at ${width}px`, async ({ page }) => {
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
    await page.goto('/learn/cbom?tab=workshop')
    await page.getByRole('tab', { name: 'Workshop', exact: true }).click()
    const exercise = page.getByRole('region', { name: 'Reconcile a signing dependency' })
    const version = exercise.getByLabel('Observed library version')
    const status = exercise.getByRole('status')

    for (const sample of [
      { version: '1.0', algorithm: 'ECDSA', previous: 'ML-DSA-65' },
      { version: '2.0', algorithm: 'ML-DSA-65', previous: 'ECDSA' },
    ]) {
      await version.click()
      await page.getByRole('option', { name: sample.version, exact: true }).click()
      await expect(status).toContainText(`version declares ${sample.algorithm}`)
      const download = page.waitForEvent('download')
      await exercise.getByRole('button', { name: 'Download reconciled CBOM' }).click()
      let artifact = ''
      for await (const chunk of await (await download).createReadStream())
        artifact += chunk.toString()
      const bom = JSON.parse(artifact)
      expect(validate(bom), ajv.errorsText(validate.errors)).toBe(true)
      const ref = `sample-signing-library@${sample.version}`
      expect(bom.dependencies).toContainEqual({ ref: 'sample-update-service', dependsOn: [ref] })
      expect(bom.components).toContainEqual(
        expect.objectContaining({ 'bom-ref': ref, version: sample.version })
      )
      expect(bom.components).toContainEqual(
        expect.objectContaining({
          'bom-ref': `${ref}#${sample.algorithm}`,
          type: 'cryptographic-asset',
        })
      )
      expect(bom.components).not.toContainEqual(expect.objectContaining({ name: sample.previous }))
    }

    await version.click()
    await page.getByRole('option', { name: '1.0', exact: true }).click()
    await expect(status).toContainText('match the baseline inventory')

    await injectAxe(page)
    const violations = await getViolations(page, 'main', {
      runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa'] },
    })
    expect(
      violations.filter(({ impact }) => impact === 'serious' || impact === 'critical'),
      `serious/critical WCAG 2 A/AA violations at ${width}px`
    ).toEqual([])
  })
}
