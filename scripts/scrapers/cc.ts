import Papa from 'papaparse'
import { createRequire } from 'module'
import { ComplianceRecord } from './types.js'
import { fetchText, extractAlgorithms, PQC_PATTERNS, CLASSICAL_PATTERNS } from './utils.js'

const require = createRequire(import.meta.url)
const { PDFParse } = require('pdf-parse')

export const scrapeCC = async (): Promise<ComplianceRecord[]> => {
  try {
    const url = 'https://www.commoncriteriaportal.org/products/certified_products.csv'
    const csvText = await fetchText(url)

    const records: ComplianceRecord[] = []

    // Parse CSV first
    const parsedData: any[] = await new Promise((resolve) => {
      Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
        complete: (results: any) => resolve(results.data),
        error: () => resolve([]),
      })
    })

    console.log(`[CC] CSV: Found ${parsedData.length} records. Filtering and fetching PDFs...`)

    // Calculate 2-year window cutoff
    const cutoffDate = new Date()
    cutoffDate.setFullYear(cutoffDate.getFullYear() - 2)

    const candidateRecords: any[] = parsedData.filter((row: any) => {
      const dateStr = row['Certification Date'] || ''
      if (!dateStr) return false
      const d = new Date(dateStr)
      // Verify date is valid and within 3 year window
      return !isNaN(d.getTime()) && d >= cutoffDate
    })

    console.log(
      `[CC] Processing ${candidateRecords.length} recent records (>= ${cutoffDate.toISOString().split('T')[0]}). This may take a while...`
    )

    // Process in batches
    const BATCH_SIZE = 5
    for (let i = 0; i < candidateRecords.length; i += BATCH_SIZE) {
      const batch = candidateRecords.slice(i, i + BATCH_SIZE)
      const batchPromises = batch.map(async (row: any) => {
        const name = row['Name'] || 'Unknown Product'
        const certDate = row['Certification Date']
        const categoryRaw = row['Category'] || 'Certified Product'
        const assuranceLevel = row['Assurance Level'] || ''

        const scheme = row['Scheme'] || ''
        const manufacturer = row['Manufacturer'] || 'Unknown Vendor'
        const vendor = scheme ? `${manufacturer} (Scheme: ${scheme})` : manufacturer

        // Generate ID
        const certId = `cc-${name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Math.random().toString(36).substr(2, 4)}`

        // Prioritize Security Target URL
        let pdfUrl = row['Security Target URL'] || row['Certification Report URL'] || ''
        if (pdfUrl && !pdfUrl.startsWith('http')) pdfUrl = ''

        // Also keep a main link for the details button
        const mainLink =
          row['Certification Report URL'] ||
          pdfUrl ||
          'https://www.commoncriteriaportal.org/products/'

        let pqcCoverage: boolean | string = 'No PQC Mechanisms Detected'
        let classicalAlgorithms = ''
        let lab = ''

        // PQC Heuristic on Name
        if (name.toLowerCase().includes('quantum') || name.toLowerCase().includes('pqc')) {
          pqcCoverage = 'Potentially PQC (Name Match)'
        }

        // Fetch PDF if available
        if (pdfUrl) {
          try {
            const pdfDataBuffer = await fetch(pdfUrl).then((res) => res.arrayBuffer())
            const parser = new PDFParse({ data: Buffer.from(pdfDataBuffer) })
            const pdfText = await parser.getText()

            // Extract PQC
            const pqcStr = extractAlgorithms(pdfText.text, PQC_PATTERNS)
            if (pqcStr) pqcCoverage = pqcStr
            else if (pqcCoverage === 'Potentially PQC') pqcCoverage = 'No PQC Mechanisms Detected'

            // Extract Classical
            classicalAlgorithms = extractAlgorithms(pdfText.text, CLASSICAL_PATTERNS)

            // Extract Lab / ITSEF (Heuristic)
            // Look for "Evaluation Facility:" or "ITSEF:"
            // Common patterns: "Developer: ... ITSEF: ... "
            const labMatch = pdfText.text.match(
              /(?:Evaluation Facility|ITSEF|Evaluation Body)\s*:?\s*([^\n\r,]+)/i
            )
            if (labMatch) {
              lab = labMatch[1].trim().substring(0, 50) // Cap length
            }
          } catch (e: any) {
            // console.warn(`Failed CC PDF fetch for ${name}:`, e.message);
          }
        }

        return {
          id: certId,
          source: 'Common Criteria',
          date: new Date(certDate).toISOString().split('T')[0],
          link: mainLink,
          type: 'Common Criteria',
          status: 'Active',
          pqcCoverage,
          classicalAlgorithms,
          productName: name,
          productCategory: categoryRaw,
          vendor: vendor,
          lab: lab || undefined,
          certificationLevel: assuranceLevel || undefined,
        }
      })

      const results = await Promise.all(batchPromises)
      const valid = results.filter((r) => r !== null) as ComplianceRecord[]
      records.push(...valid)

      if (i % 20 === 0) console.log(`[CC] Processed ${i} / ${candidateRecords.length} records...`)
    }

    return records
  } catch (e: any) {
    console.warn('CC Scrape Failed:', e)
    return []
  }
}
