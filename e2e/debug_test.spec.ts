import { test, expect } from '@playwright/test'

test('debug digital-id', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (err) => errors.push(err.message))
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text())
  })
  await page.goto('/learn/digital-id')

  await page.getByRole('button', { name: /Start the Simulation/i }).click()

  const pidIssuerBtn = page.getByRole('button', { name: /Step 2/i }).first()
  await pidIssuerBtn.click({ force: true })

  try {
    await expect(page.getByText('National Identity Authority')).toBeVisible({ timeout: 2000 })
  } catch (e) {
    console.error('PAGE FAILED!')
    console.error('ERRORS CAUGHT:', errors)
    const body = await page.innerHTML('body')
    console.log('HTML:', body.substring(0, 500))
    throw e
  }
})
