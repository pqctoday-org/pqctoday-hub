// SPDX-License-Identifier: AGPL-3.0-only
import { test, expect } from './fixtures/blockAnalytics'

for (const width of [1280, 390]) {
  test(`OS TLS policy flags the unmodified client at ${width}px`, async ({ page }) => {
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
    await page.goto('/learn/os-pqc?tab=workshop&step=0')
    const exercise = page.getByRole('region', {
      name: 'Check which clients follow the host TLS policy',
    })
    const status = exercise.getByRole('status')
    const host = exercise.getByRole('checkbox', { name: /host OpenSSL config/ })
    const app = exercise.getByRole('checkbox', { name: /bundled Go client/ })
    await expect(status).toHaveText('Both clients negotiate classical X25519.')
    await expect(exercise.getByText('X25519', { exact: true })).toHaveCount(2)

    await host.focus()
    await page.keyboard.press('Space')
    await expect(host).toBeChecked()
    await expect(status).toHaveText('The bundled Go client still negotiates classical X25519.')
    await expect(exercise.getByText('X25519MLKEM768', { exact: true })).toHaveCount(1)
    await expect(exercise.getByText('X25519', { exact: true })).toHaveCount(1)

    await app.check()
    await expect(status).toHaveText(
      'Both observed connections satisfy the sample hybrid key exchange policy.'
    )
    await expect(exercise.getByText('X25519MLKEM768', { exact: true })).toHaveCount(2)
    await expect(
      exercise.getByText(/Certificate authentication stays RSA throughout/)
    ).toBeVisible()

    await host.uncheck()
    await expect(status).toHaveText('The host OpenSSL client still negotiates classical X25519.')
    await app.uncheck()
    await expect(status).toHaveText('Both clients negotiate classical X25519.')
  })
}
