// SPDX-License-Identifier: AGPL-3.0-only
import { expect, test } from './fixtures/blockAnalytics'

for (const width of [1280, 390]) {
  test(`EMV terminal evidence stays separate from issuer authorization at ${width}px`, async ({
    page,
  }) => {
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
    await page.goto('/learn/emv-payment-pqc?tab=workshop')
    await page
      .getByRole('navigation', { name: 'Workshop steps' })
      .getByRole('button', { name: /Transaction Simulator/ })
      .press('Enter')
    const exercise = page.getByRole('region', {
      name: 'Separate card authentication from issuer authorization',
    })
    const terminal = exercise.getByRole('combobox', { name: 'Local card authentication' })
    const issuer = exercise.getByRole('combobox', { name: 'Issuer response' })
    const recorded = exercise.getByRole('status', { name: 'Recorded payment observations' })
    await expect(recorded).toContainText('Terminal card check — Verified')
    await expect(recorded).toContainText('Online issuer decision — Declined')
    await issuer.selectOption('Approved')
    await expect(recorded).toContainText('Terminal card check — Verified')
    await expect(recorded).toContainText('Online issuer decision — Approved')
    await terminal.selectOption('Failed')
    await expect(recorded).toContainText('Terminal card check — Failed')
    await expect(recorded).toContainText('Online issuer decision — Approved')
    await issuer.selectOption('No response')
    await expect(recorded).toContainText('Online issuer decision — No response')
    await expect(
      exercise.getByRole('link', { name: 'EMVCo Contact Chip security and testing' })
    ).toHaveAttribute('href', 'https://www.emvco.com/emv-technologies/emv-contact-chip/')
    const traceStep = page.getByRole('button', { name: /Step 3: ARQC Cryptogram Generation/ })
    await traceStep.press('Enter')
    await expect(traceStep).toHaveAttribute('aria-current', 'step')
    await expect(traceStep).toContainText('the terminal checks a separate dynamic signature')
    const offline = page.getByRole('button', { name: 'Offline (CDA)', exact: true })
    await offline.press('Enter')
    await expect(offline).toHaveAttribute('aria-pressed', 'true')
    await expect(exercise).toHaveCount(0)
  })
}
