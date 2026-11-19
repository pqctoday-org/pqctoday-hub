// SPDX-License-Identifier: AGPL-3.0-only
import { text } from 'node:stream/consumers'
import { expect, test } from './fixtures/blockAnalytics'

for (const width of [1280, 390]) {
  test(`cloud product clues stay scoped to the selected services at ${width}px`, async ({
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
    await page.goto('/business/tools/cloud-responsibility-matrix')
    const models = page.getByRole('group', { name: 'Service-model mix', exact: true })
    const assets = page.getByRole('group', { name: 'Asset classes in scope' })
    const caas = models.getByRole('checkbox', { name: /Container-as-a-service/ })
    const faas = models.getByRole('checkbox', { name: /FaaS/ })
    const preview = page.getByRole('button', { name: 'Preview', exact: true })
    const edit = page.getByRole('button', { name: 'Edit', exact: true })

    await caas.check()
    await faas.check()
    await assets.getByRole('checkbox', { name: /Customer-managed keys/ }).check()
    await assets.getByRole('checkbox', { name: /FaaS function payloads/ }).check()
    await preview.click()
    const row = (asset: string, model: string) =>
      page
        .getByRole('row')
        .filter({ has: page.getByRole('cell', { name: asset, exact: true }) })
        .filter({ has: page.getByRole('cell', { name: model, exact: true }) })

    await expect(row('TLS termination', 'PaaS')).toContainText('Related product available')
    await expect(row('TLS termination', 'IaaS')).toContainText('Unverified')
    await expect(row('TLS termination', 'CaaS')).toContainText('deployed container configuration')
    await expect(row('TLS termination', 'CaaS')).toContainText('Unverified')
    await expect(row('FaaS function payloads', 'FaaS')).toBeVisible()
    await expect(row('FaaS function payloads', 'CaaS')).toHaveCount(0)
    await expect(row('KMS-backed keys', 'PaaS')).toContainText('Related product available')
    await expect(row('Customer-managed keys', 'PaaS')).toContainText('Unverified')

    await edit.click()
    await faas.uncheck()
    await preview.click()
    await expect(row('FaaS function payloads', 'FaaS')).toHaveCount(0)
    await expect(row('TLS termination', 'CaaS')).toBeVisible()

    const [file] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', { name: '.md', exact: true }).click(),
    ])
    const markdown = await text(await file.createReadStream())
    expect(markdown).toMatch(/\| Customer-managed keys \| PaaS \|[^\n]+Unverified/)
    expect(markdown).toMatch(/\| KMS-backed keys \| PaaS \|[^\n]+Related product available/)
    expect(markdown).toMatch(/\| TLS termination \| CaaS \|[^\n]+deployed container configuration/)
    expect(markdown).not.toMatch(/\| FaaS function payloads \| FaaS \|/)

    await page.reload()
    await preview.click()
    await expect(row('TLS termination', 'CaaS')).toBeVisible()
    await expect(row('Customer-managed keys', 'PaaS')).toContainText('Unverified')
  })
}
