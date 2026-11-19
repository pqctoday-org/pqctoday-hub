// SPDX-License-Identifier: AGPL-3.0-only
import { expect, test } from './fixtures/blockAnalytics'

const tools = [
  ['compliance-checklist', 'Controls'],
  ['contract-clause', 'Evidence Requirements'],
  ['policy-generator', 'Applicable Standards / Frameworks'],
  ['audit-checklist', 'Inventory Planning Topics'],
  ['cloud-responsibility-matrix', 'Cloud providers'],
  ['crypto-api-refactor-audit', 'Current crypto API(s) in use'],
  ['mti-negotiator', 'Interoperability profile'],
  ['hybrid-transition-planner', 'Interoperability requirements'],
] as const

for (const [tool, label] of tools) {
  for (const width of [1280, 390]) {
    test(`${tool} names its checklist group and preserves keyboard focus at ${width}px`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 900 })
      await page.addInitScript(() => {
        localStorage.setItem(
          'pqc-disclaimer-storage',
          JSON.stringify({ state: { acknowledgedMajorVersion: 99 }, version: 0 })
        )
      })
      await page.goto(`/business/tools/${tool}`)
      if (tool === 'compliance-checklist') {
        await page.getByRole('button', { name: 'Load sample frameworks', exact: true }).click()
      }
      const group = page.getByRole('group', { name: label, exact: true }).first()
      await expect(group).toBeVisible()
      const checkbox = group.getByRole('checkbox').first()
      const initial = await checkbox.isChecked()
      await checkbox.focus()
      await expect(checkbox).toBeFocused()
      await page.keyboard.press('Space')
      await expect(checkbox).toBeFocused()
      if (initial) await expect(checkbox).not.toBeChecked()
      else await expect(checkbox).toBeChecked()
      await page.keyboard.press('Space')
      if (initial) await expect(checkbox).toBeChecked()
      else await expect(checkbox).not.toBeChecked()
    })
  }
}
