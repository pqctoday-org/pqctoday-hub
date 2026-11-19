// SPDX-License-Identifier: AGPL-3.0-only
import { createHash } from 'node:crypto'
import { test, expect } from './fixtures/blockAnalytics'
import { PYTHON_WORKBENCH_PATH } from '../src/data/pythonWorkbench'

for (const width of [1280, 390]) {
  test(`Python API lesson states its browser TLS limit at ${width}px`, async ({ page }) => {
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
    await page.goto('/learn/crypto-dev-apis?section=languages')
    const scope = page.getByText(/Browser limit: this Python workbench runs crypto examples/)
    await expect(scope).toBeVisible()
    await expect(scope).toContainText('cannot open TLS sockets or validate certificates')
    await expect(scope.getByRole('link', { name: 'Pyodide’s documented limits' })).toHaveAttribute(
      'href',
      'https://pyodide.org/en/314.0.8/usage/wasm-constraints.html'
    )
  })

  test(`search for Python at ${width}px and run editable code in the actual browser workbench`, async ({
    page,
  }) => {
    test.setTimeout(100_000)
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
    await expect(
      page.getByRole('heading', { level: 1, name: /frequently asked questions/i })
    ).toBeVisible()
    if (width === 390) await page.keyboard.press('Meta+k')
    else
      await page
        .getByRole('button', { name: /Search \(⌘K\)/ })
        .first()
        .click()
    const dialog = page.getByRole('dialog', { name: 'Search PQC Today' })
    await dialog.getByRole('combobox', { name: 'Search' }).fill('Python Workbench')
    const result = dialog.getByRole('option', { name: /^Python Workbench\b/i })
    await expect(result).toBeVisible({ timeout: 55_000 })
    await result.click()
    await expect(page).toHaveURL((url) => url.pathname + url.search === PYTHON_WORKBENCH_PATH)

    const editor = page.locator('.monaco-editor')
    await expect(editor).toBeVisible({ timeout: 25_000 })
    const unlock = page.getByRole('button', { name: 'Edit as custom script' })
    if (await unlock.isVisible()) await unlock.click()
    const run = page.getByRole('button', { name: /^Run$/ })
    async function replaceCode(source: string) {
      const input = page.getByRole('textbox', { name: 'Editor content' })
      await input.focus()
      await input.press('ControlOrMeta+Home')
      await input.press('ControlOrMeta+Shift+End')
      await input.pressSequentially(source)
    }

    await replaceCode('raise ValueError("training input was rejected")\n')
    await run.click()
    await expect(page.getByText(/ValueError: training input was rejected/).first()).toBeVisible({
      timeout: 40_000,
    })

    // Reset the run session after the intentional exception; this case checks
    // error reporting and successful execution in independent clean sessions.
    await page.reload()
    await expect(editor).toBeVisible({ timeout: 25_000 })
    if (await unlock.isVisible()) await unlock.click()

    await replaceCode('import hashlib\nprint(hashlib.sha256(b"grade A exercise").hexdigest())\n')
    await run.click()
    const expected = createHash('sha256').update('grade A exercise').digest('hex')
    await expect(page.getByRole('region', { name: 'Scrollable content' })).toContainText(expected, {
      timeout: 40_000,
    })
  })
}
