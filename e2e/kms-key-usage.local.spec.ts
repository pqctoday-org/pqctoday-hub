// SPDX-License-Identifier: AGPL-3.0-only
import { expect, test } from './fixtures/blockAnalytics'

for (const width of [1280, 390]) {
  test(`the KMS sample separates key capability from a matching policy at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 })
    await page.addInitScript(() => {
      localStorage.setItem(
        'pqc-disclaimer-storage',
        JSON.stringify({ state: { acknowledgedMajorVersion: 99 }, version: 0 })
      )
    })
    await page.goto('/learn/kms-pqc?tab=workshop')
    await page.getByRole('button', { name: /^Step 6: AWS Policy Lab/ }).click()
    const card = page.getByRole('region', { name: 'Try a sample CreateKey request' })
    await expect(card).toBeVisible()
    const request = card.getByRole('combobox', { name: 'Sample key request' })
    const result = card.getByRole('status', { name: 'CreateKey sample result' })
    await expect(result).toContainText('No Allow in this sample fragment matches')

    await page.getByRole('button', { name: 'Insert Solution Snippet' }).click()
    await expect(result).toContainText('Matching statement numbers: 2.')
    await request.selectOption('kem')
    await expect(result).toContainText('No Allow in this sample fragment matches')
    await request.selectOption('mismatched')
    await expect(result).toContainText('key specification and usage are incompatible')

    const editor = page.getByRole('textbox', { name: 'key-admin-iam-policy.json editor' })
    const recover = await editor.inputValue()
    await request.selectOption('kem')
    await page.getByRole('button', { name: 'Insert optional ML-KEM snippet' }).click()
    await expect(result).toContainText('Matching statement numbers: 3.')
    await request.selectOption('mismatched')
    await expect(result).toContainText('key specification and usage are incompatible')
    await editor.fill('{')
    await expect(result).toContainText('valid JSON in the supported subset')
    await editor.fill(recover)
    await request.selectOption('signer')
    await expect(result).toContainText('Matching statement numbers: 2.')
  })
}
