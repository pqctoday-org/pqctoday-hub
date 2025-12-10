/* eslint-disable */
import { test, expect } from '@playwright/test'

test('inspect output after execution', async ({ page }) => {
  await page.goto('/learn/5g-security')
  await page.waitForLoadState('networkidle')

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
  await page.waitForTimeout(3000) // Wait for execution to complete

  // Get ALL text content to see where output is
  const allText = await page.evaluate(() => {
    // Find elements that might contain "SUCCESS" or output
    const candidates = Array.from(document.querySelectorAll('*')).filter((el) => {
      const text = el.textContent || ''
      return text.includes('SUCCESS') || text.includes('Home Network') || text.includes('═══')
    })

    return candidates.slice(0, 5).map((el) => ({
      tag: el.tagName,
      classes: el.className,
      text: el.textContent?.substring(0, 200),
    }))
  })

  console.log('=== ELEMENTS WITH OUTPUT ===')
  console.log(JSON.stringify(allText, null, 2))

  // Also check all pre elements again
  const preInfo = await page.evaluate(() => {
    const pres = Array.from(document.querySelectorAll('pre'))
    return pres.map((pre, idx) => ({
      index: idx,
      text: pre.textContent?.substring(0, 150),
      classes: pre.className,
    }))
  })

  console.log('\n=== ALL PRE ELEMENTS ===')
  console.log(JSON.stringify(preInfo, null, 2))
})
