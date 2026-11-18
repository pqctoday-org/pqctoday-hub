// SPDX-License-Identifier: AGPL-3.0-only
import { text } from 'node:stream/consumers'
import { expect, test } from './fixtures/blockAnalytics'

for (const width of [1280, 390]) {
  test(`the transition worksheet separates a shared hybrid group from approved fallback at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 })
    await page.addInitScript(() => {
      localStorage.setItem(
        'pqc-disclaimer-storage',
        JSON.stringify({ state: { acknowledgedMajorVersion: 99 }, version: 0 })
      )
    })
    await page.goto('/business/tools/hybrid-transition-planner')
    const peer = page.getByRole('button', { name: 'Sample TLS peer capability', exact: true })
    const fallback = page.getByRole('button', { name: 'Classical fallback policy', exact: true })
    const preview = page.getByRole('button', { name: 'Preview', exact: true })
    const choose = async (control: typeof peer, option: string) => {
      await control.click()
      await page.getByRole('option', { name: option, exact: true }).click()
    }

    await choose(peer, 'Supports selected hybrid group')
    await preview.click()
    await expect(
      page.getByText('Shared hybrid group is eligible for the modeled exchange.')
    ).toBeVisible()

    const edit = page.getByRole('button', { name: 'Edit', exact: true })
    await edit.click()
    await choose(peer, 'Classical group only')
    await preview.click()
    await expect(page.getByText('Connection blocked by the sample policy.')).toBeVisible()
    await edit.click()
    await choose(fallback, 'Allow separate classical connection')
    await preview.click()
    const allowed =
      'Separate X25519 exchange is allowed by the sample policy. It remains classical.'
    await expect(page.getByText(allowed, { exact: true })).toBeVisible()

    const [file] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', { name: '.md', exact: true }).click(),
    ])
    const markdown = await text(await file.createReadStream())
    expect(markdown).toContain(allowed)
    expect(markdown).toContain('Classical group only')
    await page.reload()
    await expect(peer).toContainText('Classical group only')
    await expect(fallback).toContainText('Allow separate classical connection')
    await choose(page.getByRole('button', { name: 'Protocol / asset', exact: true }), 'TLS 1.2')
    await preview.click()
    await expect(page.getByText(/^KEM: RFC 10024 groups require TLS 1\.3/)).toBeVisible()
    await expect(page.getByText(/Schedule prerequisite: upgrade the protocol/)).toBeVisible()
    await expect(page.getByText(/^Phase 1 \(now/)).toHaveCount(0)
    await expect(page.getByText(allowed, { exact: true })).toHaveCount(0)
  })
}
