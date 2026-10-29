// SPDX-License-Identifier: AGPL-3.0-only
import { readFile } from 'node:fs/promises'
import { test, expect } from './fixtures/blockAnalytics'

for (const viewport of [
  { width: 1440, height: 900 },
  { width: 390, height: 844 },
]) {
  test(`protected PQC backup export/import preserves identity at ${viewport.width}px`, async ({
    page,
  }) => {
    test.setTimeout(180000)
    await page.setViewportSize(viewport)
    await page.addInitScript(() =>
      localStorage.setItem(
        'pqc-version-storage',
        JSON.stringify({ state: { lastSeenVersion: '99.0.0' }, version: 0 })
      )
    )
    const errors: string[] = []
    page.on('pageerror', (e) => errors.push(e.message))
    await page.goto('/playground/hsm?tab=operate&rail=wrap&engine=rust')
    await page.waitForFunction(
      () =>
        typeof (window as unknown as { __e2e_hsm_autoinit?: unknown }).__e2e_hsm_autoinit ===
        'function'
    )
    expect(
      await page.evaluate(async () =>
        (
          window as unknown as { __e2e_hsm_autoinit: (engine: string) => Promise<boolean> }
        ).__e2e_hsm_autoinit('rust')
      )
    ).toBe(true)
    const panel = page.getByRole('region', { name: 'Protected PQC backup' })
    await panel.getByRole('button', { name: 'Create enrolled demo tokens', exact: true }).click()
    await expect(
      panel.getByRole('button', { name: 'Generate enrolled key', exact: true })
    ).toBeEnabled({ timeout: 60000 })
    for (const [, name] of [
      ['0', 'ML-KEM-768'],
      ['1', 'ML-DSA-65'],
    ]) {
      await panel.getByRole('button', { name: 'Protected backup algorithm' }).click()
      await page.getByRole('option', { name, exact: true }).click()
      await panel.getByRole('button', { name: 'Generate enrolled key', exact: true }).click()
      await expect(
        panel.getByRole('button', { name: 'Create protected backup', exact: true })
      ).toBeEnabled()
      for (const representation of ['Seed', 'Expanded']) {
        await panel.getByRole('button', { name: representation, exact: true }).click()
        await panel.getByRole('button', { name: 'Create protected backup', exact: true }).click()
        await expect(
          panel.getByRole('button', { name: 'Export protected package', exact: true })
        ).toBeEnabled()
        const [download] = await Promise.all([
          page.waitForEvent('download'),
          panel.getByRole('button', { name: 'Export protected package', exact: true }).click(),
        ])
        const file = JSON.parse(await readFile((await download.path())!, 'utf8'))
        // Editable labels must never determine the restored type/representation.
        file.algorithm = 'AES'
        file.representation = representation === 'Seed' ? 'expanded' : 'seed'
        await panel.getByLabel('Import protected backup').setInputFiles({
          name: 'backup.json',
          mimeType: 'application/json',
          buffer: Buffer.from(JSON.stringify(file)),
        })
        await panel
          .getByRole('button', { name: 'Recover and verify identity', exact: true })
          .click()
        const identity = panel.getByRole('status').filter({
          hasText: `${name} recovered; original public-key identity and signed receipt verified.`,
        })
        await expect(identity).toBeVisible({ timeout: 30000 })
        const first = await identity.innerText()
        await panel
          .getByRole('button', { name: 'Recover and verify identity', exact: true })
          .click()
        await expect(identity).toHaveText(first)
        const last = Number.parseInt(file.packageHex.slice(-2), 16) ^ 1
        file.packageHex = file.packageHex.slice(0, -2) + last.toString(16).padStart(2, '0')
        await panel.getByLabel('Import protected backup').setInputFiles({
          name: 'tampered.json',
          mimeType: 'application/json',
          buffer: Buffer.from(JSON.stringify(file)),
        })
        await panel
          .getByRole('button', { name: 'Recover and verify identity', exact: true })
          .click()
        await expect(panel.getByText(/Protected operation refused/)).toBeVisible()
        await expect(identity).toHaveCount(0)
      }
    }
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)
    ).toBe(true)
    expect(errors).toEqual([])
  })
}

test('protected backup clearly refuses C++ mode', async ({ page }) => {
  await page.goto('/playground/hsm?tab=operate&rail=wrap&engine=cpp')
  await page.waitForFunction(
    () =>
      typeof (window as unknown as { __e2e_hsm_autoinit?: unknown }).__e2e_hsm_autoinit ===
      'function'
  )
  expect(
    await page.evaluate(async () =>
      (
        window as unknown as { __e2e_hsm_autoinit: (engine: string) => Promise<boolean> }
      ).__e2e_hsm_autoinit('cpp')
    )
  ).toBe(true)
  const panel = page.getByRole('region', { name: 'Protected PQC backup' })
  await expect(panel.getByText(/Protected backup is unavailable in this engine mode/)).toBeVisible()
  await expect(panel.getByRole('button', { name: 'Create enrolled demo tokens' })).toHaveCount(0)
})
