// SPDX-License-Identifier: AGPL-3.0-only
import { test, expect } from './fixtures/blockAnalytics'

for (const width of [1280, 390]) {
  test(`Quantum Threats workshop produces the expected learner outcomes at ${width}px`, async ({
    page,
  }) => {
    test.setTimeout(90_000)
    await page.setViewportSize({ width, height: 844 })
    await page.addInitScript(() => {
      localStorage.setItem(
        'pqc-disclaimer-storage',
        JSON.stringify({ state: { acknowledgedMajorVersion: 99 }, version: 0 })
      )
      localStorage.setItem(
        'pqc-version-storage',
        JSON.stringify({ state: { lastSeenVersion: '99.0.0' }, version: 0 })
      )
      localStorage.setItem(
        'pqc-learning-persona',
        JSON.stringify({ state: { selectedPersona: 'architect' }, version: 10 })
      )
      localStorage.setItem('pqc-tour-completed', 'true')
    })

    await page.goto('/learn/quantum-threats?tab=workshop&step=0')
    await expect(page.getByText('CRQC-VULNERABLE', { exact: true })).toBeVisible()

    await page.goto('/learn/quantum-threats?tab=workshop&step=1')
    await expect(page.getByRole('row', { name: /ECDSA secp256k1/ })).toContainText('Shor')
    await expect(page.getByRole('row', { name: /SHA-256/ })).toContainText('BHT collision')

    await page.goto('/learn/quantum-threats?tab=workshop&step=2')
    await expect(
      page.getByRole('heading', { name: 'Key Size Analyzer', exact: true })
    ).toBeVisible()
    await expect(page.getByRole('columnheader').filter({ hasText: 'RSA-2048' })).toBeVisible()
    await expect(page.getByRole('columnheader').filter({ hasText: 'ML-KEM-768' })).toBeVisible()

    await page.goto('/learn/quantum-threats?tab=workshop&step=3')
    await page.getByRole('button', { name: 'Healthcare (50y)' }).click()
    const hndlYear = page.locator('#crqc-year-slider')
    await hndlYear.focus()
    await hndlYear.press('Home')
    for (let i = 0; i < 7; i++) await hndlYear.press('ArrowRight')
    await expect(page.getByText('2035 − 50 − 5 = 1980')).toBeVisible()

    await page.goto('/learn/quantum-threats?tab=workshop&step=4')
    await expect(page.getByText('2035 − 5 = 2030')).toBeVisible()
    await expect(page.getByText(/still valid at CRQC arrival/)).toBeVisible()

    await page.goto('/learn/quantum-threats?tab=workshop&step=5')
    await expect(
      page.getByRole('heading', { name: /Qubit Trajectory|Trajectory to Q-Day/i })
    ).toBeVisible()
    await expect(page.getByText(/logical qubits/i).first()).toBeVisible()
  })
}
