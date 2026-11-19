// SPDX-License-Identifier: AGPL-3.0-only
import { createHash } from 'node:crypto'
import { expect, test } from './fixtures/blockAnalytics'

for (const width of [1280, 390]) {
  test(`a valid model manifest cannot authenticate changed artifact bytes at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 })
    await page.addInitScript(() => {
      localStorage.setItem(
        'pqc-disclaimer-storage',
        JSON.stringify({ state: { acknowledgedMajorVersion: 99 }, version: 0 })
      )
    })
    await page.goto('/learn/ai-security-pqc?tab=workshop&step=1')
    const exercise = page.getByRole('region', { name: 'Verify a signed model manifest' })
    const artifact = exercise.getByLabel('Received model artifact')
    const original = await artifact.inputValue()
    await exercise.getByRole('button', { name: 'Sign the sample manifest' }).click()
    await expect(
      exercise.getByText(createHash('sha256').update(original).digest('hex'), { exact: true })
    ).toBeVisible()
    const verify = exercise.getByRole('button', { name: 'Verify received artifact' })
    const outcome = exercise.getByRole('status', { name: 'Model verification result' })
    await verify.click()
    await expect(outcome).toContainText('Verified manifest signature and matching artifact digest.')
    await artifact.fill(original.replace('0.25', '0.26'))
    await expect(outcome).toContainText('Ready to verify the received artifact.')
    await verify.click()
    await expect(outcome).toContainText(
      'Artifact rejected. The signature verifies, but the received digest differs.'
    )
    await exercise.getByRole('button', { name: 'Restore sample artifact' }).click()
    await verify.click()
    await expect(outcome).toContainText('Verified manifest signature and matching artifact digest.')
  })
}
