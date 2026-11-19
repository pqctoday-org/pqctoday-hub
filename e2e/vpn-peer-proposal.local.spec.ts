// SPDX-License-Identifier: AGPL-3.0-only
import { expect, test } from './fixtures/blockAnalytics'
import { getViolations, injectAxe } from 'axe-playwright'

async function expectNoSeriousAxeViolations(page: import('@playwright/test').Page) {
  await page.waitForTimeout(300)
  await injectAxe(page)
  const violations = await getViolations(page, 'main', {
    runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa'] },
  })
  expect(violations.filter((v) => v.impact === 'serious' || v.impact === 'critical')).toEqual([])
}

for (const width of [1280, 390]) {
  test(`strongSwan peers require the same ML-KEM proposal at ${width}px`, async ({ page }) => {
    test.setTimeout(145_000)
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
    await page.goto('/playground/vpn-sim?vpnMode=pure-pqc&vpnAuth=psk')
    await expectNoSeriousAxeViolations(page)
    const peer = page.getByRole('combobox', { name: 'Responder ML-KEM requirement' })
    const start = page.getByTestId('vpn-start-daemon')
    const status = page.getByTestId('vpn-status-button')
    const childSa = page.getByText(/CHILD_SA .+ established with SPIs/i)
    const mismatch = page.getByText(
      'The daemon reported NO_PROPOSAL_CHOSEN. The peers did not agree on a proposal.'
    )
    await expect(peer).toHaveValue('match')
    await page.getByTestId('vpn-kem-size-768').click()
    await peer.selectOption('1024')
    await start.click()
    await expect(mismatch).toBeVisible({ timeout: 45_000 })
    await expect(status).toHaveText('Tunnel Failed')
    await expect(childSa).toHaveCount(0)

    await peer.selectOption('768')
    await expect(mismatch).toHaveCount(0)
    await start.click()
    await expect(status).toHaveText('Tunnel Established', { timeout: 45_000 })
    await expect(childSa).toHaveCount(2)
    await expect(page.getByText(/selected proposal.*ML_KEM_768/i).first()).toBeVisible()
    await expectNoSeriousAxeViolations(page)

    await peer.selectOption('1024')
    await expect(status).toHaveCount(0)
    await expect(childSa).toHaveCount(0)
    await expect(start).toBeEnabled()
  })
}
