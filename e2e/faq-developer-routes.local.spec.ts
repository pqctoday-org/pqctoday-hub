// SPDX-License-Identifier: AGPL-3.0-only
import { PYTHON_SIGNATURE_EXERCISE_PATH } from '../src/data/pythonWorkbench'
import { test, expect } from './fixtures/blockAnalytics'

for (const width of [1280, 390]) {
  test(`FAQ search routes developers to the cited TLS and Python exercises at ${width}px`, async ({
    page,
  }) => {
    test.setTimeout(90_000)
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
    await page.goto('/faq')
    const search = page.getByRole('searchbox', { name: 'Search questions' })
    await search.fill('certificate for hybrid TLS?')
    const question = page.getByRole('button', {
      name: 'Which certificate can authenticate a hybrid TLS 1.3 handshake?',
      exact: true,
    })
    await question.press('Enter')
    await expect(question).toHaveAttribute('aria-expanded', 'true')
    await expect(page.getByText(/TLS negotiates peer authentication separately/)).toBeVisible()
    await expect(
      page.getByRole('link', { name: 'RFC 10024 hybrid key agreement' })
    ).toHaveAttribute('href', 'https://www.rfc-editor.org/rfc/rfc10024.html#section-4')
    await expect(
      page.getByRole('link', { name: 'RFC 10073 composite ML-DSA in X.509' })
    ).toBeVisible()
    await expect(page.getByRole('link', { name: 'IETF composite TLS draft' })).toBeVisible()
    await page.getByRole('link', { name: 'Run the certificate-to-TLS exercise' }).click()
    await expect(page.getByRole('region', { name: 'Certificate-to-TLS exercise' })).toBeVisible()
    await page.goBack()
    await expect(search).toHaveValue('certificate for hybrid TLS?')

    await search.fill('python in the browser')
    await expect(page).toHaveURL((url) => url.searchParams.get('q') === 'python in the browser')
    const python = page.getByRole('button', { name: /Where can I edit and run Python crypto code/ })
    await expect(python).toHaveAttribute('aria-expanded', 'false')
    await python.press('Space')
    await page.getByRole('link', { name: 'Open the editable Python signature exercise' }).click()
    await expect(page).toHaveURL(
      (url) => url.pathname + url.search === PYTHON_SIGNATURE_EXERCISE_PATH
    )
    await expect(page.getByLabel('Pipeline name')).toHaveValue('ML-DSA sign and verify')
    await expect(page.locator('.monaco-editor')).toBeVisible()

    await page.goBack()
    await expect(search).toHaveValue('python in the browser')
    await search.fill('no such FAQ 7294')
    await expect(page.getByRole('status').filter({ hasText: 'No questions match' })).toBeVisible()
    await page.getByRole('button', { name: 'Clear search' }).click()
    await expect(search).toBeFocused()
    await expect(search).toHaveValue('')
  })
}
