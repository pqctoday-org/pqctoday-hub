// SPDX-License-Identifier: AGPL-3.0-only
import { expect, test } from './fixtures/blockAnalytics'

const worksheets = [
  { id: 'contract-clause', field: 'PQC Compliance Deadline Year' },
  { id: 'policy-generator', field: 'Review Cadence' },
  { id: 'stakeholder-comms', field: 'Reporting Frequency' },
  { id: 'hybrid-transition-planner', field: 'Algorithm in use today' },
  { id: 'mti-negotiator', field: 'Audience' },
  { id: 'crypto-api-refactor-audit', field: 'Primary language' },
  { id: 'cloud-responsibility-matrix', field: 'Customer key control' },
]

for (const { id, field } of worksheets) {
  for (const width of [1280, 390]) {
    test(`${id} exposes a named keyboard-operable selector at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 })
      await page.addInitScript(() => {
        localStorage.setItem(
          'pqc-disclaimer-storage',
          JSON.stringify({ state: { acknowledgedMajorVersion: 99 }, version: 0 })
        )
      })
      await page.goto(`/business/tools/${id}`)
      const trigger = page.getByRole('button', { name: field, exact: true })
      const initial = (await trigger.innerText()).trim()
      await trigger.press('ArrowDown')
      const list = page.getByRole('listbox', { name: field, exact: true })
      await expect(list).toBeVisible()
      const next = list.getByRole('option').filter({ hasNotText: initial }).last()
      const selected = (await next.innerText()).trim()
      await next.press('Enter')
      await expect(list).toBeHidden()
      await expect(trigger).toBeFocused()
      await expect(trigger).toHaveText(selected)
      await trigger.press('ArrowDown')
      await expect(list.getByRole('option', { name: selected, exact: true })).toHaveAttribute(
        'aria-selected',
        'true'
      )
      await page.keyboard.press('Escape')
      await expect(trigger).toBeFocused()
    })
  }
}
