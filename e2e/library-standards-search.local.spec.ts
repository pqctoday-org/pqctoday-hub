// SPDX-License-Identifier: AGPL-3.0-only
import { expect, test } from './fixtures/blockAnalytics'

for (const width of [1280, 390]) {
  test(`Library search preserves an edited RFC number and opens the correct source at ${width}px`, async ({
    page,
  }) => {
    test.setTimeout(75_000)
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
    await page.goto('/library')
    const search = page.getByLabel(/Search (?:the )?Library/i)
    await search.pressSequentially('RFC 1073')
    await search.press('ArrowLeft')
    await search.press('ArrowLeft')
    await page.keyboard.insertText('0')
    await expect(search).toHaveValue('RFC 10073')
    await expect(page).toHaveURL((url) => url.searchParams.get('q') === 'RFC 10073')

    const item = page.getByRole('button', { name: /^RFC 10073: Composite ML-DSA/ }).first()
    await item.click()
    const document = page.getByRole('dialog').filter({ hasText: /RFC 10073: Composite ML-DSA/ })
    const source = document.locator('a[href="https://www.rfc-editor.org/rfc/rfc10073.html"]').last()
    await expect(source).toBeVisible()
    await expect(document).toContainText(/Nov(?:ember)? 2026|2026-11/i)
    const lesson = document.getByRole('link', { name: /Hybrid Cryptography/ }).first()
    await lesson.click()
    await expect(page).toHaveURL(/\/learn\/hybrid-crypto/)
    await page.goBack()
    await expect(source).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(document).toHaveCount(0)
    await expect(search).toHaveValue('RFC 10073')

    await search.fill('zzz document not in catalogue 6457')
    await expect(item).toHaveCount(0)
    await search.fill('RFC 10024')
    await expect(page.getByRole('button', { name: /^RFC 10024/ }).first()).toBeVisible()
  })
}
