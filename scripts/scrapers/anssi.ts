import { createRequire } from 'module'
import { ComplianceRecord } from './types.js'

const require = createRequire(import.meta.url)
const { PDFParse } = require('pdf-parse')

export const scrapeANSSI = async (): Promise<ComplianceRecord[]> => {
  try {
    // The catalog is hosted on S3 and accessed via the ANSSI website
    // Note: This URL may change as it uses signed S3 credentials
    // If it fails, visit https://cyber.gouv.fr/offre-de-service/solutions-certifiees-et-qualifiees/services-de-securite-evalue/decouvrir-les-solutions-certifiees-qualifiees to get the latest link
    const catalogUrl =
      'https://cyber.gouv.fr/documents/57/catalogue-produits-services-profils-de-protection-sites-certifies-qualifies-ag_U1zj9tZ.pdf'

    console.log('[ANSSI] Downloading PDF catalog...')

    const records: ComplianceRecord[] = []

    try {
      // Download PDF catalog with local cache fallback
      // NOTE: The S3 URL expires after 1 hour. To get a fresh URL:
      // Visit https://cyber.gouv.fr/offre-de-service/solutions-certifiees-et-qualifiees/services-de-securite-evalue/decouvrir-les-solutions-certifiees-qualifiees/
      // and click "Catalogue des produits et services qualifiés, agréés et certifiés"

      const fs = await import('fs')
      const path = await import('path')
      const crypto = await import('crypto')
      const cacheDir = path.join(process.cwd(), '.cache')
      const cachePath = path.join(cacheDir, 'anssi-catalog.pdf')
      const hashPath = path.join(cacheDir, 'anssi-catalog.hash')

      let pdfBuffer: Buffer

      try {
        // Try to download from URL
        console.log('[ANSSI] Attempting to download PDF from URL...')
        const arrayBuffer = await fetch(catalogUrl).then((res) => res.arrayBuffer())
        pdfBuffer = Buffer.from(arrayBuffer)

        // Calculate hash of downloaded PDF
        const newHash = crypto.createHash('sha256').update(pdfBuffer).digest('hex')

        // Check if catalog has changed
        let cachedHash = ''
        if (fs.existsSync(hashPath)) {
          cachedHash = fs.readFileSync(hashPath, 'utf-8').trim()
        }

        if (newHash === cachedHash) {
          console.log('[ANSSI] Catalog unchanged, skipping re-scrape')
          return []
        }

        // Cache successful download
        if (!fs.existsSync(cacheDir)) {
          fs.mkdirSync(cacheDir, { recursive: true })
        }
        fs.writeFileSync(cachePath, pdfBuffer)
        fs.writeFileSync(hashPath, newHash)
        console.log('[ANSSI] PDF downloaded and cached successfully (new version detected)')
      } catch {
        // Fall back to cached copy
        console.warn('[ANSSI] Download failed, attempting to use cached copy...')
        if (fs.existsSync(cachePath)) {
          pdfBuffer = fs.readFileSync(cachePath)
          console.log('[ANSSI] Using cached PDF catalog')
        } else {
          throw new Error('Download failed and no cached copy available')
        }
      }

      const parser = new PDFParse({ data: pdfBuffer })
      const pdfData = await parser.getText()
      const text = pdfData.text

      console.log('[ANSSI] PDF catalog downloaded. Parsing certificates...')

      // The PDF text has certificate references split across lines like:
      // "ANSSI-CC-\n2023-19" which becomes "ANSSI-CC- 2023-19" after replacing \n with space
      // So we need to handle optional whitespace in the pattern
      const cleanText = text.replace(/\n/g, ' ')

      // Use cleanText for pattern matching with optional whitespace
      const certRefMatches = Array.from(
        cleanText.matchAll(/ANSSI-(CC|CSPN)-\s*(\d{4})-\s*(\d+)/gi)
      ) as RegExpMatchArray[]

      for (const certRefMatch of certRefMatches) {
        const certType = certRefMatch[1].toUpperCase()
        const year = certRefMatch[2]
        const num = certRefMatch[3]
        const certRef = `ANSSI-${certType}-${year}-${num}`
        const certId = certRef.toLowerCase()

        // Find the context around this certificate in the original text
        const certIndex = certRefMatch.index || 0
        const contextStart = Math.max(0, certIndex - 500)
        const contextEnd = Math.min(cleanText.length, certIndex + 200)
        const context = cleanText.substring(contextStart, contextEnd)

        // Extract product name (appears before the certificate reference)
        // The product name is between vendor and EAL level in the table
        let productName = 'Unknown Product'

        // Try to find product name between vendor and EAL
        // Pattern: VENDOR ProductName EAL
        const productMatch = context.match(
          /(?:APPLE|THALES|GEMALTO|IDEMIA|SAMSUNG|GOOGLE|MICROSOFT|ORACLE|IBM|ATOS|BULL|OBERTHUR|MORPHO|SAFRAN|AIRBUS)\s+([A-Za-z0-9][^]+?)\s+EAL\d/i
        )
        if (productMatch) {
          productName = productMatch[1]
            .trim()
            // Remove common table headers and noise
            .replace(
              /^(Nom du produit|Type de produit|Date de|Lien vers|certificat|rapport|cible|sécurité)\s*/gi,
              ''
            )
            // Clean up multiple spaces
            .replace(/\s+/g, ' ')
            .trim()
        }

        // Fallback: try simpler pattern if vendor-based match failed
        if (productName === 'Unknown Product' || productName.length < 5) {
          const simpleMatch = context.match(/([A-Z][A-Za-z0-9\s]{10,150}?)\s+EAL\d/i)
          if (simpleMatch) {
            productName = simpleMatch[1]
              .trim()
              .replace(
                /^(Nom du produit|Type de produit|Date de|Lien vers|certificat|rapport|cible|sécurité)\s*/gi,
                ''
              )
              .replace(/\s+/g, ' ')
              .trim()
          }
        }

        // Extract vendor/developer (appears before product name, often repeated)
        // Common vendors: APPLE, THALES, GEMALTO, IDEMIA, etc.
        let vendor = 'Unknown Vendor'
        const vendorMatch = context.match(
          /\b(APPLE|THALES|GEMALTO|IDEMIA|SAMSUNG|GOOGLE|MICROSOFT|ORACLE|IBM|ATOS|BULL|OBERTHUR|MORPHO|SAFRAN|AIRBUS)\b/i
        )
        if (vendorMatch) {
          vendor = vendorMatch[1]
        }

        // Extract lab/CESTI (appears in table between product and cert ref)
        // Common labs: THALES, OPPIDA, SERMA, LETI, CEA, etc.
        let lab: string | undefined
        const labMatch = context.match(
          /\b(THALES|OPPIDA|SERMA|LETI|CEA|AMOSSYS|APAVE|CESTI|OPPIDA\+SERMA)\b(?!\s*Autres)/i
        )
        if (labMatch) {
          lab = labMatch[1]
        }

        // Extract product category (appears between lab and date)
        // Common categories: "Autres", "Equipements matériels avec boitiers sécurisés", "Logiciels", etc.
        let productCategory = 'Certified Product'
        const categoryMatch = context.match(
          /(?:THALES|OPPIDA|SERMA|LETI|CEA|AMOSSYS|APAVE|CESTI|OPPIDA\+SERMA)\s+([A-Za-zÀ-ÿ\s]{5,80}?)\s+\d{2}\/\d{2}\/\d{4}/i
        )
        if (categoryMatch) {
          productCategory = categoryMatch[1]
            .trim()
            .replace(/\s+/g, ' ')
            // Clean up if it's just "Autres" or similar generic terms
            .replace(/^Autres$/i, 'Other')
        }

        // Extract date (appears before certificate reference)
        const dateMatch = context.match(/(\d{2})\/(\d{2})\/(\d{4})\s+\d{2}\/\d{2}\/\d{4}\s+ANSSI/)
        let certDate = new Date().toISOString().split('T')[0]
        if (dateMatch) {
          const [, day, month, year] = dateMatch
          certDate = `${year}-${month}-${day}`
        }

        // Construct document URLs
        // Actual format from ANSSI catalog:
        // https://messervices.cyber.gouv.fr/visas/ANSSI-CC-2024-41-Certificat.pdf
        // https://messervices.cyber.gouv.fr/visas/ANSSI-CC-2024-41-Rapport.pdf
        // https://messervices.cyber.gouv.fr/visas/ANSSI-CC-2024-41-Cible.pdf
        const visasBaseUrl = 'https://messervices.cyber.gouv.fr/visas'
        const certCertificate = `${visasBaseUrl}/ANSSI-${certType}-${year}-${num}-Certificat.pdf`
        const certReport = `${visasBaseUrl}/ANSSI-${certType}-${year}-${num}-Rapport.pdf`
        const securityTarget = `${visasBaseUrl}/ANSSI-${certType}-${year}-${num}-Cible.pdf`

        // Extract EAL level from context
        const ealMatch = context.match(/EAL\s*(\d+\+?)/i)
        let certificationLevel: string | undefined
        if (ealMatch) {
          certificationLevel = `EAL${ealMatch[1]}`
        }

        // Create record
        records.push({
          id: certId,
          source: 'ANSSI',
          type: 'Common Criteria',
          status: 'Active',
          pqcCoverage: 'No PQC Mechanisms Detected',
          productName: productName.substring(0, 150),
          productCategory,
          vendor,
          date: certDate,
          link: certReport,
          certificationReportUrls: [certReport],
          securityTargetUrls: [securityTarget],
          certificationLevel,
          lab,
          additionalDocuments: [{ name: 'Certificate', url: certCertificate }],
        })
      }

      // Filter for last 2 years
      const cutoffDate = new Date()
      cutoffDate.setFullYear(cutoffDate.getFullYear() - 2)

      const recentRecords = records.filter((r) => new Date(r.date) >= cutoffDate)

      console.log(`[ANSSI] Parsed ${records.length} certificates from PDF catalog`)
      console.log(`[ANSSI] Filtered to ${recentRecords.length} certificates from last 2 years`)

      return recentRecords
    } catch (pdfError) {
      console.warn('[ANSSI] PDF catalog parsing error:', pdfError)
      console.log('[ANSSI] Falling back to empty results')
      return []
    }
  } catch (e) {
    console.warn('[ANSSI] Scrape Failed:', e)
    return []
  }
}
