// SPDX-License-Identifier: AGPL-3.0-only
import { readFileSync } from 'node:fs'
import { expect, test } from './fixtures/blockAnalytics'
const vectors = JSON.parse(
  readFileSync(
    new URL(
      '../src/components/PKILearning/modules/Entropy/utils/hmacDrbgSha256.kat.json',
      import.meta.url
    ),
    'utf-8'
  )
) as { cases: Array<{ id: string; returnedBits: string }> }

const routes = ['/learn/entropy-randomness?tab=workshop&step=3', '/playground/drbg-demo']
for (const route of routes) {
  for (const width of [1280, 390]) {
    test(`HMAC_DRBG reproduces published bytes and resumes after reseed at ${width}px on ${route}`, async ({
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
      await page.getByRole('button', { name: 'Run known-answer check', exact: true }).click()
      const fixture = vectors.cases[0]
      const kat = page.getByTestId('drbg-kat-result')
      await expect(kat).toContainText('16/16 vectors matched byte for byte.')
      const details = kat.getByText(`Compare output bytes for ${fixture.id}`, { exact: true })
      await details.click()
      await expect(kat.getByTestId('drbg-published-bytes')).toHaveText(
        fixture.returnedBits.toLowerCase()
      )
      await expect(kat.getByTestId('drbg-computed-bytes')).toHaveText(
        fixture.returnedBits.toLowerCase()
      )

      await page.getByRole('button', { name: 'Instantiate HMAC_DRBG', exact: true }).click()
      const generate = page.getByRole('button', { name: 'Generate', exact: true })
      await expect(generate).toBeEnabled()
      await generate.evaluate((button: HTMLButtonElement) => {
        button.click()
        button.click()
      })
      await expect(page.getByText(/Generated 32 bytes — reseed_counter now 2\./)).toHaveCount(1)

      for (let counter = 3; counter <= 11; counter += 1) {
        await generate.click()
        await expect(
          page.getByText(`Generated 32 bytes — reseed_counter now ${counter}.`, { exact: false })
        ).toBeVisible()
      }
      await expect(generate).toBeDisabled()
      await expect(page.getByText('Reseed required.', { exact: true })).toBeVisible()

      const output = page.getByRole('textbox', { name: 'Last generated DRBG bytes' })
      const oldOutput = await output.inputValue()
      await page.getByRole('button', { name: 'Reseed', exact: true }).click()
      await expect(output).toHaveCount(0)
      await expect(page.getByText(/Reseeded — reseed_counter reset to 1/)).toBeVisible()
      await expect(generate).toBeEnabled()
      await generate.click()
      await expect(output).not.toHaveValue(oldOutput)
      await expect(output).toHaveValue(/[0-9a-f]{2}/i)
    })
  }
}
