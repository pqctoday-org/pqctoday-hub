// SPDX-License-Identifier: AGPL-3.0-only
import { createHash } from 'node:crypto'
import { test, expect } from './fixtures/blockAnalytics'
import { PYTHON_WORKBENCH_PATH } from '../src/data/pythonWorkbench'

for (const width of [1280, 390]) {
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
      await editor.locator('.view-lines').click()
      await page.keyboard.press('ControlOrMeta+a')
      await page.keyboard.insertText(source)
    }

    await replaceCode('raise ValueError("training input was rejected")\n')
    await run.click()
    await expect(page.getByText(/ValueError: training input was rejected/).first()).toBeVisible({
      timeout: 40_000,
    })

    await replaceCode('import hashlib\nprint(hashlib.sha256(b"grade A exercise").hexdigest())\n')
    await run.click()
    const expected = createHash('sha256').update('grade A exercise').digest('hex')
    await expect(page.getByText(expected, { exact: true })).toBeVisible({ timeout: 40_000 })
  })
}
