// SPDX-License-Identifier: AGPL-3.0-only
import { expect, test } from './fixtures/blockAnalytics'
import { getViolations, injectAxe } from 'axe-playwright'

const routes = ['/learn/email-signing?tab=workshop&step=4', '/playground/email-signing']
for (const route of routes) {
  for (const width of [1280, 390]) {
    test(`received CMS body fails verification when changed at ${width}px on ${route}`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 900 })
      await page.addInitScript(() => {
        localStorage.setItem(
          'pqc-disclaimer-storage',
          JSON.stringify({ state: { acknowledgedMajorVersion: 99 }, version: 0 })
        )
      })
      await page.goto(route)
      if (route.startsWith('/playground/')) {
        const demos = page.getByRole('button', { name: /^Step 4 — Live HSM Demos/ })
        await expect(demos).toHaveAttribute('aria-expanded', 'true')
        await demos.focus()
        await page.keyboard.press('Enter')
        await expect(demos).toBeFocused()
        await expect(demos).toHaveAttribute('aria-expanded', 'false')
        await page.keyboard.press('Enter')
        await expect(demos).toBeFocused()
        await expect(demos).toHaveAttribute('aria-expanded', 'true')
        await expect(page.getByRole('region', { name: /^Step 4 — Live HSM Demos/ })).toBeVisible()
        const moduleLink = page.getByRole('link', { name: 'Open full module', exact: true })
        await expect(moduleLink).toHaveAttribute('href', '/learn/email-signing')
        await expect(moduleLink.getByRole('button')).toHaveCount(0)
      }
      const softwareKey = page.getByLabel('Use HSM key', { exact: true })
      await expect(softwareKey.first()).toBeVisible({ timeout: 25_000 })
      const sample = page
        .getByRole('heading', { name: 'ML-DSA CMS sign + verify (end-to-end)' })
        .locator('../..')
      const hsmKey = sample.getByLabel('Use HSM key', { exact: true })
      if (await hsmKey.isChecked()) await hsmKey.uncheck()
      const original = 'Fictional release approval for Sample A.'
      await sample
        .getByRole('textbox', { name: 'Payload', exact: true })
        .fill(original, { timeout: 7000 })
      await sample.getByRole('button', { name: 'Sign + Verify' }).click()
      await expect(sample.getByText('Signature verifies against signer cert')).toBeVisible({
        timeout: 35_000,
      })
      const exercise = sample.getByRole('region', { name: 'Verify a received CMS message' })
      await expect(exercise).toBeVisible()
      const body = exercise.getByLabel('Received message body')
      await expect(body).toHaveValue(original)
      const verify = exercise.getByRole('button', { name: 'Verify received message' })
      const result = exercise.getByRole('status', { name: 'Received CMS result' })
      await verify.click()
      await expect(result).toContainText('Message integrity verified.')
      await expect(result).toContainText('self-signed sample certificate as its local trust anchor')

      await body.fill(original.replace('Sample A', 'Sample B'))
      await verify.click()
      await expect(result).toContainText('Message rejected. CMS integrity verification failed.')

      await exercise.getByRole('button', { name: 'Restore original body' }).click()
      await expect(body).toHaveValue(original)
      await verify.click()
      await expect(result).toContainText('Message integrity verified.')

      await injectAxe(page)
      const violations = await getViolations(page, 'main', {
        runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa'] },
      })
      expect(
        violations.filter((violation) => ['critical', 'serious'].includes(violation.impact ?? '')),
        `${route} at ${width}px`
      ).toEqual([])
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth - document.documentElement.clientWidth
        )
      ).toBeLessThanOrEqual(1)
    })
  }
}
