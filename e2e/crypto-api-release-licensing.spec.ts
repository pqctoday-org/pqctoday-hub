// SPDX-License-Identifier: AGPL-3.0-only
import { test, expect } from './fixtures/blockAnalytics'

test('Java ML-KEM support shows the Oracle JDK 21 license change and its source', async ({
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
    localStorage.setItem('pqc-tour-completed', 'true')
  })
  // The deep-link step is zero-based: step=5 is the sixth workshop tab.
  await page.goto('/learn/crypto-dev-apis?tab=workshop&step=5')
  const row = page.getByRole('row').filter({ hasText: 'JCA/JCE' })
  await row.getByRole('button').first().click()

  await expect(page.getByText('Oracle JDK 21.0.13 release details')).toBeVisible()
  await expect(page.getByText(/changed the license from earlier JDK 21 updates/)).toBeVisible()
  await expect(
    page.getByText(/defaults new ML-KEM and ML-DSA private keys to the seed PKCS #8 encoding/)
  ).toBeVisible()
  await expect(
    page.getByRole('link', { name: 'Oracle JDK 21.0.13 release notes' }).last()
  ).toHaveAttribute('href', 'https://www.oracle.com/java/technologies/javase/21-0-13-relnotes.html')
  await expect(
    page.getByRole('link', { name: 'Oracle private-key encoding details' })
  ).toHaveAttribute('href', 'https://www.oracle.com/java/technologies/javase/21-0-13-relnotes.html')
})
