import { JSDOM } from 'jsdom'
import { createRequire } from 'module'
import { ComplianceRecord } from './types.js'
import { fetchText, extractAlgorithms, PQC_PATTERNS, CLASSICAL_PATTERNS } from './utils.js'

const require = createRequire(import.meta.url)
const { PDFParse } = require('pdf-parse')

export const scrapeANSSI = async (): Promise<ComplianceRecord[]> => {
  try {
    const baseUrl = 'https://cyber.gouv.fr'
    // User-provided filtered URL for Common Criteria products
    const listUrl = `${baseUrl}/produits-certifies?sort_bef_combine=field_date_de_certification_value_DESC&type_1%5Bproduit_certifie_cc%5D=produit_certifie_cc&field_categorie_target_id%5B533%5D=533&field_categorie_target_id%5B532%5D=532&field_categorie_target_id%5B541%5D=541&field_categorie_target_id%5B545%5D=545&field_niveau_target_id%5B562%5D=562&field_niveau_target_id%5B564%5D=564&field_niveau_target_id%5B565%5D=565&field_niveau_target_id%5B566%5D=566&field_niveau_target_id%5B567%5D=567`

    console.log('[ANSSI] Parsing filtered list page...')

    const records: ComplianceRecord[] = []
    let page = 0
    let stopScraping = false

    while (!stopScraping) {
      const pageUrl = `${listUrl}&page=${page}`
      console.log(`[ANSSI] Fetching list page ${page}...`)

      try {
        const html = await fetchText(pageUrl)
        const dom = new JSDOM(html)
        const doc = dom.window.document

        // Select product items (adjust selector if needed based on DOM)
        const items = Array.from(doc.querySelectorAll('.view-content .views-row'))
        if (items.length === 0) {
          console.log('[ANSSI] No more items found. Stopping.')
          break
        }

        for (const item of items) {
          const link = item.querySelector('a')
          const relativeUrl = link?.getAttribute('href')
          if (!relativeUrl) continue

          // Title (from H1 on detail page is cleaner)
          // We will extract it properly after fetching the detail page
          let listTitle = link?.textContent?.trim() || 'Unknown Product'
          listTitle = listTitle.replace(/\s+/g, ' ').substring(0, 150)

          // Date Extraction from Line (e.g. "Publié le 01/01/2025")
          // We need to fetch detail page to get accurate date usually, but list might have it.
          // Assuming list has some data. If not, detail fetch matches previous logic.
          // Previous logic fetched detail for EVERYTHING.

          // Let's replicate strict logic:
          // 1. Fetch Detail
          const detailUrl = `${baseUrl}${relativeUrl}`
          const detailHtml = await fetchText(detailUrl)
          const detailDom = new JSDOM(detailHtml)
          const pageDoc = detailDom.window.document

          // Date
          let dateStr = ''
          const dateEl =
            Array.from(pageDoc.querySelectorAll('.field__label')).find((el) =>
              el.textContent?.includes('Date de fin de validité')
            )?.nextElementSibling ||
            Array.from(pageDoc.querySelectorAll('.field__label')).find((el) =>
              el.textContent?.includes('Publié le')
            )?.nextElementSibling // Fallback

          // Actually, "Publié le" is usually in metadata block
          // Let's look for time tag or specific field
          const dateNode =
            pageDoc.querySelector('time') ||
            pageDoc.querySelector('.field--name-field-date-de-certification .field__item')
          if (dateNode) dateStr = dateNode.textContent?.trim() || ''

          let date = new Date().toISOString().split('T')[0]
          if (dateStr) {
            // Parse French Date (DD/MM/YYYY)
            const [day, month, year] = dateStr.split('/')
            if (year && month && day) date = `${year}-${month}-${day}`
          }

          // Strict Filter (Scanning 2-year window)
          const cutoffDate = new Date()
          cutoffDate.setFullYear(cutoffDate.getFullYear() - 2)

          if (new Date(date) < cutoffDate) {
            console.log(`[ANSSI] Encountered old record (${date}). Stopping scraper.`)
            stopScraping = true
            break
          }

          // --- Improved Metadata Extraction Strategy (REGEX on Body Text) ---
          // This matches the user's screenshot labels exactly.
          const fullText = pageDoc.body.textContent || ''

          // 1. Product Name (User preference: Extract from URL slug)
          // e.g. /produits-certifies/multiapp-52 -> "multiapp 52"
          const urlSlug = relativeUrl.split('/').pop() || ''
          const h1Title = pageDoc.querySelector('h1')?.textContent?.trim() // Define fallback
          const productName = urlSlug
            ? decodeURIComponent(urlSlug).replace(/-/g, ' ')
            : h1Title
              ? h1Title.replace(/\s+/g, ' ')
              : listTitle

          // 2. Vendor: "Développeur(s) :" or "Commanditaire(s) :"
          let vendor = 'Unknown Vendor'
          // Match "Développeur(s) : <Content>" just like the screenshot
          const devMatch = fullText.match(/Développeur\(s\)\s*:\s*([^\n\r]+)/i)
          if (devMatch) {
            vendor = devMatch[1].trim()
          } else {
            const commMatch = fullText.match(/Commanditaire\(s\)\s*:\s*([^\n\r]+)/i)
            if (commMatch) vendor = commMatch[1].trim()
          }

          // 3. ID / Ref: "Référence du certificat :"
          let certRef = ''
          const refMatch = fullText.match(/Référence du certificat\s*:\s*([^\n\r]+)/i)
          if (refMatch) {
            certRef = refMatch[1].trim()
          }

          // 4. Level (Niveau)
          let level = ''
          const levelMatch = fullText.match(/Niveau\s*:\s*([^\n\r]+)/i)
          if (levelMatch) level = levelMatch[1].trim()

          // 5. Augmentations
          let augmentation = ''
          const augMatch = fullText.match(/Augmentations\s*:\s*([^\n\r]+)/i)
          if (augMatch) augmentation = augMatch[1].trim()

          // 6. Lab (Centre d'évaluation)
          let lab = ''
          const labMatch = fullText.match(/Centre d'évaluation\s*:\s*([^\n\r]+)/i)
          if (labMatch) lab = labMatch[1].trim()

          // Sanitize Ref for ID (e.g. "ANSSI-CC-2025/30" -> "anssi-cc-2025-30")
          let certId = ''
          if (certRef) {
            certId = certRef.toLowerCase().replace(/[^a-z0-9]/g, '-')
          } else {
            // Fallback ID
            certId = `anssi-${productName
              .toLowerCase()
              .replace(/[^a-z0-9]/g, '-')
              .substring(0, 30)}-${Math.random().toString(36).substr(2, 4)}`
          }

          // PDF Extraction (Prioritizing Security Target)
          let pqcCoverage = 'No PQC Mechanisms Detected'
          let classicalAlgorithms = ''

          const allPdfLinks = Array.from(pageDoc.querySelectorAll('a[href$=".pdf"]'))
          let pdfLink = allPdfLinks.find((a) => {
            const href = a.getAttribute('href')?.toLowerCase() || ''
            const text = a.textContent?.toLowerCase() || ''
            return (
              href.includes('cible') ||
              href.includes('security_target') ||
              href.includes('st') ||
              text.includes('cible') ||
              text.includes('security target')
            )
          })

          if (!pdfLink) {
            pdfLink = allPdfLinks.find(
              (a) =>
                a.textContent?.toLowerCase().includes('rapport') ||
                a.getAttribute('href')?.includes('ANSSI')
            )
          }
          if (!pdfLink && allPdfLinks.length > 0) pdfLink = allPdfLinks[0]

          if (pdfLink) {
            const pdfUrl = pdfLink.getAttribute('href') || ''
            const absolutePdfUrl = pdfUrl.startsWith('http') ? pdfUrl : `${baseUrl}${pdfUrl}`
            try {
              const pdfBuffer = await fetch(absolutePdfUrl).then((res) => res.arrayBuffer())
              const parser = new PDFParse({ data: Buffer.from(pdfBuffer) })
              const pdfData = await parser.getText()
              const text = pdfData.text

              // Algos
              const pqcStr = extractAlgorithms(text, PQC_PATTERNS)
              if (pqcStr) pqcCoverage = pqcStr
              classicalAlgorithms = extractAlgorithms(text, CLASSICAL_PATTERNS)
            } catch (e) {
              console.warn('PDF Error', e)
            }
          }

          // Extract product category from metadata (Catégorie)
          let productCategory = 'Certified Product'
          const categoryMatch = fullText.match(/Catégorie\s*:\s*([^\n\r]+)/i)
          if (categoryMatch) {
            productCategory = categoryMatch[1].trim()
          }

          records.push({
            id: certId,
            source: 'ANSSI',
            date,
            link: detailUrl,
            type: 'Common Criteria',
            status: 'Active',
            pqcCoverage,
            classicalAlgorithms,
            productName: productName,
            productCategory: productCategory,
            vendor: vendor,
            lab: lab || undefined,
            certificationLevel: level
              ? `${level}${augmentation ? ' ' + augmentation : ''}`.trim()
              : undefined,
          })
        }
      } catch (e) {
        console.warn(`[ANSSI] Error on page ${page}:`, e)
      }

      page++
      if (page > 20) stopScraping = true // Safety
      await new Promise((r) => setTimeout(r, 500))
    }

    return records
  } catch (e) {
    console.warn('ANSSI Scrape Failed:', e)
    return []
  }
}
