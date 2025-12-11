import { JSDOM } from 'jsdom'
import { ComplianceRecord } from './types.js'
import { fetchText, extractAlgorithms, PQC_PATTERNS, CLASSICAL_PATTERNS } from './utils.js'

export const scrapeNIST = async (): Promise<ComplianceRecord[]> => {
  try {
    const url =
      'https://csrc.nist.gov/projects/cryptographic-module-validation-program/validated-modules/search/all?searchMode=Advanced&Standard=FIPS+140-3&ValidationStatus=Active&SecurityLevel=3'
    const html = await fetchText(url)
    const dom = new JSDOM(html)
    const doc = dom.window.document

    // NIST Search Table ID: searchResultsTable
    const rows = Array.from(doc.querySelectorAll('#searchResultsTable tr')).slice(1) // Skip header

    console.log(`[NIST] Found ${rows.length} FIPS 140-3 L3 candidates. Processing details...`)

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
        const vendor = cells[1]?.textContent?.trim() || 'Unknown'
        const moduleName = cells[2]?.textContent?.trim() || 'Unknown Module'

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
        const fullLink = relativeLink.startsWith('http')
          ? relativeLink
          : `https://csrc.nist.gov${relativeLink}`

        // detail fetch for PQC & Classical
        if (relativeLink) {
          try {
            const detailUrl = relativeLink.startsWith('http')
              ? relativeLink
              : `https://csrc.nist.gov${relativeLink}`
            const detailHtml = await fetchText(detailUrl)
            const detailDom = new JSDOM(detailHtml)
            const detailText = detailDom.window.document.body.textContent || ''

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
          certificationLevel: 'FIPS 140-3 L3',
        }
      })

      const results = await Promise.all(batchPromises)
      const valid = results.filter((r) => r !== null) as ComplianceRecord[]
      records.push(...valid)

      if (i % 50 === 0) console.log(`[NIST] Processed ${i} / ${rows.length} records...`)
      await new Promise((r) => setTimeout(r, 500))
    }

    return records
  } catch (error) {
    console.warn('NIST Scrape Failed:', error)
    return []
  }
}
