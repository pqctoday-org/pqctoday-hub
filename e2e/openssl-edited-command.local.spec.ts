// SPDX-License-Identifier: AGPL-3.0-only
import { createHash } from 'node:crypto'
import { expect, test } from './fixtures/blockAnalytics'

const file = 'hub-digest-sample.txt'
const content = 'PQCToday OpenSSL digest practice\n'
const sha256 = createHash('sha256').update(content).digest('hex')
const sha512 = createHash('sha512').update(content).digest('hex')

for (const width of [1280, 390]) {
  for (const route of ['/playground/openssl-studio', '/openssl']) {
    test(`OpenSSL runs edited digest commands on ${route} at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 })
      await page.addInitScript(() => {
        localStorage.setItem(
          'pqc-disclaimer-storage',
          JSON.stringify({ state: { acknowledgedMajorVersion: 99 }, version: 0 })
        )
      })
      await page.goto(route)
      await page.getByRole('tab', { name: 'Workbench', exact: true }).click()
      await page.getByText('Edit an OpenSSL digest command', { exact: true }).click()
      const form = page.getByRole('form', { name: 'OpenSSL digest command practice' })
      const command = form.getByRole('textbox', { name: 'OpenSSL digest command' })
      const submit = form.getByRole('button', { name: 'Run digest command' })
      const result = form.getByRole('status')
      const error = form.getByRole('alert')
      await expect(form.getByRole('link', { name: 'OpenSSL 3.6 digest options' })).toHaveAttribute(
        'href',
        'https://docs.openssl.org/3.6/man1/openssl-dgst/#options'
      )
      await expect(command).toHaveValue(`openssl dgst -sha256 ${file}`)
      await expect(submit).toBeEnabled({ timeout: 25_000 })
      await command.press('Enter')
      await expect(result).toContainText(sha256)

      await command.fill(`openssl dgst -sha512 ${file}`)
      await expect(result).toHaveCount(0)
      await submit.click()
      await expect(result).toContainText(sha512)

      await command.fill('openssl dgst -sha512 missing-digest-sample.txt')
      await submit.click()
      await expect(error).toContainText(/missing-digest-sample|OpenSSL exited with status/i)
      await expect(result).toHaveCount(0)

      await command.fill(`openssl dgst -sha256 ${file}`)
      await expect(error).toHaveCount(0)
      await command.press('Enter')
      await expect(result).toContainText(sha256)
    })
  }
}
