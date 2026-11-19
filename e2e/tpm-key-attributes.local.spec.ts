// SPDX-License-Identifier: AGPL-3.0-only
import { expect, test } from './fixtures/blockAnalytics'
import { getViolations, injectAxe } from 'axe-playwright'

for (const width of [1280, 390]) {
  test(`TPM refuses decryption and still signs with the sign-only key at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 })
    await page.addInitScript(() => {
      localStorage.setItem(
        'pqc-disclaimer-storage',
        JSON.stringify({ state: { acknowledgedMajorVersion: 99 }, version: 0 })
      )
    })
    await page.goto('/playground/tpm-playground')
    await expect(page.getByText(/WASM TPM INITIALIZED/i)).toBeVisible({ timeout: 30_000 })
    await page.getByRole('button', { name: /Create primary keys — same trust model/ }).click()
    await page.getByRole('button', { name: 'Run all', exact: true }).click()
    await expect(
      page.getByText(/Returned object attributes: sign set, decrypt clear/)
    ).toBeVisible()
    const decrypt = page.getByRole('listitem').filter({
      hasText: 'Try to decrypt with the RSA signing key',
    })
    await expect(decrypt.getByText('Refused, as expected', { exact: true })).toBeVisible()
    await expect(decrypt.getByText(/TPM_RC_ATTRIBUTES \(handle 1\) \(0x00000182\)/)).toBeVisible()
    await expect(
      page.getByText(
        'Same key signed the sample digest. The TPM returned a TPM_ST_VERIFIED ticket.'
      )
    ).toBeVisible()
    await expect(page.getByText(/1184 B \(FIPS 203\), generated/)).toBeVisible()
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)
    ).toBeLessThanOrEqual(1)

    // Follow the same TPM through the classical and post-quantum signing
    // lesson. The two verified-ticket tags are intentionally different.
    await page
      .getByRole('button', { name: /Sign & verify — new commands, not just new algorithms/ })
      .click()
    await expect(page.getByRole('heading', { name: /Sign & verify — new commands/ })).toBeVisible()
    await page.getByRole('button', { name: 'Run all', exact: true }).click()
    await expect(page.getByText(/Verified ✓ — TPMT_TK_VERIFIED ticket, tag 0x8022/)).toBeVisible({
      timeout: 30_000,
    })
    const pqcVerification = page.getByRole('listitem').filter({
      hasText: 'Post-quantum: verify it — ticket tag TPM_ST_DIGEST_VERIFIED',
    })
    await expect(pqcVerification.getByText(/Verified ✓ — ticket tag 0x8027/)).toBeVisible({
      timeout: 30_000,
    })
    await expect(page.getByText(/3309 B \(FIPS 204\)/)).toBeVisible()
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)
    ).toBeLessThanOrEqual(1)

    await injectAxe(page)
    const violations = await getViolations(page, 'main', {
      runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa'] },
    })
    expect(
      violations.filter(({ impact }) => impact === 'serious' || impact === 'critical'),
      `serious/critical WCAG 2 A/AA violations at ${width}px`
    ).toEqual([])
  })
}
