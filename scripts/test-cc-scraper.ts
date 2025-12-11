#!/usr/bin/env node
/**
 * Test CC Scraper - Validates URL encoding and lab extraction on 5 records
 */

import { scrapeCC } from './scrapers/cc.js'

async function testCCScraper() {
  console.log('🧪 Testing CC Scraper with 5 records...\n')

  try {
    // Run scraper with limit
    const records = await scrapeCC()

    // Take only first 5 records
    const testRecords = records.slice(0, 5)

    console.log(`✅ Scraped ${testRecords.length} records\n`)

    // Validate each record
    testRecords.forEach((record, index) => {
      console.log(`\n📋 Record ${index + 1}:`)
      console.log(`  Product: ${record.productName}`)
      console.log(`  Vendor: ${record.vendor}`)
      console.log(`  Lab: ${record.lab || '(not found)'}`)
      console.log(`  Link: ${record.link}`)

      // Check if URL is properly encoded
      const hasSpaces = record.link.includes(' ')
      const hasUnencoded = record.link.match(/[()]/g)

      if (hasSpaces) {
        console.log(`  ⚠️  WARNING: URL contains spaces!`)
      }
      if (hasUnencoded) {
        console.log(
          `  ⚠️  WARNING: URL contains unencoded special characters: ${hasUnencoded.join(', ')}`
        )
      }
      if (!hasSpaces && !hasUnencoded) {
        console.log(`  ✅ URL is properly encoded`)
      }

      // Check lab field
      if (record.lab) {
        console.log(`  ✅ Lab field populated`)
      } else {
        console.log(`  ℹ️  Lab field not available (may not be in CSV or PDF)`)
      }
    })

    console.log('\n\n📊 Summary:')
    console.log(`  Total records: ${testRecords.length}`)
    console.log(`  Records with lab: ${testRecords.filter((r) => r.lab).length}`)
    console.log(
      `  Records with encoded URLs: ${testRecords.filter((r) => !r.link.includes(' ')).length}`
    )
  } catch (error) {
    console.error('❌ Test failed:', error)
    process.exit(1)
  }
}

testCCScraper()
