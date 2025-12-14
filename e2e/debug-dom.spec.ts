import { test, expect } from '@playwright/test'

test('debug page content', async ({ page }) => {
  await page.goto('/learn/5g-security')
  await expect(page.getByRole('heading', { name: '5G Security' })).toBeVisible()
  await page.waitForTimeout(3000) // Wait plenty
  const content = await page.content()
  console.log('--- PAGE CONTENT START ---')
  console.log(content)
  console.log('--- PAGE CONTENT END ---')
})
