// SPDX-License-Identifier: AGPL-3.0-only
import { text } from 'node:stream/consumers'
import { test, expect } from './fixtures/blockAnalytics'

const cases = [
  { tool: 'program-charter', field: 'Sponsor name' },
  { tool: 'migration-verification', field: 'Evidence in dossier' },
  { tool: 'refresh-cycle-alignment', field: 'PQC task to embed' },
  { tool: 'stakeholder-comms', field: 'Initiative for the decision request', preview: true },
  {
    tool: 'compliance-checklist',
    field: 'Compliance owner',
    preview: true,
    setup: 'Load sample frameworks',
  },
  {
    tool: 'audit-checklist',
    field: 'Product / asset',
    preview: true,
    setup: '+ Add evidence row',
    placeholder: true,
  },
]

for (const { tool, field, preview, setup, placeholder } of cases) {
  for (const width of [1280, 390]) {
    test(`${tool} retains the revised report after a delayed previous copy at ${width}px`, async ({
      page,
    }) => {
      const original = 'Fictional archive migration revision one'
      const revised = 'Fictional gateway migration revision two'
      await page.setViewportSize({ width, height: 900 })
      await page.addInitScript((originalText) => {
        localStorage.setItem(
          'pqc-disclaimer-storage',
          JSON.stringify({ state: { acknowledgedMajorVersion: 99 }, version: 0 })
        )
        localStorage.setItem(
          'pqc-version-storage',
          JSON.stringify({ state: { lastSeenVersion: '99.0.0' }, version: 0 })
        )
        localStorage.setItem('pqc-tour-completed', 'true')

        Object.defineProperty(navigator, 'clipboard', {
          value: {
            writeText: (value: string) =>
              new Promise<void>((resolve) => {
                document.documentElement.dataset.testOriginalCopy = String(
                  value.includes(originalText)
                )
                window.addEventListener('test-finish-clipboard', () => resolve(), { once: true })
              }),
          },
        })
      }, original)
      await page.goto(`/business/tools/${tool}`)
      if (setup) await page.getByRole('button', { name: setup }).click()
      const input = (
        placeholder
          ? page.getByPlaceholder(field, { exact: true })
          : page.getByLabel(field, { exact: true })
      ).first()
      await input.fill(original)
      const openPreview = page.getByRole('button', { name: 'Preview', exact: true })
      if (preview) await openPreview.click()
      const copy = page.getByRole('button', { name: 'Copy', exact: true }).last()
      await copy.press('Enter')
      await expect(page.locator('html')).toHaveAttribute('data-test-original-copy', 'true')

      if (preview) await page.getByRole('button', { name: 'Edit', exact: true }).click()
      await input.fill(revised)
      if (preview) await openPreview.click()
      const pending = page.waitForEvent('download')
      await page.getByRole('button', { name: '.md', exact: true }).last().click()
      const downloaded = await text(await (await pending).createReadStream())
      expect(downloaded).toContain(revised)
      expect(downloaded).not.toContain(original)

      const saved = await page.evaluate(
        async ({ originalText, revisedText }) => {
          window.dispatchEvent(new Event('test-finish-clipboard'))
          await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
          const store = localStorage.getItem('pki-module-storage') ?? ''
          return { hasCurrent: store.includes(revisedText), hasOld: store.includes(originalText) }
        },
        { originalText: original, revisedText: revised }
      )
      expect(saved).toEqual({ hasCurrent: true, hasOld: false })
      await expect(page.getByRole('button', { name: 'Copied', exact: true })).toHaveCount(0)
      await page.reload()
      await expect(input).toHaveValue(revised)
    })
  }
}
