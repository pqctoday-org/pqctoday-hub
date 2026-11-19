// SPDX-License-Identifier: AGPL-3.0-only
import { expect, test } from './fixtures/blockAnalytics'

const hybrid = 'mls_128_mlkem768x25519_aes128gcm_sha256_ed25519'
const postQuantum = 'mls_192_mlkem768_aes256gcm_sha384_mldsa65'

for (const target of [
  '/learn/mls-group-messaging?tab=workshop',
  '/playground/mls-group-messaging',
]) {
  for (const width of [1280, 390]) {
    test(`MLS checks the same target and compatible KeyPackages at ${width}px in ${target}`, async ({
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
        localStorage.setItem('pqc-tour-completed', 'true')
      })
      await page.goto(target)
      const check = page.getByRole('region', { name: 'Check a proposed group reinitialization' })
      const verdict = check.getByRole('status')
      const targetSuite = check.getByRole('combobox', { name: 'Target group cipher suite' })
      const alice = check.getByRole('combobox', { name: 'Alice’s available KeyPackage suite' })
      const bob = check.getByRole('combobox', { name: 'Bob’s available KeyPackage suite' })
      const requirePq = check.getByRole('checkbox', { name: 'Require post-quantum signatures' })
      await expect(verdict).toContainText('Hold reinitialization')
      await expect(verdict).toContainText('Matching KeyPackages still needed for Bob.')
      await expect(verdict).toContainText('passive attacks')

      await bob.selectOption(hybrid)
      await expect(verdict).toContainText('Preflight passed')
      await expect(verdict).toContainText('epoch 1 Welcome')
      await expect(verdict).toContainText('old group can no longer send messages')
      await requirePq.press('Space')
      await expect(verdict).toContainText('Hold reinitialization')
      await expect(verdict).toContainText('traditional signature and fails')

      await targetSuite.selectOption(postQuantum)
      await expect(verdict).toContainText('Matching KeyPackages still needed for Alice and Bob.')
      await alice.selectOption(postQuantum)
      await bob.selectOption(postQuantum)
      await expect(verdict).toContainText('Preflight passed')
      await expect(verdict).not.toContainText('passive attacks')
      await expect(check.getByRole('link', { name: 'RFC 9420 reinitialization' })).toHaveAttribute(
        'href',
        'https://www.rfc-editor.org/rfc/rfc9420.html#section-11.2'
      )
      await expect(check).toContainText('fictional metadata')
      const box = await check.boundingBox()
      expect(box && box.x + box.width).toBeLessThanOrEqual(width)

      if (target.startsWith('/learn/')) {
        page.once('dialog', (dialog) => dialog.accept())
        await page.getByRole('button', { name: 'Reset workshop', exact: true }).click()
        await expect(targetSuite).toHaveValue(hybrid)
        await expect(requirePq).not.toBeChecked()
        await expect(verdict).toContainText('Matching KeyPackages still needed for Bob.')
      }
    })
  }
}
