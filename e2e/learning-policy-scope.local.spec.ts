// SPDX-License-Identifier: AGPL-3.0-only
import { text } from 'node:stream/consumers'
import { expect, test } from './fixtures/blockAnalytics'

const cases = [
  {
    id: 'compliance-strategy',
    covered: 'Customer archive service on the signed schedule',
    outside: 'Regional archive contract without the addendum',
    excess2031: 5,
    margin2030: 3,
  },
  {
    id: 'pqc-risk-management',
    covered: 'Primary replication service',
    outside: 'Standby replication service named in the exception',
    excess2031: 7,
    margin2030: 4,
  },
  {
    id: 'healthcare-pqc',
    covered: 'Clinical transfer to the contracted archive',
    outside: 'Research transfer under a separate agreement',
    excess2031: 8,
    margin2030: 5,
  },
  {
    id: 'web-gateway-pqc',
    covered: 'Edge-to-origin production TLS link',
    outside: 'Developer-only staging TLS link',
    excess2031: 5,
    margin2030: 3,
  },
  {
    id: 'software-supply-chain-pqc',
    covered: 'Production package distributed to customers',
    outside: 'Unsigned nightly artifact on an internal test runner',
  },
  {
    id: 'code-signing',
    covered: 'Public desktop updater manifest',
    outside: 'Disposable integration-test manifest with its own policy',
  },
]

for (const width of [1280, 390]) {
  for (const scenario of cases) {
    test(`${scenario.id} policy follows the selected scope at ${width}px`, async ({ page }) => {
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
      await page.goto(`/learn/${scenario.id}?tab=workshop&step=0`)
      const practice = page.getByText('Practice: policy scope, algorithm use and retention risk', {
        exact: true,
      })
      await practice.click()
      const worksheet = practice.locator('..')
      const scope = worksheet.getByRole('combobox', { name: 'System or artifact to evaluate' })
      const year = worksheet.getByLabel('Migration completion year')
      const evaluate = worksheet.getByRole('button', { name: 'Evaluate the fictional scenario' })
      const result = worksheet.getByRole('status', { name: 'Policy scenario result' })
      const retention = worksheet.getByRole('checkbox', { name: /^Long-lived data/ })
      const isKeyExchange = scenario.excess2031 !== undefined

      await expect(scope.getByRole('option', { name: scenario.covered })).toBeAttached()
      await expect(scope.getByRole('option', { name: scenario.outside })).toBeAttached()
      await evaluate.click()
      await expect(result).toContainText('2031 exceeds this policy')
      await expect(result).toContainText('mismatch:')
      if (isKeyExchange) {
        await expect(result).toContainText(`${scenario.excess2031} years beyond`)
      } else {
        await expect(result).toContainText('Evaluate the required lifetime of signing trust')
        await expect(retention).toHaveCount(0)
      }

      await scope.selectOption('outside')
      await expect(result).toBeEmpty()
      await expect(worksheet.getByRole('button', { name: '.md', exact: true })).toHaveCount(0)
      await evaluate.click()
      await expect(result).toContainText('out-of-scope')
      await expect(result).not.toContainText('exceeds this policy')
      if (isKeyExchange) await expect(result).toContainText(`${scenario.excess2031} years beyond`)

      const downloadButton = worksheet.getByRole('button', { name: '.md', exact: true })
      const [download] = await Promise.all([page.waitForEvent('download'), downloadButton.click()])
      const markdown = await text(await download.createReadStream())
      expect(markdown).toContain(scenario.outside)
      expect(markdown).toContain('"applies":false')
      expect(markdown).toContain('out-of-scope')
      expect(markdown).not.toContain('exceeds this policy')
      if (isKeyExchange) {
        expect(markdown).toContain(`${scenario.excess2031} years beyond`)
      } else {
        expect(markdown).not.toContain('years beyond')
      }

      await scope.selectOption('covered')
      await year.fill('2027')
      await evaluate.click()
      await expect(worksheet.getByRole('alert')).toContainText('from 2028')
      await year.fill('2030')
      await worksheet.getByRole('button', { name: 'Sample algorithm' }).click()
      await page
        .getByRole('option', { name: isKeyExchange ? 'ML-KEM-768' : 'ML-DSA-65', exact: true })
        .click()
      if (isKeyExchange) await retention.uncheck()
      await evaluate.click()
      await expect(result).toContainText('No contradiction under these sample inputs')
      if (isKeyExchange)
        await expect(result).toContainText(`${scenario.margin2030} years of margin`)
    })
  }
}
