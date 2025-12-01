const { chromium } = require('playwright')
const { injectAxe, getViolations } = require('axe-playwright')

  ; (async () => {
    const browser = await chromium.launch()
    const page = await browser.newPage()

    console.log('Running accessibility audit on http://localhost:5173\n')

    await page.goto('http://localhost:5173')
    await injectAxe(page)

    try {
      const violations = await getViolations(page)

      if (violations.length === 0) {
        console.log('✅ No accessibility violations found!')
      } else {
        console.log(`❌ Found ${violations.length} accessibility violations:\n`)

        violations.forEach((violation, index) => {
          console.log(`${index + 1}. ${violation.id} (${violation.impact})`)
          console.log(`   Description: ${violation.description}`)
          console.log(`   Help: ${violation.help}`)
          console.log(`   Affected elements: ${violation.nodes.length}`)
          violation.nodes.slice(0, 3).forEach((node) => {
            console.log(`   - ${node.html.substring(0, 100)}...`)
          })
          console.log('')
        })
      }
    } catch (error) {
      console.error('Error running accessibility audit:', error)
    }

    await browser.close()
  })()
