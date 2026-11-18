// SPDX-License-Identifier: AGPL-3.0-only
import { test, expect } from './fixtures/blockAnalytics'

const lessons = [
  ['cloud-kms-key-exchange', 'kms-pqc', 'step=6'],
  ['token-migration', 'iam-pqc', 'step=1'],
  ['firmware-signing', 'secure-boot-pqc', 'step=1'],
  ['hybrid-sigs', 'hybrid-crypto', 'step=3&sv=2'],
  ['hybrid-certs', 'hybrid-crypto', 'step=5&sv=2'],
  ['kdf-derivation', 'qkd', 'step=4'],
  ['mls-group-messaging', 'mls-group-messaging', ''],
  ['rng-demo', 'entropy-randomness', 'step=0'],
  ['entropy-test', 'entropy-randomness', 'step=1'],
  ['drbg-demo', 'entropy-randomness', 'step=3'],
  ['source-combining', 'entropy-randomness', 'step=4'],
  ['bitcoin-flow', 'digital-assets', 'flow=bitcoin'],
  ['hd-wallet', 'digital-assets', 'flow=hd-wallet'],
  ['solana-flow', 'digital-assets', 'flow=solana'],
  ['api-security-jwt', 'api-security-jwt', ''],
  ['pki-enrollment', 'pki-enrollment-protocols', ''],
  ['email-signing', 'email-signing', ''],
] as const

for (const [tool, module, query] of lessons) {
  for (const width of [1280, 390]) {
    test(`${tool} at ${width}px opens its registered workshop step`, async ({ page }) => {
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
      await page.goto(`/playground/${tool}`)
      const lessonPath = `/learn/${module}?tab=workshop${query ? `&${query}` : ''}`
      const lesson = page.getByRole('link', { name: /^Learn with / })
      await expect(lesson).toHaveAttribute('href', lessonPath)
      const backLabel = (await lesson.innerText()).replace(/^Learn with /, 'Back to ')
      await page.getByRole('button', { name: backLabel, exact: true }).click()
      await expect(page).toHaveURL((url) => {
        if (url.pathname !== `/learn/${module}` || url.searchParams.get('tab') !== 'workshop') {
          return false
        }
        const expectedStep = new URLSearchParams(query).get('step')
        return expectedStep === null || (url.searchParams.get('step') ?? '0') === expectedStep
      })
      if (module === 'digital-assets') {
        await expect(page.getByRole('button', { name: /Back to Chain Selection/ })).toBeVisible()
      } else if (tool === 'kdf-derivation') {
        await expect(
          page.getByRole('heading', { name: /Local Key-Delivery Illustration/ })
        ).toBeVisible()
      }
    })
  }
}
