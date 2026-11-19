// SPDX-License-Identifier: AGPL-3.0-only
import { expect, test } from './fixtures/blockAnalytics'

test.beforeEach(async ({ page }) => {
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
})

for (const width of [1280, 390]) {
  for (const network of ['bitcoin', 'solana'] as const) {
    for (const entry of ['Learn', 'Playground']) {
      test(`${entry} ${network} verifies the actual sample bytes in the software token at ${width}px`, async ({
        page,
      }) => {
        await page.setViewportSize({ width, height: 900 })
        await page.goto(
          entry === 'Learn'
            ? `/learn/digital-assets?tab=workshop&flow=${network}`
            : `/playground/${network}-flow`
        )
        await expect(page.getByText('Live HSM Mode Active', { exact: true })).toBeVisible()
        const bitcoin = network === 'bitcoin'
        const result = page.getByLabel('Command output')
        for (const action of [
          'Generate Source Key',
          'Extract Public Key',
          bitcoin ? 'Create Source Address' : 'Generate Source Address',
          'Generate Recipient Key',
          bitcoin ? 'Create Recipient Address' : 'Generate Recipient Address',
          'Format Transaction',
          'Visualize Message',
          bitcoin ? 'Sign Transaction' : 'Sign Message',
        ]) {
          await page.getByRole('button', { name: action, exact: true }).press('Enter')
          await page.getByRole('button', { name: 'Next Step', exact: true }).press('Enter')
        }

        const verify = page.getByRole('button', { name: 'Verify Signature', exact: true })
        await verify.press('Enter')
        if (bitcoin) {
          await expect(result).toContainText('Original sample signature verified.')
          const digestFor = () =>
            result
              .getByText('Double SHA-256 (32 bytes):', { exact: true })
              .locator('..')
              .locator('code')
              .innerText()
          const originalDigest = await digestFor()
          expect(originalDigest).toMatch(/^[0-9a-f]{64}$/)
          const edited = page.getByRole('switch', { name: /first output increased by 1 satoshi/ })
          await edited.press('Space')
          await expect(result).not.toContainText('Original sample signature verified.')
          await verify.press('Enter')
          await expect(result).toContainText(
            'Edited sample output rejected with the original signature.'
          )
          const editedDigest = await digestFor()
          expect(editedDigest).toMatch(/^[0-9a-f]{64}$/)
          expect(editedDigest).not.toBe(originalDigest)
          await edited.press('Space')
          await verify.press('Enter')
          await expect(result).toContainText('Original sample signature verified.')
          expect(await digestFor()).toBe(originalDigest)
        } else {
          await expect(result).toContainText('Verified inside WebAssembly SoftHSM via C_Verify.')
          await page
            .getByRole('radio', { name: 'Verify a changed message with the original signature' })
            .check()
          await expect(result).not.toContainText(
            'Verified inside WebAssembly SoftHSM via C_Verify.'
          )
          await verify.press('Enter')
          await expect(result).toContainText('Altered sample message rejected as expected.')
          await page.getByRole('radio', { name: 'Simulate invalid signature' }).check()
          await verify.press('Enter')
          await expect(result).toContainText('Altered sample signature rejected as expected.')
          await page.getByRole('radio', { name: 'Original signed message and signature' }).check()
          await verify.press('Enter')
          await expect(result).toContainText('Verified inside WebAssembly SoftHSM via C_Verify.')
        }
      })
    }
  }
}
