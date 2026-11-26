// SPDX-License-Identifier: AGPL-3.0-only
import { expect, test } from './fixtures/blockAnalytics'

for (const width of [1280, 390]) {
  test(`the PQC introduction distinguishes signatures and key establishment at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 })
    await page.addInitScript(() => {
      localStorage.setItem(
        'pqc-disclaimer-storage',
        JSON.stringify({ state: { acknowledgedMajorVersion: 99 }, version: 0 })
      )
    })
    await page.goto('/learn/pqc-101?tab=learn')
    const reading = page
      .getByRole('heading', { name: /PQC 101 — The Quantum Threat/ })
      .locator('..')
    await reading.getByRole('button', { name: /What's Changing$/ }).click()
    const lesson = page.getByRole('region', { name: 'Choose the cryptographic operation' })
    await expect(lesson).toBeVisible()
    const mlkem = lesson.getByRole('radio', { name: /ML-KEM/ })
    const mldsa = lesson.getByRole('radio', { name: /ML-DSA/ })
    const run = lesson.getByRole('button', { name: 'Run the sample operation' })
    const result = lesson.getByRole('status', { name: 'Operation result' })
    await expect(run).toBeDisabled()
    await mldsa.check()
    await run.click()
    await expect(result).toContainText('verified the signature on the sample bytes')
    await expect(result).toContainText('Choose a different operation.')
    await expect(result).toContainText('does not give the two services a shared encryption secret')

    await mlkem.check()
    await run.click()
    await expect(result).toContainText('obtained the same shared secret')
    await expect(result).toContainText('Fits this task.')

    await lesson.getByRole('button', { name: 'Authenticate an update' }).click()
    await expect(result).toBeEmpty()
    await mlkem.check()
    await run.click()
    await expect(result).toContainText('does not identify the publisher')
    await mldsa.check()
    await run.click()
    await expect(result).toContainText('Fits this task.')
  })

  test(`the PQC reading only marks sections the learner confirms at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 })
    await page.addInitScript(() => {
      localStorage.setItem(
        'pqc-disclaimer-storage',
        JSON.stringify({ state: { acknowledgedMajorVersion: 99 }, version: 0 })
      )
    })
    await page.goto('/learn/pqc-101?tab=learn')
    const reading = page
      .getByRole('heading', { name: /PQC 101 — The Quantum Threat/ })
      .locator('..')
    await reading.getByRole('button', { name: /Your Next Steps$/ }).click()
    await expect(reading.getByRole('button', { name: 'Why PQC?', exact: true })).toBeVisible()
    await page.getByRole('checkbox', { name: 'Mark section as read: Your Next Steps' }).check()
    await expect(
      reading.getByRole('button', { name: 'Your Next Steps (read)', exact: true })
    ).toBeVisible()
    await expect(reading.getByRole('button', { name: 'The Timeline', exact: true })).toBeVisible()
    await page.reload()
    await expect(
      reading.getByRole('button', { name: 'Your Next Steps (read)', exact: true })
    ).toBeVisible()
    await expect(reading.getByRole('button', { name: 'Why PQC?', exact: true })).toBeVisible()
  })
}
