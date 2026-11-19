// SPDX-License-Identifier: AGPL-3.0-only
import { text } from 'node:stream/consumers'
import { expect, test } from './fixtures/blockAnalytics'

for (const width of [1280, 390]) {
  test(`MTI preview and export check exact sample peer groups at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    await page.addInitScript(() => {
      localStorage.setItem(
        'pqc-disclaimer-storage',
        JSON.stringify({ state: { acknowledgedMajorVersion: 99 }, version: 0 })
      )
    })
    await page.goto('/business/tools/mti-negotiator')

    const client = page.getByRole('checkbox', {
      name: 'Client supports X25519MLKEM768',
      exact: true,
    })
    const server = page.getByRole('checkbox', {
      name: 'Server supports X25519MLKEM768',
      exact: true,
    })
    const classClient = page.getByRole('checkbox', { name: 'Client supports X25519', exact: true })
    const classServer = page.getByRole('checkbox', { name: 'Server supports X25519', exact: true })
    const separateHybrid = page.getByRole('checkbox', {
      name: 'Server supports SecP256r1MLKEM768',
      exact: true,
    })
    const preview = page.getByRole('button', { name: 'Preview', exact: true })
    const edit = page.getByRole('button', { name: 'Edit', exact: true })
    await expect(client).toBeVisible()
    await client.check()
    await server.check()
    await classClient.check()
    await classServer.check()
    await preview.click()
    await expect(
      page.getByText('Common groups allowed by policy: X25519MLKEM768', { exact: true })
    ).toBeVisible()

    await edit.click()
    await server.uncheck()
    await separateHybrid.check()
    await preview.click()
    await expect(
      page.getByText(/^No mutually supported group meets the worksheet policy\./)
    ).toBeVisible()
    await edit.click()
    await page.getByRole('button', { name: 'Sample TLS 1.3 policy', exact: true }).click()
    await page.getByRole('option', { name: 'Allow classical key exchange', exact: true }).click()
    await preview.click()
    await expect(
      page.getByText('Common groups allowed by policy: X25519', { exact: true })
    ).toBeVisible()
    const [md] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', { name: '.md', exact: true }).click(),
    ])
    expect(await text(await md.createReadStream())).toContain(
      'Common groups allowed by policy: X25519\n'
    )

    await page.reload()
    await expect(separateHybrid).toBeChecked()
    await page.getByRole('button', { name: 'Protocol', exact: true }).click()
    await page.getByRole('option', { name: 'TLS 1.2', exact: true }).click()
    await preview.click()
    await expect(
      page.getByText('Upgrade to TLS 1.3 for the RFC 10024 groups', { exact: true })
    ).toBeVisible()
    await expect(page.getByText('Sample TLS 1.3 peer compatibility', { exact: true })).toHaveCount(
      0
    )
  })
}
