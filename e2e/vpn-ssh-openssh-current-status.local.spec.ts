// SPDX-License-Identifier: AGPL-3.0-only
import { expect, test } from './fixtures/blockAnalytics'
import { checkA11y, injectAxe } from 'axe-playwright'

for (const viewport of [
  { width: 1280, height: 900 },
  { width: 390, height: 844 },
]) {
  test(`VPN/SSH sample distinguishes OpenSSH hybrid signatures from pure PQC at ${viewport.width}px`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport)
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.addInitScript(() => {
      localStorage.setItem(
        'pqc-disclaimer-storage',
        JSON.stringify({ state: { acknowledgedMajorVersion: 99 }, version: 0 })
      )
      localStorage.setItem(
        'pqc-version-storage',
        JSON.stringify({ state: { lastSeenVersion: '99.0.0', isFirstVisit: false }, version: 3 })
      )
      localStorage.setItem('pqc-tour-completed', 'true')
    })
    await page.goto('/learn/vpn-ssh-pqc?tab=workshop&step=2')
    const sample = page.getByRole('region', { name: 'Measured SSH transport examples' })
    await expect(sample).toBeVisible({ timeout: 15_000 })
    await expect(sample).toContainText('experimental OQS-OpenSSH 10.3')
    await expect(sample).toContainText(
      'OpenSSH 10.6 enabled the hybrid ssh-mldsa44-ed25519 signature algorithm'
    )
    await expect(sample).toContainText('not pure ML-DSA support in every key or certificate role')
    await expect(sample.getByRole('link', { name: 'official release notes' })).toHaveAttribute(
      'href',
      'https://www.openssh.org/releasenotes.html'
    )
    await injectAxe(page)
    await checkA11y(page, 'main', {
      axeOptions: { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa'] } },
      includedImpacts: ['critical', 'serious'],
    })
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)
    ).toBeLessThanOrEqual(1)
  })
}
