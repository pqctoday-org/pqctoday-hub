import { JSDOM } from 'jsdom'
import { ComplianceRecord } from './types.js'
import { fetchText, extractAlgorithms, PQC_PATTERNS, CLASSICAL_PATTERNS } from './utils.js'

export const scrapeACVP = async (): Promise<ComplianceRecord[]> => {
  try {
    // NIST ACVP has query limits when using multiple algorithm filters
    // Solution: Fetch each algorithm group separately and merge
    const algorithmGroups = [
      { name: 'ML-KEM', ids: [179, 180] },
      { name: 'ML-DSA', ids: [176, 177, 178] },
      { name: 'LMS', ids: [173, 174, 175] },
    ]

    const allRecords: ComplianceRecord[] = []
    const seenIds = new Set<string>()

    for (const group of algorithmGroups) {
      console.log(`[ACVP] Fetching ${group.name} validations...`)
      const algoParams = group.ids.map((id) => `algorithm=${id}`).join('&')
      const url = `https://csrc.nist.gov/projects/cryptographic-algorithm-validation-program/validation-search?searchMode=implementation&productType=-1&${algoParams}&ipp=10000`

      const html = await fetchText(url)
      const dom = new JSDOM(html)
      const doc = dom.window.document

      const allRows = Array.from(doc.querySelectorAll('tr'))
      const candidateRows = allRows.filter((row) => {
        const cells = row.querySelectorAll('td')
        return cells.length >= 4
      })

      console.log(`[ACVP] ${group.name}: Found ${candidateRows.length} rows`)

      for (const row of candidateRows) {
        const cells = row.querySelectorAll('td')
        const vendor = cells[0]?.textContent?.trim() || 'Unknown'

        const implCell = cells[1]
        const implLink = implCell?.querySelector('a')
        const moduleName =
          implLink?.textContent?.trim() || implCell?.textContent?.trim() || 'Unknown'
        const relativeLink = implLink?.getAttribute('href') || ''

        const certId = cells[2]?.textContent?.trim() || `acvp-${Math.random()}`

        // Skip duplicates (same cert may appear in multiple algorithm queries)
        if (seenIds.has(certId)) continue
        seenIds.add(certId)

        const dateStr = cells[3]?.textContent?.trim()
        const date = dateStr
          ? new Date(dateStr).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0]

        // Apply 2-year filter
        if (new Date(date) < new Date('2022-01-01')) continue

        let pqcCoverage: boolean | string = 'No PQC Mechanisms Detected'
        let classicalAlgorithms = ''
        const fullLink = relativeLink.startsWith('http')
          ? relativeLink
          : `https://csrc.nist.gov/projects/cryptographic-algorithm-validation-program/${relativeLink}`

        // PQC Heuristic Fallback
        if (
          moduleName.toLowerCase().includes('files') ||
          moduleName.toLowerCase().includes('lms') ||
          moduleName.toLowerCase().includes('xmss') ||
          moduleName.toLowerCase().includes('kyber') ||
          moduleName.toLowerCase().includes('dilithium')
        ) {
          pqcCoverage = 'Potentially PQC'
        }

        // Deep Fetch
        if (relativeLink) {
          try {
            const detailUrl = `https://csrc.nist.gov/projects/cryptographic-algorithm-validation-program/${relativeLink}`
            const detailHtml = await fetchText(detailUrl)
            const detailDom = new JSDOM(detailHtml)
            const detailText = detailDom.window.document.body.textContent || ''

            const pqcStr = extractAlgorithms(detailText, PQC_PATTERNS)
            if (pqcStr) pqcCoverage = pqcStr
            else if (pqcCoverage === 'Potentially PQC') pqcCoverage = 'No PQC Mechanisms Detected'

            classicalAlgorithms = extractAlgorithms(detailText, CLASSICAL_PATTERNS)
          } catch (e: any) {
            console.warn(`Failed to fetch details for ${certId}:`, e.message)
          }
        }

        allRecords.push({
          id: certId,
          source: 'NIST',
          date,
          link: fullLink,
          type: 'ACVP',
          status: 'Active',
          pqcCoverage,
          classicalAlgorithms,
          productName: moduleName,
          productCategory: 'Algorithm Implementation',
          vendor,
        })

        await new Promise((r) => setTimeout(r, 100))
      }
    }

    console.log(`[ACVP] Total unique records collected: ${allRecords.length}`)
    return allRecords
  } catch (error) {
    console.warn('ACVP Scrape Failed:', error)
    return []
  }
}
