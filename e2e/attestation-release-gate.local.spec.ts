// SPDX-License-Identifier: AGPL-3.0-only
import { expect, test } from './fixtures/blockAnalytics'

for (const width of [1280, 390]) {
  test(`passing detached attestation checks do not authorize a sample release at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 })
    await page.addInitScript(() => {
      localStorage.setItem(
        'pqc-disclaimer-storage',
        JSON.stringify({ state: { acknowledgedMajorVersion: 99 }, version: 0 })
      )
    })
    await page.goto('/learn/confidential-computing?tab=workshop&step=1')
    const verifier = page.getByTestId('amd-snp-verifier')
    const appraise = verifier.getByRole('button', { name: 'Appraise recorded report' })
    await appraise.click()
    await expect(verifier.getByTestId('amd-overall')).toHaveText('All six real checks passed.')
    await verifier.getByRole('button', { name: 'Run simulated binding step' }).click()
    await expect(verifier.getByTestId('binding-right-key-binding')).toContainText('PASS')
    await expect(verifier.getByTestId('binding-right-ciphertext-binding')).toContainText('PASS')
    const decision = verifier.getByRole('status', { name: 'Sample release decision' })
    await expect(decision).toContainText('Release blocked')
    await expect(decision).toContainText(
      'The signed report data does not match the local key binding.'
    )
    await appraise.click()
    await expect(verifier.getByTestId('amd-check-challenge')).toContainText('FAIL')
    await expect(decision).toContainText('Failed checks: challenge')
    await verifier.getByRole('button', { name: 'Reset verifier' }).click()
    await appraise.click()
    await expect(verifier.getByTestId('amd-overall')).toHaveText('All six real checks passed.')
    await expect(decision).toContainText('Release blocked')
    await expect(decision).toContainText('No simulated binding check has run for this appraisal.')
  })
}
