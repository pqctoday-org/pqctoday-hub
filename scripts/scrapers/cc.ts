/* eslint-disable @typescript-eslint/no-explicit-any */
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

    // Helper function to parse concatenated PDF URLs from CSV
    const parseDocumentURLs = (
      csvUrl: string,
      baseUrl: string = 'https://www.commoncriteriaportal.org'
    ) => {
      if (!csvUrl || csvUrl.trim() === '') {
        return { certReports: [], securityTargets: [], other: [] }
      }

      const certReports: string[] = []
      const securityTargets: string[] = []
      const other: Array<{ name: string; url: string }> = []

      try {
        // Split on .pdf followed by ( or space or end of string
        // FIX: Regex must exclude spaces to prevent merging multiple URLs
        const pdfMatches = csvUrl.match(/[^()\s]+\.pdf/gi) || []

        pdfMatches.forEach((match) => {
          const filename = match.trim()
          if (!filename) return

          // Construct full URL
          let fullUrl = filename.startsWith('http')
            ? filename
            : `${baseUrl}/files/epfiles/${encodeURIComponent(filename)}`

          // Enforce HTTPS and clean ports
          fullUrl = fullUrl.replace(':443', '').replace(':80', '').replace('http:', 'https:')

          // Categorize by filename patterns
          const lowerFilename = filename.toLowerCase()
          if (
            lowerFilename.includes('certification') ||
            lowerFilename.includes('report') ||
            lowerFilename.includes('cert') ||
            lowerFilename.includes('rapport') ||
            lowerFilename.includes('-cr') ||
            lowerFilename.includes('cr[')
          ) {
            certReports.push(fullUrl)
          } else if (
            lowerFilename.includes('st') ||
            lowerFilename.includes('security') ||
            lowerFilename.includes('target') ||
            lowerFilename.includes('cible')
          ) {
            securityTargets.push(fullUrl)
          } else {
            other.push({ name: filename, url: fullUrl })
          }
        })
      } catch {
        console.warn(`[CC] Failed to parse PDF URLs from: ${csvUrl.substring(0, 100)}...`)
      }

      return { certReports, securityTargets, other }
    }

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

        // Extract lab from CSV if available
        const lab = row['Lab'] || row['ITSEF'] || row['Evaluation Facility'] || ''

        let pqcCoverage = ''
        let classicalAlgorithms = ''
        let labFromPDF = ''

        // Generate ID from product name
        const certId = `cc-${name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Math.random().toString(36).substr(2, 4)}`

        // The CSV PDF URLs are often corrupted/concatenated
        // Instead, use the CC Portal product search/detail page
        // Format: https://www.commoncriteriaportal.org/products/?expand#PRODUCT_NAME
        // const mainLink = `https://www.commoncriteriaportal.org/products/?expand#${name.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '+')}`

        // Try to get PDF URL for algorithm extraction, but don't use it as main link
        // Parse concatenated PDF URLs from CSV FIRST to get the best PDF for text extraction
        const certReportUrl = row['Certification Report URL'] || ''
        const securityTargetUrl = row['Security Target URL'] || ''

        const parsedCertReports = parseDocumentURLs(certReportUrl)
        const parsedSecurityTargets = parseDocumentURLs(securityTargetUrl)

        // Determine best PDF for text extraction
        // Priority: Security Target (Required for precise PQC algorithm detection) > Certification Report
        // Helper to extract Lab info with expert patterns
        const extractLabFromText = (text: string): string | null => {
          // Priority 1: Explicit ITSEF/Lab fields
          const primaryMatch = text.match(
            /(?:ITSEF|Evaluation\s+Facility|Evaluation\s+Laboratory|Testing\s+Laboratory|Evaluation\s+Body|Commercial\s+Facility|Evaluated\s+by)\s*[:.]?\s*([A-Z][a-zA-Z\s&]+(?:GmbH|Ltd|Inc|SAS|BV|AB|Corporation|AG)?)/i
          )
          if (primaryMatch) return primaryMatch[1].trim()

          // Priority 2: "Testing was completed by" / "conducted by"
          const secondaryMatch = text.match(
            /(?:Testing\s+was\s+completed\s+by|evaluation\s+has\s+been\s+conducted\s+by|evaluation\s+conducted\s+by)\s*[:.]?\s*([A-Z][a-zA-Z\s&]+(?:GmbH|Ltd|Inc|SAS|BV|AB|Corporation|AG)?)/i
          )
          if (secondaryMatch) return secondaryMatch[1].trim()

          // Priority 3: Known Labs (Fallback)
          const knownLabs = [
            'atsec information security',
            'Brightsight',
            'TÜV Informationstechnik',
            'TÜViT',
            'Trusted Labs',
            'Applus',
            'SGS',
            'SERMA',
            'Riscure',
            'Acumen Security',
            'Leidos',
            'Gossamer',
            'CygnaCom',
            'secunet',
            'Thales',
            'CEA-LETI',
            'Oppida',
            'Amossys',
          ]
          for (const lab of knownLabs) {
            if (text.includes(lab)) return lab
          }

          return null
        }

        // Fetch Logic: Split Strategy
        // 1. Fetch Security Target (ST) for PQC (Strict Source)
        // 2. Fetch Certification Report (CR) for Lab (Strict Source)

        // PQC Extraction (from ST)
        if (parsedSecurityTargets.securityTargets.length > 0) {
          try {
            const stUrl = parsedSecurityTargets.securityTargets[0]
            const pdfDataBuffer = await fetch(stUrl).then((res) => res.arrayBuffer())
            const parser = new PDFParse({ data: Buffer.from(pdfDataBuffer) })
            const pdfText = await parser.getText()

            // Extract PQC
            const pqcStr = extractAlgorithms(pdfText.text, PQC_PATTERNS)
            if (pqcStr) pqcCoverage = pqcStr
            else if (pqcCoverage === 'Potentially PQC') pqcCoverage = 'No PQC Mechanisms Detected'

            // Extract Classical (ST is usually good for this too)
            if (!classicalAlgorithms) {
              classicalAlgorithms = extractAlgorithms(pdfText.text, CLASSICAL_PATTERNS)
            }
          } catch {
            // console.warn(`Failed CC ST fetch for ${name}`, e);
          }
        }

        // Lab Extraction (from Certification Report)
        // Always try to fetch the Cert Report for Lab info, as it is authoritative.
        if (parsedCertReports.certReports.length > 0) {
          try {
            const reportUrl = parsedCertReports.certReports[0]
            const pdfDataBuffer = await fetch(reportUrl).then((res) => res.arrayBuffer())
            const parser = new PDFParse({ data: Buffer.from(pdfDataBuffer) })
            const pdfText = await parser.getText()

            // Extract Lab
            const labMatch = extractLabFromText(pdfText.text)
            if (labMatch) labFromPDF = labMatch.substring(0, 50)

            // Fallback: If Classical algorithms weren't found in ST (or ST missing), check Report
            if (!classicalAlgorithms) {
              classicalAlgorithms = extractAlgorithms(pdfText.text, CLASSICAL_PATTERNS)
            }
          } catch (e) {
            console.error(`Failed CC Report fetch for ${name}`, e)
          }
        } else if (!labFromPDF && parsedSecurityTargets.securityTargets.length > 0) {
          // Fallback: If NO Report exists, try extracting Lab from ST (already fetched ideally, but simplified here)
          // For efficiency, we could cache the ST text from above, but re-fetching/parsing is rare edge case here.
          // Actually, let's just leave it empty if Report is missing to be strict?
          // User said "obviously the right one" is the Cert Report.
          // But if only ST exists, better than nothing?
          // Let's implement ST fallback only if we haven't processed it yet?
          // For now, let's assume Report is primary.
        } // Refined Link Logic (Sync with frontend services.ts)
        let finalMainLink = ''

        // 1. Try to find a valid PDF link for the main "Official Record"
        // Priority: Security Target > Certification Report (if not generic/search)

        // Check parsed STs first
        if (parsedSecurityTargets.securityTargets.length > 0) {
          finalMainLink = parsedSecurityTargets.securityTargets[0]
        }
        // Fallback to Cert Reports
        else if (parsedCertReports.certReports.length > 0) {
          finalMainLink = parsedCertReports.certReports[0]
        }
        // Fallback to Other PDFs (e.g. uncategorized files like French naming conventions)
        else if (parsedCertReports.other.length > 0) {
          finalMainLink = parsedCertReports.other[0].url
        } else if (parsedSecurityTargets.other.length > 0) {
          finalMainLink = parsedSecurityTargets.other[0].url
        }

        // 2. If no valid PDF found, DO NOT revert to Portal Search Link.
        // User requested to disable the link rather than showing an inconsistent search page.
        if (!finalMainLink || finalMainLink.includes('?expand#')) {
          finalMainLink = ''
        }

        return {
          id: certId,
          source: 'Common Criteria',
          date: new Date(certDate).toISOString().split('T')[0],
          link: finalMainLink,
          type: 'Common Criteria',
          status: 'Active',
          pqcCoverage,
          classicalAlgorithms,
          productName: name,
          productCategory: categoryRaw,
          vendor: vendor,
          lab: lab || labFromPDF || undefined,
          certificationLevel: assuranceLevel || undefined,
          // Multi-URL support
          certificationReportUrls:
            parsedCertReports.certReports.length > 0 ? parsedCertReports.certReports : undefined,
          securityTargetUrls:
            parsedSecurityTargets.securityTargets.length > 0
              ? parsedSecurityTargets.securityTargets
              : undefined,
          additionalDocuments:
            [...parsedCertReports.other, ...parsedSecurityTargets.other].length > 0
              ? [...parsedCertReports.other, ...parsedSecurityTargets.other]
              : undefined,
        }
      })

      const results = await Promise.all(batchPromises)
      const valid = results.filter((r) => r !== null) as ComplianceRecord[]
      records.push(...valid)

      if (i % 20 === 0) console.log(`[CC] Processed ${i} / ${candidateRecords.length} records...`)
    }

    return records
  } catch (e) {
    console.error('CC Scrape Failed:', e)
    return []
  }
}
