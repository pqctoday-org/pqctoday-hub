import { test, expect } from '@playwright/test'

test.describe('OpenSSL Studio - Debug Providers', () => {
  test.beforeEach(async ({ page }) => {
    page.on('console', (msg) => console.log(`BROWSER LOG: ${msg.text()}`))
    await page.goto('/')
    await page.getByRole('button', { name: /OpenSSL/ }).click()
    await expect(page.getByRole('heading', { name: 'OpenSSL Studio', level: 2 })).toBeVisible()
  })

  test.afterEach(async ({ page }, testInfo) => {
    if (testInfo.status !== 'passed') {
      const logs = await page
        .locator('table tbody tr td:nth-child(2)')
        .allInnerTexts()
        .catch(() => ['No terminal output found'])
      console.log(`TERMINAL OUTPUT for ${testInfo.title}:\n${logs.join('\n')}`)
    }
  })

  test('List Providers', async ({ page }) => {
    // 1. Select Version Info (which now runs list -providers)
    await page.getByRole('button', { name: 'Version Info' }).click()

    // 2. Run Command
    await page.getByRole('button', { name: 'Run Command' }).click()

    // 3. Wait for output
    await page.waitForTimeout(2000) // Give it a moment to run

    // 4. Capture output
    const logs = await page.locator('table tbody tr td:nth-child(2)').allInnerTexts()
    console.log('PROVIDERS OUTPUT:\n', logs.join('\n'))
  })
})
