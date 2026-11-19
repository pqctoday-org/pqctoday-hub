// SPDX-License-Identifier: AGPL-3.0-only
import { test, expect } from './fixtures/blockAnalytics'

for (const width of [1280, 390]) {
  test(`both gateway TLS legs report the groups actually negotiated at ${width}px`, async ({
    page,
  }) => {
    test.setTimeout(90_000)
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
    await page.goto('/learn/web-gateway-pqc?tab=workshop&step=1')
    const exercise = page.getByRole('region', {
      name: 'Check both TLS legs of a re-encrypting gateway',
    })
    const run = exercise.getByRole('button', { name: 'Run both TLS handshakes' })
    const originSupportsHybrid = exercise.getByRole('checkbox', { name: /Origin peer supports/ })
    const permitsFallback = exercise.getByRole('checkbox', { name: /Gateway permits classical/ })
    const decision = exercise.getByRole('status', { name: 'Gateway TLS decision' })
    const ingress = exercise.getByRole('row', { name: /Client to edge/ })
    const origin = exercise.getByRole('row', { name: /Edge to origin/ })

    await run.click()
    await expect(decision).toHaveText('Both legs established hybrid key exchange.', {
      timeout: 30_000,
    })
    await expect(ingress).toContainText('X25519MLKEM768')
    await expect(origin).toContainText('X25519MLKEM768')
    await expect(ingress).toContainText('rsa_pss_rsae_sha256')
    await expect(origin).toContainText('rsa_pss_rsae_sha256')

    await originSupportsHybrid.uncheck()
    await expect(origin).toHaveCount(0)
    await run.click()
    await expect(decision).toContainText('Hybrid protection stops at the edge.', {
      timeout: 20_000,
    })
    await expect(ingress).toContainText('X25519MLKEM768')
    await expect(origin.getByRole('cell', { name: 'X25519', exact: true })).toBeVisible()
    await expect(origin).toContainText('rsa_pss_rsae_sha256')

    await permitsFallback.uncheck()
    await expect(origin).toHaveCount(0)
    await run.click()
    await expect(decision).toContainText('OpenSSL refused the origin handshake.', {
      timeout: 20_000,
    })
    await expect(ingress).toContainText('X25519MLKEM768')
    await expect(origin).toContainText('Rejected')
    await expect(exercise.getByText(/no suitable key share/i)).toBeVisible()

    await originSupportsHybrid.check()
    await run.click()
    await expect(decision).toHaveText('Both legs established hybrid key exchange.', {
      timeout: 20_000,
    })
  })
}
