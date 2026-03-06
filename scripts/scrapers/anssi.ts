// SPDX-License-Identifier: GPL-3.0-only
import { createRequire } from 'module'
import { ComplianceRecord } from './types.js'
import { getDataCutoffDate } from './utils.js'

const require = createRequire(import.meta.url)
const { PDFParse } = require('pdf-parse')

// Direct PDF catalog URL (as of March 2026 — cyber.gouv.fr/produits-certifies now 404s)
const ANSSI_CATALOG_PDF_URL =
  'https://messervices.cyber.gouv.fr/visas/catalogue-produits-services-profils-de-protection-sites-certifies-qualifies-agrees-anssi.pdf'

export const scrapeANSSI = async (): Promise<ComplianceRecord[]> => {
  try {
    console.log('[ANSSI] Starting ANSSI scraper...')

    const records: ComplianceRecord[] = []

    const fs = await import('fs')
    const path = await import('path')
    const crypto = await import('crypto')
    const cacheDir = path.join(process.cwd(), '.cache')
    const cachePath = path.join(cacheDir, 'anssi-catalog.pdf')
    const hashPath = path.join(cacheDir, 'anssi-catalog.hash')

    let pdfBuffer: Buffer

    try {
      // STEP 1: Download the catalog PDF directly
      // (cyber.gouv.fr/produits-certifies redirected to 404 as of March 2026;
      //  the PDF is now hosted directly on messervices.cyber.gouv.fr)
      console.log('[ANSSI] Downloading PDF catalog from:', ANSSI_CATALOG_PDF_URL)

      const response = await fetch(ANSSI_CATALOG_PDF_URL, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
      })
      if (!response.ok) {
        throw new Error(`Failed to download PDF: ${response.status}`)
      }
      const arrayBuffer = await response.arrayBuffer()
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
      // Fall back to cached copy, then to bundled library copy
      console.warn('[ANSSI] Download failed, attempting to use cached copy...')
      const bundledPath = path.join(
        process.cwd(),
        'public/library/catalogue-produits-services-profils-de-protection-sites-certifies-qualifies-agrees-anssi.pdf'
      )
      if (fs.existsSync(cachePath)) {
        pdfBuffer = fs.readFileSync(cachePath)
        console.log('[ANSSI] Using cached PDF catalog')
      } else if (fs.existsSync(bundledPath)) {
        pdfBuffer = fs.readFileSync(bundledPath)
        console.log('[ANSSI] Using bundled library PDF catalog')
      } else {
        throw new Error('Download failed and no cached copy available')
      }
    }

    const parser = new PDFParse({ data: pdfBuffer })
    const pdfData = await parser.getText()
    const text = pdfData.text

    console.log('[ANSSI] PDF catalog downloaded. Parsing certificates...')

    // ── Block-based parser ────────────────────────────────────────────────
    // The PDF table structure (confirmed by raw text extraction):
    //
    //   {VENDOR_LINE(s)}          ← one or more ALL-CAPS lines at block start
    //   {PRODUCT_LINE(s)}         ← mixed-case lines
    //   {INFO LINE}               ← single line: "EAL? VENDOR LAB CATEGORY DD/MM/YYYY DD/MM/YYYY ANSSI-CC-"
    //   {YEAR}-{NUM}              ← cert ref second half (split across lines by PDF renderer)
    //   Lien vers le
    //   rapport de certification
    //   Lien vers la
    //   cible de sécurité         ← SEPARATOR between entries
    //
    // Pre-process: strip PDF page-break artifacts that interrupt the separator.
    // At each page boundary the PDF renderer inserts "Page N sur N" followed by the
    // table column headers, splitting "cible de" and "sécurité" across pages.
    const processedText = text
      // Remove page counter lines: "Page N sur N"
      .replace(/Page\s+\d+\s+sur\s+\d+/g, '')
      // Remove repeated table column header rows that start with "Produit certifié"
      .replace(/Produit\s+certifi[eé][^\n]*/gi, '')

    // Split on the separator to get one block per entry.
    const SEPARATOR_RE = /Lien vers la\s*\n?\s*cible\s*\n?\s*de\s*\n?\s*s[eé]curit[eé]/gi
    const blocks = processedText.split(SEPARATOR_RE)
    const visasBaseUrl = 'https://messervices.cyber.gouv.fr/visas'

    for (const block of blocks) {
      // Find the cert ref (year-num spans two lines in the PDF)
      const certMatch = block.match(/ANSSI-(CC|CSPN)-\s*\n?\s*(\d{4})-\s*(\d+)/i)
      if (!certMatch) continue

      const certType = certMatch[1].toUpperCase()
      const year = certMatch[2]
      const num = certMatch[3]
      const certId = `anssi-${certType.toLowerCase()}-${year}-${num}`

      // Everything before the cert ref
      const beforeRef = block.substring(0, certMatch.index ?? 0)

      // ── Content lines: strip blanks, link text, and the INFO line (contains dates) ──
      const contentLines = beforeRef
        .split('\n')
        .map((l) => l.trim())
        .filter(
          (l) => l.length > 1 && !l.includes('Lien vers') && !/\d{2}\/\d{2}\/\d{4}/.test(l) // skip info line (has dates)
        )

      // ── Vendor/product extraction ──────────────────────────────────────────
      // Three block types the PDF produces:
      //   (a) Normal: vendor on its own ALL-CAPS line(s), then mixed-case product
      //   (b) Page-break contaminated: previous entry's product tail prepended
      //       before the real vendor (ALL-CAPS) + real product
      //   (c) Merged line: vendor+product on one line (e.g. "AUSTRIA CARD ACOS-IDv2.1")
      //
      // Strategy: find the LAST consecutive run of all-caps-only lines → vendor.
      // This handles (b) because the contamination (mixed-case product tail) comes
      // first, the real vendor's all-caps run is always last before the product.
      // Fallback when no all-caps lines exist: word-level scan handles (c).
      const allCapsLineRe = /^[A-Z][A-Z0-9 .-]{0,60}$/
      // Known CESTI evaluation labs (used to anchor commanditaire extraction from INFO LINE)
      const LAB_NAMES = new Set([
        'THALES',
        'OPPIDA',
        'SERMA',
        'LETI',
        'CEA',
        'AMOSSYS',
        'APAVE',
        'CESTI',
        'ACCEIS',
        'LEXFO',
        'QUARKSLAB',
        'TRUSTED',
        'SYNACKTIV',
        'ATSEC',
        'ESCRYPT',
        'BV',
      ])

      // Find the last consecutive run of all-caps lines in content
      let lastRunStart = -1
      let lastRunEnd = -1
      {
        let i = 0
        while (i < contentLines.length) {
          if (allCapsLineRe.test(contentLines[i])) {
            const runStart = i
            while (i < contentLines.length && allCapsLineRe.test(contentLines[i])) i++
            lastRunStart = runStart
            lastRunEnd = i - 1
          } else {
            i++
          }
        }
      }

      let vendor = 'Unknown Vendor'
      let productName = 'Unknown Product'

      // Filter helper: remove info-line bleed from product lines
      // (lab names embedded in a line, or STMicro word-wrap fragments like "nics")
      const isInfoLineBleed = (l: string): boolean => {
        const trimmed = l.trim()
        const upper = trimmed.toUpperCase()
        // Pure lab name line
        if (LAB_NAMES.has(upper)) return true
        // STMicro word-wrap fragment ("nics", "nics THALES Micro-")
        if (/^nics\b/i.test(trimmed)) return true
        // Micro-circuits category fragment
        if (/^(Micro-|circuits)$/i.test(trimmed)) return true
        // Line that CONTAINS a lab name AND a French category word (info-line bleed)
        const hasLab = [...LAB_NAMES].some((lab) => new RegExp(`\\b${lab}\\b`).test(upper))
        const hasCategoryWord = /\b(Cartes?|puce|circuits?|Microcontrôleurs?|sécurisés?)\b/i.test(
          trimmed
        )
        return hasLab && hasCategoryWord
      }

      // Clean helper: strip info-line tail from lines where product + info merge
      // e.g. "RevB (Fw 3.0.0) EAL6+ STMicroelectro" → "RevB (Fw 3.0.0)"
      const cleanProductLine = (l: string): string => {
        return l
          .replace(/\s*EAL\d+\+?\s+.*$/i, '') // Strip EAL + vendor/lab tail
          .replace(/\s+STMicroelectroni?$/i, '') // Strip word-wrapped vendor tail
          .replace(/\s+STMicroelectronics$/i, '') // Strip full vendor tail
          .trim()
      }

      if (lastRunStart !== -1) {
        // Cases (a) and (b): vendor is the last all-caps run; product follows it
        vendor = contentLines
          .slice(lastRunStart, lastRunEnd + 1)
          .join(' ')
          .trim()

        const vendorWordSet = new Set(vendor.toUpperCase().split(/\s+/).filter(Boolean))
        const productLines = contentLines
          .slice(lastRunEnd + 1)
          .map(cleanProductLine)
          .filter((l) => {
            const wu = l.trim().toUpperCase()
            return (
              l.length > 0 &&
              !LAB_NAMES.has(wu) &&
              !vendorWordSet.has(wu) &&
              !/^EAL\d/i.test(l) &&
              !isInfoLineBleed(l)
            )
          })
        productName =
          productLines.join(' ').replace(/\s+/g, ' ').trim().substring(0, 150) || 'Unknown Product'
      }

      if (vendor === 'Unknown Vendor') {
        // Case (c): no purely all-caps line (or product code rejected above).
        // Word-level scan: vendor = leading all-caps words (no lowercase, no digit start).
        const allWords = contentLines.flatMap((l) => l.split(/\s+/).filter(Boolean))
        let vendorWordCount = 0
        for (const word of allWords) {
          if (/[a-z]/.test(word) || /^\d/.test(word)) break
          vendorWordCount++
        }
        if (vendorWordCount > 0) {
          vendor = allWords.slice(0, vendorWordCount).join(' ')
          const vendorWordSet = new Set(vendor.toUpperCase().split(/\s+/).filter(Boolean))
          const productWords = allWords.slice(vendorWordCount).filter((w) => {
            const wu = w.toUpperCase()
            return !LAB_NAMES.has(wu) && !vendorWordSet.has(wu) && !/^EAL\d/i.test(w)
          })
          productName =
            productWords.join(' ').replace(/\s+/g, ' ').trim().substring(0, 150) ||
            'Unknown Product'
        }
      }

      // ── Pre-fallback vendor validation ─────────────────────────────────────
      // Reset clearly invalid vendors to Unknown so INFO LINE fallbacks can try.
      // Product codes (short alphanumeric with digits), generic protocol names,
      // version strings, and too-short strings are rejected here.
      {
        const preV = vendor
        const isInvalidPre =
          (vendor !== 'Unknown Vendor' &&
            /^[A-Z][A-Z0-9.-]{0,15}$/.test(preV) &&
            /\d/.test(preV)) ||
          /^(HW|SAS|SERVICE|SSCD|PACE|LQFP-EP|GP-SE PLATFORM)$/i.test(preV) ||
          /^V\d/i.test(preV) ||
          (preV !== 'Unknown Vendor' && preV.length < 3)
        if (isInvalidPre) {
          vendor = 'Unknown Vendor'
        }
      }

      // ── INFO LINE fallbacks for vendor (when primary extraction failed) ────
      // Approach 1: EAL anchor — reliable for CC entries.
      //   Pattern: "EAL N+ COMMANDITAIRE LAB" → captures commanditaire between EAL and lab.
      // Approach 2: Last-500-chars, uppercase-start words before known lab.
      //   Handles CSPN (no EAL) and word-wrapped or mixed-case vendor names.
      if (vendor === 'Unknown Vendor') {
        const labPat =
          'THALES|OPPIDA|SERMA|LETI|CEA|AMOSSYS|APAVE|CESTI|ACCEIS|LEXFO|QUARKSLAB|TRUSTED|SYNACKTIV|ATSEC|ESCRYPT|BV'
        // Approach 1: EAL-required (full beforeRef)
        const ealFallbackMatch = beforeRef.match(
          new RegExp(`EAL\\s*\\d+\\+?\\s+(\\S+(?:\\s+\\S+){0,2}?)\\s+(?:${labPat})\\b`, 'i')
        )
        if (ealFallbackMatch) {
          const c = ealFallbackMatch[1].trim()
          if (c.length > 0 && c.length <= 60) vendor = c
        }
      }
      if (vendor === 'Unknown Vendor') {
        const labPat =
          'THALES|OPPIDA|SERMA|LETI|CEA|AMOSSYS|APAVE|CESTI|ACCEIS|LEXFO|QUARKSLAB|TRUSTED|SYNACKTIV|ATSEC|ESCRYPT|BV'
        // Approach 2: last-500-chars context, optional EAL, words must start uppercase
        const ctx = beforeRef.slice(-500)
        const m = ctx.match(
          new RegExp(
            `(?:EAL\\s*\\d+\\+?\\s+)?([A-Z]\\S*(?:\\s+[A-Z]\\S*){0,2}?)\\s+(?:${labPat})\\b`
          )
        )
        if (m) {
          const c = m[1].replace(/^EAL\s*\d+\+?\s*/i, '').trim()
          if (c.length > 0 && c.length <= 60 && !/^(Lien|Non|maintenu)$/i.test(c)) vendor = c
        }
      }

      // ── Product salvage: when vendor was found by INFO LINE but product is still unknown ──
      // Content lines have vendor name + product + info-line fragments. Strip vendor and
      // info-line to recover product.
      if (
        vendor !== 'Unknown Vendor' &&
        productName === 'Unknown Product' &&
        contentLines.length > 0
      ) {
        // Normalize vendor for matching (handle word-wrap: "STMicroelectroni" + "cs")
        const vendorNorm = vendor
          .replace(/[\n\r]+/g, ' ')
          .replace(/\s+/g, ' ')
          .trim()
          .toUpperCase()
        const vendorWords = new Set(vendorNorm.split(/\s+/).filter(Boolean))

        // Find where vendor lines end in contentLines
        let vendorEndIdx = 0
        let accumulated = ''
        for (let i = 0; i < contentLines.length; i++) {
          accumulated += (accumulated ? ' ' : '') + contentLines[i].trim()
          const accNorm = accumulated.replace(/\s+/g, '').toUpperCase()
          const vendorCompact = vendorNorm.replace(/\s+/g, '')
          if (accNorm.includes(vendorCompact) || vendorCompact.includes(accNorm)) {
            vendorEndIdx = i + 1
            // If exact match or full containment, stop
            if (accNorm === vendorCompact) break
          }
        }

        // Take lines after vendor, clean info-line tails, filter info-line bleed
        const salvageLines = contentLines
          .slice(vendorEndIdx)
          .map(cleanProductLine)
          .filter((l) => {
            const trimmed = l.trim()
            const upper = trimmed.toUpperCase()
            if (trimmed.length === 0) return false
            // Skip if it's a pure vendor word repetition
            if (vendorWords.has(upper)) return false
            // Skip EAL-prefixed lines (info line fragments)
            if (/^EAL\d/i.test(trimmed)) return false
            // Skip info-line bleed
            if (isInfoLineBleed(trimmed)) return false
            // Skip lines that contain the full vendor name (info line echo)
            if (upper.includes(vendorNorm) || vendorNorm.includes(upper)) return false
            return true
          })

        if (salvageLines.length > 0) {
          productName =
            salvageLines.join(' ').replace(/\s+/g, ' ').trim().substring(0, 150) ||
            'Unknown Product'
        }
      }

      // ── Post-extraction normalization ──────────────────────────────────────
      // 1. Remove embedded newlines (INFO LINE fallbacks capture from raw text)
      vendor = vendor
        .replace(/[\n\r]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
      productName = productName
        .replace(/[\n\r]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()

      // 2. Fix common PDF word-wrap splits in vendor names
      vendor = vendor
        .replace(/STMicroelectro\s+nics/gi, 'STMicroelectronics')
        .replace(/TECHNOLOGI\s+ES/g, 'TECHNOLOGIES')
        .replace(/TECHNOLOG\s+Y/g, 'TECHNOLOGY')
        .replace(/STORMSHIEL\b(?!D)/g, 'STORMSHIELD')
        .replace(/MICROCONTROL\b(?!L)/g, 'MICROCONTROLLER')
        .trim()

      // 3. Strip trailing lab names that bled into vendor from info line
      const trailingLabRe =
        /\s+(?:THALES|OPPIDA|SERMA|LETI|CEA|AMOSSYS|APAVE|CESTI|ACCEIS|LEXFO|QUARKSLAB|TRUSTED|SYNACKTIV|ATSEC|ESCRYPT|BV)\s*$/i
      vendor = vendor.replace(trailingLabRe, '').trim()

      // 4. Strip parenthetical qualifiers from all paths (e.g. "INFINEON (A)" → "INFINEON")
      vendor = vendor.replace(/\s*\([^)]{1,20}\)\s*$/, '').trim()

      // 5. Final vendor sanity check — catches values from INFO LINE fallbacks
      if (vendor !== 'Unknown Vendor') {
        const isFinalInvalid =
          vendor.length < 2 ||
          // Product codes that came from INFO LINE (e.g. "S3FT9MH")
          (/^[A-Z][A-Z0-9.-]{0,15}$/.test(vendor) && /\d/.test(vendor)) ||
          // Version-prefixed strings ("V4.5.2 - AMD", "MultiApp V5.1")
          /^V\d/i.test(vendor) ||
          /\bV\d+\.\d+/.test(vendor) ||
          // Generic words that aren't vendor names
          /^(HW|SAS|SERVICE|SSCD|PACE|LQFP-EP|GP-SE PLATFORM|EUROPE)$/i.test(vendor) ||
          // Duplicate word vendor ("APIZEE APIZEE" → "APIZEE")
          false
        if (isFinalInvalid) {
          vendor = 'Unknown Vendor'
        }
        // Fix duplicate-word vendor names
        const vendorWords = vendor.split(/\s+/)
        if (vendorWords.length === 2 && vendorWords[0] === vendorWords[1]) {
          vendor = vendorWords[0]
        }
      }

      // 6. Clean product name: strip info-line tails + fix word-wrap splits
      productName = cleanProductLine(productName)
      productName = productName
        .replace(/STMicroelectroni?\s*cs/gi, 'STMicroelectronics')
        .replace(/STMicroelectroni$/i, '') // trailing vendor fragment
        .replace(/TECHNOLOGI\s+ES/gi, 'TECHNOLOGIES')
        .replace(/TECHNOLOG\s+Y/gi, 'TECHNOLOGY')
        .trim()
      if (productName.length === 0) productName = 'Unknown Product'

      // ── Date: first DD/MM/YYYY in beforeRef (start-of-validity date) ──
      const dateMatches = [...beforeRef.matchAll(/(\d{2})\/(\d{2})\/(\d{4})/g)]
      let certDate = new Date().toISOString().split('T')[0]
      if (dateMatches.length > 0) {
        const [, d, m, y] = dateMatches[0]
        certDate = `${y}-${m}-${d}`
      }

      // ── EAL level (CC only) ──
      const ealMatch = beforeRef.match(/EAL\s*(\d+\+?)/i)
      const certificationLevel = ealMatch ? `EAL${ealMatch[1]}` : undefined

      // ── Category: text immediately before the first date on the info line ──
      let productCategory = 'Certified Product'
      const infoLineMatch = beforeRef.match(/(.{3,80}?)\s+\d{2}\/\d{2}\/\d{4}/)
      if (infoLineMatch) {
        // Take the last word-group as the category (strips vendor/lab prefix)
        const candidate = infoLineMatch[1].replace(/\s+/g, ' ').trim()
        // The category is typically the last phrase (after lab name)
        const categoryPart = candidate.match(/([A-Za-zÀ-ÿ][A-Za-zÀ-ÿ\s-]{4,60})$/)
        if (categoryPart) {
          productCategory = categoryPart[1].trim().replace(/^Autres$/i, 'Other')
        }
      }

      // ── Lab: known CESTI labs appearing in info line ──
      let lab: string | undefined
      const labMatch = beforeRef.match(
        /\b(THALES|OPPIDA|SERMA|LETI|CEA|AMOSSYS|APAVE|CESTI|ACCEIS|LEXFO)\b/i
      )
      if (labMatch) {
        lab = labMatch[1].toUpperCase()
      }

      // ── Build document URLs (lowercase suffixes as of March 2026) ──
      const certCertificate = `${visasBaseUrl}/ANSSI-${certType}-${year}-${num}-certificat.pdf`
      const certReport = `${visasBaseUrl}/ANSSI-${certType}-${year}-${num}-rapport.pdf`
      const securityTarget = `${visasBaseUrl}/ANSSI-${certType}-${year}-${num}-cible.pdf`

      records.push({
        id: certId,
        source: 'ANSSI',
        type: 'Common Criteria',
        status: 'Active',
        pqcCoverage: 'No PQC Mechanisms Detected',
        productName,
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

    // Filter for last 2 years using centralized utility
    const cutoffDate = getDataCutoffDate()

    const recentRecords = records.filter((r) => new Date(r.date) >= cutoffDate)

    console.log(`[ANSSI] Parsed ${records.length} certificates from PDF catalog`)
    console.log(`[ANSSI] Filtered to ${recentRecords.length} certificates from last 2 years`)

    return recentRecords
  } catch (e) {
    console.warn('[ANSSI] Scrape Failed:', e)
    return []
  }
}
