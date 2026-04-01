/* eslint-disable */
import fs from 'fs'
import path from 'path'
import { chromium } from 'playwright'
;(async () => {
  const mdPath = path.join(process.cwd(), 'scripts', 'google-refs-failed-links.md')
  const outDir = path.join(process.cwd(), 'scripts', 'downloaded_links')

  // Ensure output directory exists
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true })
  }

  const content = fs.readFileSync(mdPath, 'utf8')
  // Extract everything that looks like a URL
  const urlRegex = /https?:\/\/[^\s]+/g
  const urls = content.match(urlRegex) || []

  // De-duplicate URLs and clean trailing markdown characters
  const uniqueUrls = [...new Set(urls)]
    .map((u) => {
      return u.replace(/[)>\].,;]+$/, '')
    })
    .filter((u) => u.startsWith('http'))

  console.log(`Found ${uniqueUrls.length} unique URLs to process in google-refs-failed-links.md...`)

  let browser
  try {
    browser = await chromium.launch({ headless: true })
  } catch (e) {
    console.error('Failed to launch headless browser:', e.message)
    process.exit(1)
  }

  const context = await browser.newContext({
    userAgent:
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  })

  let successCount = 0
  let blockedCount = 0

  for (let i = 0; i < uniqueUrls.length; i++) {
    const urlString = uniqueUrls[i]
    console.log(`
[${i + 1}/${uniqueUrls.length}] Checking: ${urlString}`)

    const page = await context.newPage()
    try {
      // Try single fetch with 10s timeout, as requested: no retries.
      const response = await page.goto(urlString, { waitUntil: 'domcontentloaded', timeout: 10000 })

      const status = response ? response.status() : null
      const title = await page.title().catch(() => '')

      const blocked =
        status === null ||
        status >= 400 ||
        title.toLowerCase().includes('cloudflare') ||
        title.toLowerCase().includes('just a moment') ||
        title.toLowerCase().includes('access denied') ||
        title.toLowerCase().includes('403') ||
        title.toLowerCase().includes('404') ||
        title.toLowerCase().includes('not found')

      if (blocked) {
        console.log(`❌ BLOCKED [Status: ${status || 'Unknown'}] - Title: ${title}`)
        blockedCount++
      } else {
        const bodyText = await page.evaluate(() => (document.body ? document.body.innerText : ''))

        if (bodyText.trim().length > 150) {
          let parsedUrl
          try {
            parsedUrl = new URL(urlString)
          } catch (e) {
            parsedUrl = { hostname: 'unknown', pathname: urlString }
          }

          let filename = parsedUrl.hostname.replace(/[^a-z0-9]/gi, '_')
          let pathname = parsedUrl.pathname.replace(/[^a-z0-9]/gi, '_').substring(0, 50)
          if (pathname === '_') pathname = ''

          const fullFilename = `${filename}${pathname}.md`
          const filePath = path.join(outDir, fullFilename)

          fs.writeFileSync(
            filePath,
            `URL: ${urlString}
Title: ${title}

${bodyText}`
          )

          console.log(`✅ SUCCESS - Saved content to ${fullFilename}`)
          successCount++
        } else {
          console.log(`❌ BLOCKED - Content empty or block-page detected`)
          blockedCount++
        }
      }
    } catch (e) {
      // Timeout or Navigation error -> mark as blocked
      console.log(`❌ BLOCKED (Error) - ${e.message.split('\n')[0]}`)
      blockedCount++
    } finally {
      await page.close().catch(() => {})
    }
  }

  await browser.close().catch(() => {})
  console.log(`
===========================================`)
  console.log(`Finished processing ${uniqueUrls.length} URLs.`)
  console.log(`Success: ${successCount}`)
  console.log(`Blocked/Failed: ${blockedCount}`)
  console.log(`===========================================`)
})()
