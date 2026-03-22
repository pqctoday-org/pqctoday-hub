// SPDX-License-Identifier: GPL-3.0-only
import { JSDOM } from 'jsdom'
import { ComplianceRecord } from './types.js'
import { fetchWithRetry, getDataCutoffDate, NIST_RETRY_CONFIG } from './utils.js'

// Max valid ipp for NIST CAVP search (valid: 25, 50, 75, 100, 250)
const NIST_IPP = 250

export const scrapeACVP = async (): Promise<ComplianceRecord[]> => {
  // NIST CAVP: fetch each PQC algorithm group separately and merge (dedup by cert ID)
  const algorithmGroups = [
    { name: 'ML-KEM', ids: [179, 180] },
    { name: 'ML-DSA', ids: [176, 177, 178] },
    { name: 'SLH-DSA', ids: [181, 182, 183] },
    { name: 'LMS', ids: [173, 174, 175] },
  ]

  const allRecords: ComplianceRecord[] = []
  const seenIds = new Set<string>()
  // Track which PQC algorithms each cert covers (a cert may appear in multiple groups)
  const certPqcAlgos = new Map<string, Set<string>>()

  for (const group of algorithmGroups) {
    try {
      console.log(`[ACVP] Fetching ${group.name} validations...`)
      const algoParams = group.ids.map((id) => `algorithm=${id}`).join('&')

      // Paginate: fetch page 1, then subsequent pages if more results exist
      let page = 1
      let totalGroupRows = 0

      while (true) {
        const url = `https://csrc.nist.gov/projects/cryptographic-algorithm-validation-program/validation-search?searchMode=validation&productType=-1&${algoParams}&ipp=${NIST_IPP}&page=${page}`

        const html = await fetchWithRetry(url, NIST_RETRY_CONFIG)
        const dom = new JSDOM(html)
        const doc = dom.window.document

        const allRows = Array.from(doc.querySelectorAll('tr'))
        const candidateRows = allRows.filter((row) => {
          const cells = row.querySelectorAll('td')
          return cells.length >= 4
        })

        console.log(`[ACVP] ${group.name} page ${page}: ${candidateRows.length} rows`)

        if (candidateRows.length === 0) break

        for (const row of candidateRows) {
          const cells = row.querySelectorAll('td')
          const vendor = cells[0]?.textContent?.trim() || 'Unknown'

          const implCell = cells[1]
          const implLink = implCell?.querySelector('a')
          const moduleName =
            implLink?.textContent?.trim() || implCell?.textContent?.trim() || 'Unknown'
          const relativeLink = implLink?.getAttribute('href') || ''

          const certId = cells[2]?.textContent?.trim() || `acvp-${Math.random()}`

          // Track PQC algorithm coverage per cert (across groups)
          if (!certPqcAlgos.has(certId)) certPqcAlgos.set(certId, new Set())
          certPqcAlgos.get(certId)!.add(group.name)

          // Skip duplicates (same cert may appear in multiple algorithm queries)
          if (seenIds.has(certId)) continue
          seenIds.add(certId)

          const dateStr = cells[3]?.textContent?.trim()
          const date = dateStr
            ? new Date(dateStr).toISOString().split('T')[0]
            : new Date().toISOString().split('T')[0]

          // Apply rolling 2-year filter
          if (new Date(date) < getDataCutoffDate()) continue

          const fullLink = relativeLink.startsWith('http')
            ? relativeLink
            : `https://csrc.nist.gov/projects/cryptographic-algorithm-validation-program/${relativeLink}`

          // PQC coverage derived from algorithm group — no detail fetch needed
          // since we're already filtering by PQC algorithm IDs
          allRecords.push({
            id: certId,
            source: 'NIST',
            date,
            link: fullLink,
            type: 'ACVP',
            status: 'Active',
            pqcCoverage: group.name, // Will be enriched with multi-group coverage below
            productName: moduleName,
            productCategory: 'Algorithm Implementation',
            vendor,
          })
        }

        totalGroupRows += candidateRows.length

        // Check if there are more pages: if we got a full page of results, try next page
        if (candidateRows.length >= NIST_IPP) {
          page++
          // Safety: don't paginate forever
          if (page > 20) {
            console.warn(`[ACVP] ${group.name}: Hit pagination safety limit (20 pages)`)
            break
          }
          await new Promise((r) => setTimeout(r, 1000))
        } else {
          break
        }
      }

      console.log(`[ACVP] ${group.name}: ${totalGroupRows} total rows across ${page} page(s)`)
    } catch (error) {
      // Per-group error handling: log and continue to next group
      console.warn(`[ACVP] ${group.name} scrape failed:`, (error as Error).message)
      console.warn(`[ACVP] Continuing with remaining algorithm groups...`)
    }
  }

  // Enrich PQC coverage: certs that appear in multiple groups get combined coverage
  // e.g., a cert with both ML-KEM and ML-DSA → "ML-KEM, ML-DSA"
  for (const record of allRecords) {
    const algos = certPqcAlgos.get(record.id)
    if (algos && algos.size > 0) {
      record.pqcCoverage = Array.from(algos).sort().join(', ')
    }
  }

  console.log(`[ACVP] Total unique records collected: ${allRecords.length}`)
  return allRecords
}
