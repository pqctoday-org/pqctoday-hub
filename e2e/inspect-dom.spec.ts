/* eslint-disable */
import { test, expect } from '@playwright/test'

test('inspect DOM structure', async ({ page }) => {
  await page.goto('http://localhost:5173/learn/5g-security')
  await page.waitForLoadState('networkidle')

  // Enable test mode
  await page.evaluate(() => {
    // @ts-ignore
    if (window.fiveGService) {
      // @ts-ignore
      window.fiveGService.enableTestMode({
        profileA: {
          hnPriv: `-----BEGIN PRIVATE KEY-----
MC4CAQAwBQYDK2VuBCIEILR8vjM1ijkP7f+d9g9g9g9g9g9g9g9g9g9g9g9g9g9g
-----END PRIVATE KEY-----`,
          ephPriv: `-----BEGIN PRIVATE KEY-----
MC4CAQAwBQYDK2VuBCIEIKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq
-----END PRIVATE KEY-----`,
        },
      })
    }
  })

  await page.waitForTimeout(1000)
  await page.click('button[data-testid="profile-a-btn"]')
  await page.waitForTimeout(500)

  // Execute first step
  await page.click('button:has-text("Execute Step")')
  await page.waitForTimeout(2000)

  // Get all pre elements and their parent info
  const preInfo = await page.evaluate(() => {
    const pres = Array.from(document.querySelectorAll('pre'))
    return pres.map((pre, idx) => ({
      index: idx,
      text: pre.textContent?.substring(0, 100),
      classes: pre.className,
      parentClasses: pre.parentElement?.className,
      grandparentClasses: pre.parentElement?.parentElement?.className,
    }))
  })

  console.log('=== PRE ELEMENTS ===')
  console.log(JSON.stringify(preInfo, null, 2))
})
