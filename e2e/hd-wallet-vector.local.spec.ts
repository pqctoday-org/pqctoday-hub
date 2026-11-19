// SPDX-License-Identifier: AGPL-3.0-only
import { HDKey } from '@scure/bip32'
import { expect, test } from './fixtures/blockAnalytics'

const publishedParent = HDKey.fromExtendedKey(
  'xpub68Gmy5EdvgibQVfPdqkBBCHxA5htiqg55crXYuXoQRKfDBFA1WEjWgP6LHhwBZeNK1VTsfTFUHCdrfp1bgwQ9xv5ski8PX9rL2dZXvgGDnw'
)
const publishedChild = HDKey.fromExtendedKey(
  'xpub6ASuArnXKPbfEwhqN6e3mwBcDTgzisQN1wXN9BJcM47sSikHjJf3UFHKkNAWbWMiGj7Wf5uMash7SyYq527Hqck2AxYysAA7xmALppuCkwQ'
)
const publicHex = (node: HDKey) => Buffer.from(node.publicKey!).toString('hex')

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
  for (const entry of ['Learn', 'Playground']) {
    test(`${entry} compares an actual BIP 32 derivation at two indices in the software token at ${width}px`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 900 })
      await page.goto(
        entry === 'Learn'
          ? '/learn/digital-assets?tab=workshop&flow=hd-wallet'
          : '/playground/hd-wallet'
      )
      await expect(page.getByText('Live HSM Mode Active', { exact: true })).toBeVisible()
      await page.getByText('Compare a published BIP 32 example', { exact: true }).press('Enter')
      const index = page.getByLabel('Non-hardened child index')
      const compare = page.getByRole('button', { name: 'Compare public keys' })
      const status = page.getByRole('status').filter({ hasText: 'Public keys match' })
      await compare.press('Enter')
      await expect(status).toContainText("Path m/0'/1 · SoftHSM3 WebAssembly")
      await expect(status.getByRole('definition')).toHaveText([
        publicHex(publishedChild),
        publicHex(publishedChild),
      ])
      await index.fill('2147483648')
      await expect(index).toHaveAttribute('aria-invalid', 'true')
      await expect(compare).toBeDisabled()
      await expect(status).toHaveCount(0)

      await index.fill('2')
      await compare.press('Enter')
      const sibling = publicHex(publishedParent.deriveChild(2))
      expect(sibling).not.toBe(publicHex(publishedChild))
      await expect(status).toContainText("Path m/0'/2 · SoftHSM3 WebAssembly")
      await expect(status.getByRole('definition')).toHaveText([sibling, sibling])
      await expect(status).toContainText('Reference derived from the published parent')

      await index.fill('1')
      await compare.press('Enter')
      await expect(status.getByRole('definition')).toHaveText([
        publicHex(publishedChild),
        publicHex(publishedChild),
      ])
    })
  }
}
