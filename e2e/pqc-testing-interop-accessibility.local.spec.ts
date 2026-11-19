// SPDX-License-Identifier: AGPL-3.0-only
import { expect, test } from './fixtures/blockAnalytics'

test('interop matrix scenario labels are clear and every cell works from the keyboard', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 900 })
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto('/learn/pqc-testing-validation?tab=workshop&step=3')

  await expect(page.getByText('Illustrative matrix:')).toBeVisible()
  await expect(page.getByRole('link', { name: 'Cloudflare PQC support guide' })).toBeVisible()
  const cell = page.getByRole('button', {
    name: /Chrome 131\+ .* to Cloudflare visitor TLS .* Compatible \(expected\)/,
  })
  await cell.focus()
  await expect(cell).toBeFocused()
  await expect(cell).toHaveAttribute('aria-pressed', 'false')
  await page.keyboard.press('Enter')
  await expect(cell).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByText(/Cloudflare documents Chrome 131\+/)).toBeVisible()
  expect(errors).toEqual([])
})
