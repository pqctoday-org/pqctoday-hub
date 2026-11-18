// SPDX-License-Identifier: AGPL-3.0-only
import { createHmac } from 'node:crypto'
import { test, expect } from './fixtures/blockAnalytics'

for (const { route, width } of [
  { route: '/playground/kdf-derivation', width: 1280 },
  { route: '/learn/qkd?tab=workshop&step=4', width: 390 },
]) {
  test(`${route}: compare real HSM derivations with independent HMAC calculations`, async ({
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
    await page.getByRole('button', { name: 'Fetch QKD Key', exact: true }).click()
    const input = page
      .getByText('QKD Secret (32 bytes)', { exact: true })
      .locator('..')
      .locator('code')
    const secret = await input.innerText()
    expect(secret).toMatch(/^[\da-f]{64}$/)
    await page.getByRole('button', { name: 'Import into HSM', exact: true }).click()
    await page.getByRole('button', { name: 'Attempt Sample HSM Derivation', exact: true }).click()

    const original = page.getByRole('region', { name: 'Original context', exact: true })
    const repeated = page.getByRole('region', { name: 'Repeated context', exact: true })
    const changed = page.getByRole('region', { name: 'Changed context', exact: true })
    await expect(changed).toBeVisible()
    const [sessionId, baseline] = await original.locator('code').allInnerTexts()
    const repeatedKey = await repeated.locator('code').innerText()
    const [changedSessionId, differentKey] = await changed.locator('code').allInnerTexts()

    function expected(context: string) {
      return createHmac('sha256', Buffer.from(secret, 'hex'))
        .update(Buffer.from('00000001', 'hex'))
        .update('session-key-v1\0')
        .update(Buffer.from(context, 'hex'))
        .update(Buffer.from('00000100', 'hex'))
        .digest('hex')
    }

    expect(sessionId).toMatch(/^[\da-f]{32}$/)
    expect(changedSessionId).toMatch(/^[\da-f]{32}$/)
    expect(baseline).toBe(expected(sessionId))
    expect(repeatedKey).toBe(baseline)
    expect(differentKey).toBe(expected(changedSessionId))
    expect(differentKey).not.toBe(baseline)
  })
}

test('software illustration labels its random output and omits the derivation comparison', async ({
  page,
}) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      'pqc-disclaimer-storage',
      JSON.stringify({ state: { acknowledgedMajorVersion: 99 }, version: 0 })
    )
    localStorage.setItem(
      'pqc-version-storage',
      JSON.stringify({ state: { lastSeenVersion: '99.0.0' }, version: 0 })
    )
    localStorage.setItem(
      'pqc-hsm-mode-storage',
      JSON.stringify({ state: { liveHsmEnabled: false }, version: 1 })
    )
  })
  await page.goto('/playground/kdf-derivation')
  await page.getByRole('button', { name: 'Fetch QKD Key', exact: true }).click()
  await page.getByRole('button', { name: 'Import into HSM', exact: true }).click()
  await page.getByRole('button', { name: 'Show Illustrative Random Output', exact: true }).click()
  await expect(page.getByText('Illustrative random output — no KDF executed.')).toBeVisible()
  await expect(page.getByRole('region', { name: 'Repeated context' })).toHaveCount(0)
  await expect(page.getByRole('region', { name: 'Changed context' })).toHaveCount(0)
})
