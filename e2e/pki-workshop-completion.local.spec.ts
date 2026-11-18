// SPDX-License-Identifier: AGPL-3.0-only
import { expect, test } from './fixtures/blockAnalytics'

const cases = [
  {
    route: '/learn/pki-workshop?tab=workshop',
    width: 1280,
    final: 'Step 8: Cert Capacity',
    id: 'capacity',
    steps: 8,
    state: 'completed',
  },
  {
    route: '/playground/pki-workshop',
    width: 390,
    final: 'Step 5: Revocation (CRL)',
    id: 'revoke',
    steps: 5,
    state: 'in-progress',
  },
]

for (const sample of cases) {
  test(`${sample.route} records only the completed workshop scope`, async ({ page }) => {
    await page.setViewportSize({ width: sample.width, height: 900 })
    await page.addInitScript(() => {
      localStorage.setItem(
        'pqc-disclaimer-storage',
        JSON.stringify({ state: { acknowledgedMajorVersion: 99 }, version: 0 })
      )
    })
    await page.goto(sample.route)
    await page.addLocatorHandler(
      page.getByRole('button', { name: 'Keep going', exact: true }),
      (button) => button.click()
    )
    const steps = page.getByRole('navigation', { name: 'PKI workshop steps' })
    const first = steps.getByRole('button', { name: 'Step 1: Generate CSR', exact: true })
    const last = steps.getByRole('button', { name: sample.final, exact: true })
    const finish = page.getByRole('button', { name: /^(Finish workshop|Complete Module)/ })
    const readProgress = () =>
      page.evaluate(() => {
        const stored = localStorage.getItem('pki-module-storage')
        return stored ? JSON.parse(stored).state.modules['pki-workshop'] : undefined
      })

    await last.click()
    await expect(last).toHaveAttribute('aria-current', 'step')
    await expect(finish).toBeDisabled()
    expect((await readProgress())?.completedSteps ?? []).toEqual([])

    await first.click()
    const next = page.getByRole('button', { name: /Next Step/ }).last()
    for (let i = 1; i < sample.steps; i++) {
      await next.click()
      await expect(steps.getByRole('button').nth(i)).toHaveAttribute('aria-current', 'step')
    }
    await expect(finish).toBeEnabled()
    await finish.click()
    await expect(page.getByRole('button', { name: 'Workshop steps recorded' })).toBeDisabled()
    expect(await readProgress()).toMatchObject({
      status: sample.state,
      completedSteps: expect.arrayContaining(['csr', sample.id]),
    })
  })
}
