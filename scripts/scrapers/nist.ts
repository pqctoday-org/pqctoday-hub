// SPDX-License-Identifier: GPL-3.0-only
import { JSDOM } from 'jsdom'
import { ComplianceRecord } from './types.js'
import {
  fetchWithRetry,
  extractAlgorithms,
  PQC_PATTERNS,
  CLASSICAL_PATTERNS,
  NIST_RETRY_CONFIG,
} from './utils.js'

// Extract the "Overall Level" (1-3) from a NIST CMVP cert detail page.
// The page contains: <span>Overall Level</span> followed by a sibling col with the digit.
const extractSecurityLevel = (detailDom: JSDOM): number | null => {
  const doc = detailDom.window.document
  const spans = Array.from(doc.querySelectorAll('span'))
  for (const span of spans) {
    if (span.textContent?.trim() === 'Overall Level') {
      // The level value is in the adjacent col-md-9 sibling within the same row div
      const rowDiv = span.closest('.row')
      if (rowDiv) {
        const valueCol = rowDiv.querySelector('.col-md-9')
        const raw = valueCol?.textContent?.trim()
        const parsed = parseInt(raw ?? '', 10)
        if (!isNaN(parsed) && parsed >= 1 && parsed <= 3) return parsed
      }
    }
  }
  return null
}

export const scrapeNIST = async (): Promise<ComplianceRecord[]> => {
  // Query all active FIPS 140-3 certs regardless of security level.
  // The actual level is read from each cert's detail page.
  const url =
    'https://csrc.nist.gov/projects/cryptographic-module-validation-program/validated-modules/search/all?searchMode=Advanced&Standard=FIPS+140-3&ValidationStatus=Active'
  try {
    const html = await fetchWithRetry(url, NIST_RETRY_CONFIG)
    const dom = new JSDOM(html)
    const doc = dom.window.document

    // NIST Search Table ID: searchResultsTable
    const rows = Array.from(doc.querySelectorAll('#searchResultsTable tr')).slice(1) // Skip header

    console.log(
      `[NIST] Found ${rows.length} active FIPS 140-3 candidates (all levels). Processing details...`
    )

    const records: ComplianceRecord[] = []
    const BATCH_SIZE = 10

    for (let i = 0; i < rows.length; i += BATCH_SIZE) {
      const batch = rows.slice(i, i + BATCH_SIZE)
      const batchPromises = batch.map(async (row) => {
        const cells = row.querySelectorAll('td')
        if (cells.length < 5) return null

        const certLink = cells[0].querySelector('a')
        const certId =
          certLink?.textContent?.trim() || `nist-${Math.random().toString(36).substr(2, 5)}`
        const relativeLink = certLink?.getAttribute('href') || ''
        // Blank vendor/module = classified government module (CMVP intentionally redacts these)
        const vendor = cells[1]?.textContent?.trim() || 'Classified'
        const moduleName = cells[2]?.textContent?.trim() || 'Classified Module'

        // Normalize date: Some FIPS records have multiple dates or malformed text
        // Extract first valid date pattern (MM/DD/YYYY or YYYY-MM-DD)
        const rawDate = cells[4]?.textContent?.trim() || ''
        let date = new Date().toISOString().split('T')[0]

        // Try to extract first date pattern
        const dateMatch = rawDate.match(/(\d{1,2}\/\d{1,2}\/\d{4})|(\d{4}-\d{2}-\d{2})/)
        if (dateMatch) {
          try {
            const parsedDate = new Date(dateMatch[0])
            if (!isNaN(parsedDate.getTime())) {
              date = parsedDate.toISOString().split('T')[0]
            }
          } catch {
            // Use default
          }
        }

        let pqcCoverage: boolean | string = 'No PQC Mechanisms Detected'
        let classicalAlgorithms = ''
        let certificationLevel = 'FIPS 140-3 L1' // conservative default — L1 is the base level
        const fullLink = relativeLink.startsWith('http')
          ? relativeLink
          : `https://csrc.nist.gov${relativeLink}`

        // detail fetch for PQC, Classical, and actual security level
        if (relativeLink) {
          try {
            const detailUrl = relativeLink.startsWith('http')
              ? relativeLink
              : `https://csrc.nist.gov${relativeLink}`
            const detailHtml = await fetchWithRetry(detailUrl, NIST_RETRY_CONFIG)
            const detailDom = new JSDOM(detailHtml)
            const detailText = detailDom.window.document.body.textContent || ''

            // Extract actual security level from the detail page
            const actualLevel = extractSecurityLevel(detailDom)
            if (actualLevel !== null) {
              certificationLevel = `FIPS 140-3 L${actualLevel}`
            }

            // Extract PQC
            const pqcStr = extractAlgorithms(detailText, PQC_PATTERNS)
            if (pqcStr) pqcCoverage = pqcStr
            else if (
              moduleName.toLowerCase().includes('quantum') ||
              moduleName.toLowerCase().includes('pqc')
            ) {
              pqcCoverage = 'Potentially PQC (Name Match)'
            }

            // Extract Classical
            classicalAlgorithms = extractAlgorithms(detailText, CLASSICAL_PATTERNS)
          } catch {
            // Ignore
          }
        }

        return {
          id: certId,
          source: 'NIST',
          date,
          link: fullLink,
          type: 'FIPS 140-3',
          status: 'Active',
          pqcCoverage,
          classicalAlgorithms,
          productName: moduleName,
          productCategory: 'Cryptographic Module',
          vendor,
          certificationLevel,
        }
      })

      const results = await Promise.all(batchPromises)
      const valid = results.filter((r) => r !== null) as ComplianceRecord[]
      records.push(...valid)

      const processed = Math.min(i + BATCH_SIZE, rows.length)
      if (i % 100 === 0 || processed === rows.length)
        console.log(`[NIST] Processed ${processed} / ${rows.length} records...`)
      await new Promise((r) => setTimeout(r, 750))
    }

    return records
  } catch (error) {
    console.warn('NIST Scrape Failed:', error)
    return []
  }
}
