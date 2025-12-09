import { test } from '@playwright/test'

test('debug page content', async ({ page }) => {
  await page.goto('http://localhost:5173/learn/5g-security')
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(3000) // Wait plenty
  const content = await page.content()
  console.log('--- PAGE CONTENT START ---')
  console.log(content)
  console.log('--- PAGE CONTENT END ---')
})
