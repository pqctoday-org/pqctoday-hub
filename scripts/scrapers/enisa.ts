import { JSDOM } from 'jsdom'
import { ComplianceRecord } from './types.js'
import { fetchText, extractAlgorithms, PQC_PATTERNS, CLASSICAL_PATTERNS } from './utils.js'

/**
 * ENISA EUCC Scraper
 *
 * Scrapes European Union Cybersecurity Certification (EUCC) certificates from ENISA portal.
 *
 * Portal: https://certification.enisa.europa.eu/certificates_en
 *
 * Certificate pages follow pattern: https://certification.enisa.europa.eu/certificates/{certificate-id}_en
 * Examples:
 * - https://certification.enisa.europa.eu/certificates/eucc-anssi-2025-3-1_en
 * - https://certification.enisa.europa.eu/certificates/eucc-3095-2025-07-01_en
 */

export const scrapeENISA = async (): Promise<ComplianceRecord[]> => {
  try {
    const baseUrl = 'https://certification.enisa.europa.eu'
    const listUrl = `${baseUrl}/certificates_en`

    console.log('[ENISA] Fetching EUCC certificate list from:', listUrl)

    const records: ComplianceRecord[] = []

    try {
      const html = await fetchText(listUrl)
      const dom = new JSDOM(html)
      const doc = dom.window.document

      // Parse certificate listings (structure TBD based on actual portal)
      // This is a template structure similar to ANSSI scraper
      const items = Array.from(doc.querySelectorAll('.certificate-item, .product-item, article'))

      if (items.length === 0) {
        console.warn(
          '[ENISA] No certificate items found. Portal structure may have changed or not yet published.'
        )
        return []
      }

      for (const item of items) {
        const link = item.querySelector('a')
        const relativeUrl = link?.getAttribute('href')
        if (!relativeUrl) continue

        const detailUrl = relativeUrl.startsWith('http') ? relativeUrl : `${baseUrl}${relativeUrl}`

        // Fetch detail page
        const detailHtml = await fetchText(detailUrl)
        const detailDom = new JSDOM(detailHtml)
        const pageDoc = detailDom.window.document
        const fullText = pageDoc.body.textContent || ''

        // Extract metadata from HTML structure
        // The ENISA page has a structured format with labels and values

        // Extract product name from h1 or from "Name of Product" field
        let productName = pageDoc.querySelector('h1')?.textContent?.trim() || 'Unknown Product'

        // Try to find structured data in the page
        const extractField = (label: string): string => {
          // ENISA uses a table structure with labels and values
          // Look for the label followed by content until the next label
          const allText = pageDoc.body.textContent || ''

          // Common field labels that indicate the start of a new field
          const fieldLabels = [
            'Certificate ID',
            'Name of Product',
            'Type of Product',
            'Version of Product',
            'Name of the Holder',
            'Address of the Holder',
            'Contact Information',
            'Website Holder',
            'Name of the certification body',
            'NANDO ID',
            'Address of the certification body',
            'Contact information of the certification body',
            'Name of the ITSEF',
            'Responsible NCCA',
            'Scheme',
            'Reference to the certification',
            'Assurance level',
            'CC Version',
            'CEM Version',
            'AVA_VAN Level',
            'Package',
            'Protection Profile',
            'Year of issuance',
            'Month of Issuance',
            'ID of the Certificate',
            'Modification',
            'Certificate issue date',
            'period of validity',
          ]

          // Build a regex that stops at any of these labels
          const stopPattern = fieldLabels
            .filter((l) => l !== label) // Don't stop at the same label we're looking for
            .map((l) => l.replace(/[()]/g, '\\$&')) // Escape special chars
            .join('|')

          const pattern = new RegExp(
            `${label.replace(/[()]/g, '\\$&')}\\s*([\\s\\S]{1,300}?)(?=${stopPattern}|$)`,
            'i'
          )

          const match = allText.match(pattern)
          if (match && match[1]) {
            let value = match[1].trim()
            // Clean up: remove tabs, collapse whitespace, remove newlines
            value = value
              .replace(/[\t\n\r]+/g, ' ')
              .replace(/\s{2,}/g, ' ')
              .trim()
            // Remove common noise
            value = value.replace(/^[:\s]+/, '').trim()
            if (value && value.length > 0 && value.length < 300) {
              return value
            }
          }
          return ''
        }

        // Extract vendor (Name of the Holder)
        const vendor =
          extractField('Name of the Holder') || extractField('Holder') || 'Unknown Vendor'

        // Extract product name if not found in h1
        const productField = extractField('Name of Product')
        if (productField && productField !== productName) {
          productName = productField
        }

        // Extract lab (Name of the ITSEF which performed the evaluation)
        const lab =
          extractField('Name of the ITSEF which performed the evaluation') ||
          extractField('ITSEF') ||
          extractField('Evaluation Facility') ||
          ''

        // Extract certification level (Assurance level)
        const level =
          extractField('Assurance level') || extractField('EAL') || extractField('Level') || ''

        // Extract certificate ID
        const certRef =
          extractField('Certificate ID') || extractField('ID of the Certificate') || ''

        // Extract additional detailed fields
        const productType = extractField('Type of Product') || ''
        const productVersion = extractField('Version of Product') || ''
        const certificationBody = extractField('Name of the certification body') || ''
        const scheme = extractField('Scheme') || ''
        const protectionProfile = extractField('Protection Profile') || ''
        const ccVersion = extractField('CC Version') || ''
        const cemVersion = extractField('CEM Version') || ''
        const avaVanLevel = extractField('AVA_VAN Level') || ''
        const packageInfo = extractField('Package') || ''

        // Build certification level string with all details
        let certificationLevel = level
        if (avaVanLevel) {
          certificationLevel += ` (AVA_VAN.${avaVanLevel})`
        }
        if (packageInfo) {
          // Package contains the full augmentation details
          certificationLevel = packageInfo
        }

        let certId = ''
        if (certRef) {
          certId = `eucc-${certRef.toLowerCase().replace(/[^a-z0-9]/g, '-')}`
        } else {
          certId = `eucc-${productName
            .toLowerCase()
            .replace(/[^a-z0-9]/g, '-')
            .substring(0, 30)}-${Math.random().toString(36).substr(2, 4)}`
        }

        // Date extraction
        let dateStr = ''
        const dateNode =
          pageDoc.querySelector('time') || pageDoc.querySelector('.certification-date, .date')
        if (dateNode) dateStr = dateNode.textContent?.trim() || ''

        let date = new Date().toISOString().split('T')[0]
        if (dateStr) {
          // Try to parse various date formats
          const parsedDate = new Date(dateStr)
          if (!isNaN(parsedDate.getTime())) {
            date = parsedDate.toISOString().split('T')[0]
          }
        }

        // Filter: Only last 2 years
        const cutoffDate = new Date()
        cutoffDate.setFullYear(cutoffDate.getFullYear() - 2)
        if (new Date(date) < cutoffDate) {
          console.log(`[ENISA] Encountered old record (${date}). Stopping scraper.`)
          break
        }

        // PDF extraction for algorithm detection
        let pqcCoverage = 'No PQC Mechanisms Detected'
        let classicalAlgorithms = ''

        const allPdfLinks = Array.from(pageDoc.querySelectorAll('a[href*=".pdf"]'))
        const certReports: string[] = []
        const securityTargets: string[] = []
        const otherDocs: Array<{ name: string; url: string }> = []

        // Categorize PDFs
        allPdfLinks.forEach((a) => {
          const href = a.getAttribute('href')?.toLowerCase() || ''
          const text = a.textContent?.toLowerCase() || ''
          const pdfUrl = a.getAttribute('href') || ''
          const absolutePdfUrl = pdfUrl.startsWith('http') ? pdfUrl : `${baseUrl}${pdfUrl} `

          if (
            href.includes('certificate') ||
            href.includes('cert') ||
            href.includes('report') ||
            text.includes('certificate') ||
            text.includes('certification report')
          ) {
            certReports.push(absolutePdfUrl)
          } else if (
            href.includes('security') ||
            href.includes('target') ||
            href.includes('st') ||
            text.includes('security target')
          ) {
            securityTargets.push(absolutePdfUrl)
          } else {
            otherDocs.push({ name: text || 'Document', url: absolutePdfUrl })
          }
        })

        // Try to fetch and parse a PDF for algorithm detection
        const pdfLink =
          allPdfLinks.find((a) => {
            const href = a.getAttribute('href')?.toLowerCase() || ''
            const text = a.textContent?.toLowerCase() || ''
            return (
              href.includes('security') ||
              href.includes('target') ||
              text.includes('security target')
            )
          }) || allPdfLinks[0]

        if (pdfLink) {
          const pdfUrl = pdfLink.getAttribute('href') || ''
          const absolutePdfUrl = pdfUrl.startsWith('http') ? pdfUrl : `${baseUrl}${pdfUrl} `

          try {
            const pdfBuffer = await fetch(absolutePdfUrl).then((res) => res.arrayBuffer())
            // Note: PDF parsing requires pdf-parse which is already in dependencies
            const { createRequire } = await import('module')
            const require = createRequire(import.meta.url)
            const { PDFParse } = require('pdf-parse')

            const parser = new PDFParse({ data: Buffer.from(pdfBuffer) })
            const pdfData = await parser.getText()
            const text = pdfData.text

            // Extract algorithms
            const pqcStr = extractAlgorithms(text, PQC_PATTERNS)
            if (pqcStr) pqcCoverage = pqcStr
            classicalAlgorithms = extractAlgorithms(text, CLASSICAL_PATTERNS)
          } catch (e) {
            console.warn('[ENISA] PDF parsing error:', e)
          }
        }

        // Extract product category
        let productCategory = productType || 'EUCC Certified Product'
        const categoryMatch = fullText.match(/(?:Category|Product Type)\s*:\s*([^\n\r]+)/i)
        if (!productCategory && categoryMatch) productCategory = categoryMatch[1].trim()

        records.push({
          id: `enisa-eucc-${certId}`,
          source: 'ENISA',
          date: date,
          link: detailUrl,
          type: 'EUCC',
          status: 'Active',
          pqcCoverage: pqcCoverage,
          classicalAlgorithms: classicalAlgorithms,
          productName: productName.substring(0, 150),
          productCategory: productCategory || 'Certified Product',
          vendor: vendor || 'Unknown Vendor',
          certificationLevel: certificationLevel || undefined,
          lab: lab || undefined,
          certificationReportUrls: certReports.length > 0 ? certReports : undefined,
          securityTargetUrls: securityTargets.length > 0 ? securityTargets : undefined,
          additionalDocuments: otherDocs.length > 0 ? otherDocs : undefined,
          // EUCC-specific metadata
          productType: productType || undefined,
          productVersion: productVersion || undefined,
          certificationBody: certificationBody || undefined,
          scheme: scheme || undefined,
          protectionProfile: protectionProfile || undefined,
          ccVersion: ccVersion || undefined,
          cemVersion: cemVersion || undefined,
          avaVanLevel: avaVanLevel || undefined,
          packageInfo: packageInfo || undefined,
        })
      }

      console.log(`[ENISA] Scraped ${records.length} EUCC certificates`)
      return records
    } catch (fetchError) {
      console.warn('[ENISA] Portal not accessible or structure changed:', fetchError)
      console.log('[ENISA] This is expected if the EUCC certificate portal is not yet published.')
      return []
    }
  } catch (e) {
    console.warn('[ENISA] Scrape Failed:', e)
    return []
  }
}
