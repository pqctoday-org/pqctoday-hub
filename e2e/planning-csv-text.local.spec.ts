// SPDX-License-Identifier: AGPL-3.0-only
import { text } from 'node:stream/consumers'
import Papa from 'papaparse'
import { expect, test } from './fixtures/blockAnalytics'

const samples = [
  ['migration-verification', 'Evidence in dossier', 'label', null],
  ['compliance-checklist', 'Compliance owner', 'label', 'Load sample frameworks'],
  ['audit-checklist', 'Product / asset', 'placeholder', '+ Add evidence row'],
  ['compliance-timeline', 'Milestone', 'label', 'Load sample US + EU timeline'],
] as const

for (const [tool, field, fieldKind, setup] of samples) {
  for (const width of [1280, 390]) {
    test(`${tool} downloads authored text in a single guarded CSV cell at ${width}px`, async ({
      page,
    }, testInfo) => {
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
      await page.goto(`/business/tools/${tool}`)
      if (setup) await page.getByRole('button', { name: setup }).click()
      const input = (
        fieldKind === 'label'
          ? page.getByLabel(field, { exact: true })
          : page.getByPlaceholder(field, { exact: true })
      ).first()
      const authored = '=1+1, "sample"'
      await input.fill(authored)
      if (tool === 'compliance-timeline') {
        await page.getByRole('button', { name: 'Add', exact: true }).click()
        await expect(page.getByText(authored, { exact: true }).last()).toBeVisible()
      } else {
        await expect(input).toHaveValue(authored)
      }

      if (tool === 'compliance-checklist' || tool === 'audit-checklist') {
        await page.getByRole('button', { name: 'Preview', exact: true }).click()
      }
      const [file] = await Promise.all([
        page.waitForEvent('download'),
        page.getByRole('button', { name: '.csv', exact: true }).last().click(),
      ])
      const csv = await text(await file.createReadStream())
      await testInfo.attach('sample.csv', { body: csv, contentType: 'text/csv' })
      const rows = Papa.parse<string[]>(csv, { delimiter: ',' }).data
      const matchingRow = rows.find((row) => row.includes(`'${authored}`))
      expect(matchingRow).toBeDefined()
      expect(rows.flat()).not.toContain(authored)
      expect(rows.flat()).not.toContain('sample')

      if (tool !== 'compliance-timeline') {
        await page.reload()
        await expect(input).toHaveValue(authored)
      }
    })
  }
}
