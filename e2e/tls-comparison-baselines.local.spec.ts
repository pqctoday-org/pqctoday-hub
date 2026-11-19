// SPDX-License-Identifier: AGPL-3.0-only
import { expect, test } from './fixtures/blockAnalytics'

for (const width of [1280, 390]) {
  test(`TLS comparison keeps failed attempts out of the baseline at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 })
    await page.addInitScript(() => {
      localStorage.setItem(
        'pqc-disclaimer-storage',
        JSON.stringify({ state: { acknowledgedMajorVersion: 99 }, version: 0 })
      )
    })
    await page.goto('/playground/tls-simulator')
    const trust = page.getByRole('textbox', { name: 'Client trusted sample CA' })
    const rsaCa = await trust.inputValue()
    expect(rsaCa).toContain('BEGIN CERTIFICATE')
    await trust.fill(rsaCa.trimEnd() + '\n\n')
    const chooseIdentity = async (name: string) => {
      await page.getByRole('button', { name: 'Server Identity:', exact: true }).click()
      await page.getByRole('option', { name, exact: true }).click()
    }
    await chooseIdentity('Default (ML-DSA-44)')

    const run = page.getByRole('button', { name: /^(Start Full Interaction|Run Again)$/ })
    const history = page.getByRole('region', { name: 'Protocol Crypto Overhead' })
    const baseline = history.getByRole('combobox', { name: 'Completed comparison baseline' })
    const row = (id: number) =>
      history.getByRole('row').filter({
        has: page.getByRole('rowheader', { name: `Run ${id}`, exact: true }),
      })
    for (const attempt of [1, 2]) {
      await run.click()
      await expect(row(attempt)).toContainText('Failed', { timeout: 25_000 })
      await expect(row(attempt)).toContainText('Not compared')
    }
    await expect(
      history.getByText('No completed run with handshake measurements yet.')
    ).toBeVisible()
    await expect(baseline).toHaveCount(0)

    await chooseIdentity('Default (RSA 2048)')
    await run.click()
    await expect(row(3)).toContainText('Completed', { timeout: 25_000 })
    await expect(row(3)).toContainText('RSA-PSS / RSAE / SHA-256')
    await expect(baseline).toHaveValue('3')

    for (const group of await page.getByRole('button', { name: /^X25519MLKEM768/ }).all()) {
      await group.press('Space')
    }
    await run.click()
    await expect(row(4)).toContainText('Completed', { timeout: 25_000 })
    await expect(row(4).getByRole('cell', { name: /^x25519$/i })).toBeVisible()
    await expect(baseline.getByRole('option')).toHaveCount(2)
    await baseline.selectOption('4')
    await expect(row(4)).toContainText('Baseline')
    await expect(row(3).getByRole('cell').last()).toHaveText(/^\+\d+%$/)
    await expect(row(1).getByRole('cell').last()).toHaveText('Not compared')
    await expect(row(2).getByRole('cell').last()).toHaveText('Not compared')
  })
}
