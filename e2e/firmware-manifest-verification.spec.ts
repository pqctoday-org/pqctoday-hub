// SPDX-License-Identifier: AGPL-3.0-only
import { test, expect } from './fixtures/blockAnalytics'

for (const { route, width } of [
  { route: '/playground/firmware-signing', width: 1280 },
  { route: '/learn/secure-boot-pqc?tab=workshop&step=1', width: 390 },
]) {
  test(`${route}: reject a changed firmware manifest and complete with the original`, async ({
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
    })
    await page.goto(route)
    await expect(page.getByText('Live HSM Mode Active', { exact: true })).toBeVisible({
      timeout: 20_000,
    })
    const next = page.getByRole('button', { name: 'Next Step', exact: true })
    await next.click()
    await page.getByRole('button', { name: 'Generate Both Keys', exact: true }).first().click()
    await next.click()
    await page.getByRole('button', { name: 'Sign Both', exact: false }).first().click()
    await next.click()

    const verify = page.getByRole('button', { name: 'Verify Both Signatures', exact: true }).first()
    const changed = page.getByRole('checkbox', { name: 'Change the received firmware manifest' })
    const finished = page.getByRole('button', { name: 'Start Over', exact: true })
    await changed.check()
    await verify.click()
    await expect(page.getByText('FAILED', { exact: true })).toHaveCount(2)
    await expect(finished).toHaveCount(0)
    const decision = page.getByRole('status', { name: 'Sample rollback decision' })
    await expect(decision).toHaveText('Sample rejected because signature verification failed.')

    await changed.uncheck()
    await verify.click()
    await expect(page.getByText('VERIFIED', { exact: true })).toHaveCount(2)
    await expect(finished).toBeEnabled()
    await expect(decision).toHaveText(
      'Sample meets the sequence policy and both signatures verify.'
    )
    const minimum = page.getByLabel('Minimum manifest sequence')
    await minimum.fill('8')
    await expect(decision).toHaveText(
      'Sample rejected by the rollback policy. Both signatures still verify.'
    )
    await expect(page.getByText('VERIFIED', { exact: true })).toHaveCount(2)
    await minimum.fill('7')
    await expect(decision).toHaveText(
      'Sample meets the sequence policy and both signatures verify.'
    )
  })
}
