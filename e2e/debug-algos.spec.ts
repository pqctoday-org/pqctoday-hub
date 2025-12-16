import { test, expect } from '@playwright/test'

test('debug openssl algorithms', async ({ page }) => {
  // Navigate to home first, then to Playground (following the pattern from playground.spec.ts)
  await page.goto('/')
  await page.getByRole('button', { name: /Playground view/i }).click()

  // Wait for Playground to load
  await expect(page.getByRole('heading', { name: 'Interactive Playground', level: 2 })).toBeVisible(
    { timeout: 10000 }
  )

  // Go to Key Store tab
  await page.getByRole('button', { name: /Key Store/ }).click()

  // Try FrodoKEM
  await page.selectOption('#keystore-key-size', 'FrodoKEM-640-AES')
  await page.getByRole('button', { name: 'Generate Keys' }).click()

  // Wait for key generation to complete
  await expect(page.getByRole('table')).toContainText('FrodoKEM', { timeout: 15000 })

  // Take a screenshot
  await page.screenshot({ path: 'debug-algo-support.png' })
})
