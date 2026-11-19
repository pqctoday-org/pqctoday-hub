// SPDX-License-Identifier: AGPL-3.0-only
import { expect, test } from './fixtures/blockAnalytics'
import { getViolations, injectAxe } from 'axe-playwright'

const routes = [
  { target: 'Learn', route: '/learn/digital-id?tab=workshop' },
  { target: 'Playground', route: '/playground/digital-id' },
]
for (const { target, route } of routes) {
  for (const width of [1280, 390]) {
    test(`the sample bank requires the diploma and verified PID disclosures in ${target} at ${width}px`, async ({
      page,
    }) => {
      test.setTimeout(90_000)
      await page.addInitScript(() => {
        localStorage.setItem(
          'pqc-disclaimer-storage',
          JSON.stringify({ state: { acknowledgedMajorVersion: 99 }, version: 0 })
        )
      })
      await page.setViewportSize({ width, height: 900 })
      await page.goto(route)
      const step = (name: string) => page.getByRole('button', { name, exact: true }).first()

      await step('Step 1: EUDI Wallet').click()
      await expect(page.getByText('No credentials installed yet.')).toBeVisible()
      await step('Step 2: PID Issuer').click()
      await step('Start Issuance Flow').click()
      await step('Proceed with Authentication').click()
      await expect(page.getByText(/PID has been securely stored/)).toBeVisible({ timeout: 25_000 })
      await step('Step 4: Bank (RP)').click()
      await step('Login with Wallet').click()
      await step('Consent & Share').click()
      await step('Check Verification Result').click()
      await expect(page.getByRole('alert').filter({ hasText: 'degree (diploma)' })).toBeVisible()
      await expect(page.getByRole('heading', { name: 'Account Opening Refused' })).toBeVisible()

      await step('Step 3: University').click()
      await step('Login to Student Portal').click()
      await step('Share PID Data').click()
      await step('Issue Diploma').click()
      await expect(page.getByRole('heading', { name: 'Diploma Added!' })).toBeVisible({
        timeout: 25_000,
      })
      await step('Step 4: Bank (RP)').click()
      await step('Login with Wallet').click()
      await expect(page.getByRole('checkbox', { name: 'family_name (diploma)' })).not.toBeChecked()
      await expect(page.getByRole('checkbox', { name: 'birth_date (PID)' })).not.toBeChecked()
      await page.getByRole('checkbox', { name: 'age_over_18 (PID)' }).uncheck()
      await step('Consent & Share').click()
      await step('Check Verification Result').click()
      await expect(page.getByRole('alert').filter({ hasText: 'age_over_18 (PID)' })).toBeVisible()

      await step('Choose again').click()
      await step('Consent & Share').click()
      await page.getByRole('checkbox', { name: 'Verify for another recipient' }).check()
      await step('Check Verification Result').click()
      await expect(page.getByRole('alert').filter({ hasText: 'audience mismatch' })).toBeVisible()

      await step('Choose again').click()
      await step('Consent & Share').click()
      await step('Check Verification Result').click()
      await expect(
        page.getByRole('heading', { name: 'Sample account opening accepted' })
      ).toBeVisible({ timeout: 25_000 })

      await step('Step 5: QTSP (QES)').click()
      await expect(
        page.getByText(/this exercise uses local sample keys and simulated authorization/i)
      ).toBeVisible()
      await page.getByRole('button', { name: 'Proceed to Sign' }).click()
      await expect(page.getByText('Authorization Required')).toBeVisible()
      await page.getByRole('button', { name: 'Authorize Access' }).click()
      await page.getByRole('button', { name: 'Sign Document' }).click()
      await expect(page.getByRole('heading', { name: 'Sample Signature Checked' })).toBeVisible({
        timeout: 25_000,
      })
      await expect(page.getByText(/does not establish legal QES status/i)).toBeVisible()

      // Exercise accessibility after the actual wallet and relying-party flow
      // has rendered its result states, at both desktop and phone widths.
      await injectAxe(page)
      const violations = await getViolations(page, undefined, {
        runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa'] },
      })
      expect(violations, `${target} completed flow at ${width}px`).toEqual([])
      const dimensions = await page.evaluate(() => ({
        viewport: document.documentElement.clientWidth,
        content: document.documentElement.scrollWidth,
      }))
      expect(
        dimensions.content,
        `${target} completed flow at ${width}px overflows`
      ).toBeLessThanOrEqual(dimensions.viewport)
    })
  }
}
