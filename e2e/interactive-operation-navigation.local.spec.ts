// SPDX-License-Identifier: AGPL-3.0-only
import { createHash } from 'node:crypto'
import type { Page } from '@playwright/test'
import { expect, test } from './fixtures/blockAnalytics'

const digest = (sample: string) => createHash('sha256').update(sample, 'utf8').digest('hex')

test.beforeEach(async ({ page }) => {
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
})

function operation(page: Page, width: number, name: string) {
  return page.getByRole(width === 390 ? 'button' : 'tab', { name, exact: true })
}

for (const width of [1280, 390]) {
  test(`hash the exact UTF-8 input and keep the operation route at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 })
    await page.goto('/playground/interactive?tab=hashing')
    await expect(
      page.getByRole('heading', { name: 'Cryptographic Hashing', exact: true })
    ).toBeVisible()
    const input = page.getByLabel('Data to hash (UTF-8)')
    const output = page.getByLabel('Hash Result (Hex)')
    const compute = page.getByRole('button', { name: 'Compute Hash' })
    await input.fill('π')
    await compute.press('Space')
    await expect(output).toHaveValue(digest('π'))

    const inputBox = input.locator('..')
    await inputBox.getByRole('button', { name: 'HEX', exact: true }).press('Space')
    await expect(input).toHaveValue('cf80')
    await input.fill('c')
    await expect(input).toHaveAttribute('aria-invalid', 'true')
    await expect(output).toHaveValue('')
    await expect(compute).toBeDisabled()
    await input.fill('616263')
    await compute.press('Space')
    await expect(output).toHaveValue(digest('abc'))
    await expect(page.getByText('Hash length: 32 bytes (64 hex chars)')).toBeVisible()

    await operation(page, width, 'Data').press('Enter')
    await expect(page).toHaveURL(/tab=data/)
    await operation(page, width, width === 390 ? 'Hashing' : 'Hash').press('Enter')
    await expect(output).toHaveValue(digest('abc'))
    await page.reload()
    await expect(
      page.getByRole('heading', { name: 'Cryptographic Hashing', exact: true })
    ).toBeVisible()
    await expect(output).toHaveValue('')
  })

  test(`AES-GCM fails on changed ciphertext and recovers at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    await page.goto('/playground/interactive?tab=keystore')
    await page.getByRole('button', { name: 'RSA-2048 (2048 bits)' }).click()
    await page.getByRole('option', { name: 'AES-128-GCM', exact: true }).click()
    await page.getByRole('button', { name: 'Generate Classical Keys', exact: true }).click()
    await operation(page, width, width === 390 ? 'Symmetric' : 'Sym Encrypt').press('Enter')
    await expect(
      page.getByRole('heading', { name: 'Symmetric Encryption (AES-GCM)' })
    ).toBeVisible()
    await page.getByRole('button', { name: 'AES key', exact: true }).click()
    await page.getByRole('option', { name: /AES-128/ }).click()
    const plaintext = page.getByLabel('Input Data (Hex/ASCII)')
    const ciphertext = page.getByLabel('Output / Ciphertext (Hex/ASCII)')
    await plaintext.fill('616263')
    await page.getByRole('button', { name: 'Encrypt', exact: true }).press('Space')
    // 12-byte fresh nonce, 3 encrypted input bytes and 16-byte authentication tag.
    await expect(ciphertext).toHaveValue(/^[0-9a-f]{62}$/i)
    const original = await ciphertext.inputValue()
    await plaintext.fill('')
    const decrypt = page.getByRole('button', { name: 'Decrypt', exact: true })
    await ciphertext.fill(`${original.slice(0, -1)}${original.endsWith('0') ? '1' : '0'}`)
    await decrypt.press('Space')
    const failure = page.getByText('AES-GCM rejected this ciphertext.', { exact: false })
    await expect(failure).toBeVisible()
    await expect(failure.locator('xpath=ancestor-or-self::*[@role="alert"]')).toBeFocused()
    await expect(plaintext).toHaveValue('')
    await ciphertext.fill(original)
    await decrypt.press('Space')
    await expect(plaintext).toHaveValue('616263')
    await expect(failure).toHaveCount(0)
    await expect(page).toHaveURL(/tab=symmetric/)
  })
}
