// SPDX-License-Identifier: AGPL-3.0-only
import { test, expect } from './fixtures/blockAnalytics'

test('zero breach probability removes breach loss while retaining migration costs', async ({
  page,
}) => {
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
  await page.goto('/business/tools/cost-of-inaction')
  const probability = page.getByRole('slider', { name: /annual breach probability/i })
  await expect(probability).toBeVisible({ timeout: 20_000 })
  const baseline = await probability.inputValue()
  expect(Number(baseline)).toBeGreaterThan(0)
  await page.getByLabel('Migration cost (USD)', { exact: true }).fill('1000000')
  await page.getByRole('slider', { name: /discount rate/i }).press('Home')
  await probability.press('Home')
  await expect(probability).toHaveValue('0')
  await expect(page.getByText(/expected breach loss is \$0 in both scenarios/i)).toBeVisible()

  const download = page.waitForEvent('download')
  await page.getByRole('button', { name: '.md', exact: true }).click()
  let markdown = ''
  for await (const chunk of await (await download).createReadStream()) markdown += chunk.toString()
  expect(markdown).toMatch(/Annual breach probability \| 0%/)
  expect(markdown).toMatch(/Probability input origin \| Learner (scenario )?assumption/i)
  expect(markdown).toMatch(/Expected breach loss \| \$0 \|/)
  expect(markdown).toMatch(/Migrate now.*\| \$1\.0M \|/i)
  await page.getByRole('button', { name: /reset financial assumptions/i }).click()
  await expect(probability).toHaveValue(baseline)
  await expect(page.getByText(/expected breach loss is \$0 in both scenarios/i)).toHaveCount(0)
})
