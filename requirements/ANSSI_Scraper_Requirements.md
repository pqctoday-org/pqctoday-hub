# ANSSI Scraper Requirements

## Overview

The ANSSI (Agence nationale de la sécurité des systèmes d'information) scraper extracts French Common Criteria and CSPN (Certification de Sécurité de Premier Niveau) certificates from the ANSSI PDF catalog.

## Data Source

**Portal URL**: https://cyber.gouv.fr/offre-de-service/solutions-certifiees-et-qualifiees/services-de-securite-evalue/decouvrir-les-solutions-certifiees-qualifiees

**Catalog PDF**: https://cyber.gouv.fr/documents/57/catalogue-produits-services-profils-de-protection-sites-certifies-qualifies-ag_U1zj9tZ.pdf

**Document Base URL**: https://messervices.cyber.gouv.fr/visas/

**Certificate Types**:

- **CC** (Common Criteria): Full Common Criteria evaluations
- **CSPN**: First-level security certifications

## PDF Structure

The ANSSI catalog is a PDF table with the following columns:

1. Vendor/Manufacturer
2. Product Name
3. Lab/CESTI (Evaluation facility)
4. Product Category
5. Date (Start/End validity)
6. Certificate Reference (e.g., ANSSI-CC-2024-41)
7. EAL Level (e.g., EAL4+)

### Certificate Reference Format

Certificate references follow the pattern: `ANSSI-{TYPE}-{YEAR}-{NUMBER}`

**Examples**:

- `ANSSI-CC-2024-41` (Common Criteria)
- `ANSSI-CSPN-2023-19` (CSPN)

**Line-Wrapping Issue**: Certificate references may be split across lines in the PDF:

```
ANSSI-CC-
2023-19
```

The scraper handles this by replacing newlines with spaces and using regex with optional whitespace: `ANSSI-(CC|CSPN)-\s*(\d{4})-\s*(\d+)`

## Local Caching

### Cache Location

`.cache/anssi-catalog.pdf`

### Cache Strategy

1. **Download Attempt**: Try to download PDF from URL
2. **Hash Comparison**: Calculate SHA-256 hash of downloaded PDF
3. **Change Detection**: Compare with hash of cached PDF
4. **Cache Update**: Only update cache if hash differs
5. **Fallback**: If download fails, use cached PDF

### Hash File

`.cache/anssi-catalog.pdf.hash` - Contains SHA-256 hash of cached PDF

### Benefits

- Avoids re-downloading unchanged PDFs
- Resilient to URL expiration
- Faster scraping when catalog hasn't changed

## Data Extraction

### Required Fields

| Field                 | Extraction Method | Example Value      | Notes                                         |
| --------------------- | ----------------- | ------------------ | --------------------------------------------- |
| Certificate Reference | Regex pattern     | "ANSSI-CC-2024-41" | Handles line wrapping                         |
| Product Name          | Context parsing   | "iPhone 16 Pro"    | Between vendor and EAL                        |
| Vendor                | Known vendor list | "APPLE"            | Common vendors: APPLE, THALES, GEMALTO, etc.  |
| Lab/CESTI             | Known lab list    | "THALES"           | Common labs: THALES, OPPIDA, SERMA, LETI, CEA |
| Product Category      | Context parsing   | "Autres"           | Between lab and date                          |
| Date                  | Regex pattern     | "15/10/2024"       | Format: DD/MM/YYYY                            |
| EAL Level             | Regex pattern     | "EAL4+"            | Certification level                           |

### Vendor Recognition

The scraper recognizes common vendors:

- APPLE, THALES, GEMALTO, IDEMIA, SAMSUNG
- GOOGLE, MICROSOFT, ORACLE, IBM
- ATOS, BULL, OBERTHUR, MORPHO, SAFRAN, AIRBUS

### Lab/CESTI Recognition

Common evaluation facilities:

- THALES, OPPIDA, SERMA, LETI, CEA
- AMOSSYS, APAVE, CESTI, OPPIDA+SERMA

### Context-Based Parsing

The scraper extracts a 500-character context window around each certificate reference to parse related metadata:

```typescript
const contextStart = Math.max(0, certIndex - 500)
const contextEnd = Math.min(cleanText.length, certIndex + 200)
const context = cleanText.substring(contextStart, contextEnd)
```

**Product Name Extraction**:

- Pattern: `VENDOR ProductName EAL`
- Filters out table headers: "Nom du produit", "Type de produit", etc.
- Cleans multiple spaces

**Lab Extraction**:

- Searches for known lab names in context
- Uses improved regex to handle French labels (`Centre d'évaluation`) and multi-line matching
- Excludes matches followed by "Autres"

**Product Category Extraction**:

- Pattern: `LAB Category DATE`
- Cleans and translates "Autres" to "Other"

**Date Extraction**:

- Pattern: `DD/MM/YYYY DD/MM/YYYY ANSSI`
- First date is start validity, second is end validity
- Converts to ISO format: YYYY-MM-DD

## Document URLs

### URL Format

ANSSI provides three document types per certificate:

1. **Certificate** (`Certificat.pdf`): Official certificate document
2. **Report** (`Rapport.pdf`): Evaluation report
3. **Security Target** (`Cible.pdf`): Security target specification

### URL Construction

```typescript
const visasBaseUrl = 'https://messervices.cyber.gouv.fr/visas'
const certCertificate = `${visasBaseUrl}/ANSSI-${certType}-${year}-${num}-Certificat.pdf`
const certReport = `${visasBaseUrl}/ANSSI-${certType}-${year}-${num}-Rapport.pdf`
const securityTarget = `${visasBaseUrl}/ANSSI-${certType}-${year}-${num}-Cible.pdf`
```

**Examples**:

- https://messervices.cyber.gouv.fr/visas/ANSSI-CC-2024-41-Certificat.pdf
- https://messervices.cyber.gouv.fr/visas/ANSSI-CC-2024-41-Rapport.pdf
- https://messervices.cyber.gouv.fr/visas/ANSSI-CC-2024-41-Cible.pdf

### Document Availability

**Note**: Not all certificates have all three documents available. Some URLs may return 404 errors if ANSSI hasn't uploaded the corresponding PDF. This is expected behavior and not a scraper error.

## Filtering

### Time Filter

Only certificates from the last 2 years are included:

```typescript
const cutoffDate = new Date()
cutoffDate.setFullYear(cutoffDate.getFullYear() - 2)
if (new Date(certDate) < cutoffDate) {
  continue // Skip older certificates
}
```

### Deduplication

Certificates are deduplicated by ID. If a certificate appears multiple times in the PDF, only the first occurrence is kept.

## Output Format

### ComplianceRecord Structure

```typescript
{
  id: string                    // "anssi-cc-2024-41"
  source: 'ANSSI'              // Always ANSSI
  date: string                 // ISO date YYYY-MM-DD
  link: string                 // Certificate detail page (currently baseUrl)
  type: 'Common Criteria'      // Always Common Criteria
  status: 'Active'             // Always Active
  pqcCoverage: string          // "No PQC Mechanisms Detected" (future: extract from PDFs)
  productName: string          // Extracted product name
  productCategory: string      // Product category or "Certified Product"
  vendor: string               // Extracted vendor
  certificationLevel?: string  // EAL level (e.g., "EAL4+")
  lab?: string                 // Evaluation facility/CESTI

  // Document URLs
  certificationReportUrls: [certCertificate, certReport]
  securityTargetUrls: [securityTarget]
}
```

### Example Record

```json
{
  "id": "anssi-cc-2024-41",
  "source": "ANSSI",
  "date": "2024-10-15",
  "link": "https://cyber.gouv.fr",
  "type": "Common Criteria",
  "status": "Active",
  "pqcCoverage": "No PQC Mechanisms Detected",
  "productName": "iPhone 16 Pro",
  "productCategory": "Autres",
  "vendor": "APPLE",
  "certificationLevel": "EAL4+",
  "lab": "THALES",
  "certificationReportUrls": [
    "https://messervices.cyber.gouv.fr/visas/ANSSI-CC-2024-41-Certificat.pdf",
    "https://messervices.cyber.gouv.fr/visas/ANSSI-CC-2024-41-Rapport.pdf"
  ],
  "securityTargetUrls": ["https://messervices.cyber.gouv.fr/visas/ANSSI-CC-2024-41-Cible.pdf"]
}
```

## Error Handling

### PDF Download Failure

If the catalog URL fails to download:

1. Log warning message
2. Check for cached PDF
3. Use cached PDF if available
4. Return empty array if no cache exists

```typescript
try {
  const pdfBuffer = await fetch(catalogUrl).then((res) => res.arrayBuffer())
  // ... process PDF
} catch (downloadError) {
  console.warn('[ANSSI] Failed to download PDF:', downloadError)
  if (fs.existsSync(cacheFile)) {
    console.log('[ANSSI] Using cached PDF')
    pdfBuffer = fs.readFileSync(cacheFile)
  } else {
    return []
  }
}
```

### PDF Parsing Errors

If `pdf-parse` throws an error:

1. Log error details
2. Fall back to empty results
3. Preserve existing data in database

```typescript
try {
  const parser = new PDFParse({ data: pdfBuffer })
  const pdfData = await parser.getText()
} catch (parseError) {
  console.error('[ANSSI] PDF parsing failed:', parseError)
  return []
}
```

### Missing Metadata

All optional fields use fallback values:

- `productName`: "Unknown Product" if not found
- `vendor`: "Unknown Vendor" if not found
- `lab`: undefined if not found
- `productCategory`: "Certified Product" if not found
- `certificationLevel`: undefined if no EAL match

## Integration

### CLI Usage

```bash
# Scrape only ANSSI
npm run scrape -- --anssi

# Force re-scrape (ignore cache)
npm run scrape -- --anssi --force

# Scrape all sources including ANSSI
npm run scrape -- --all
```

### Data Storage

ANSSI records are merged into `public/data/compliance-data.json` with all other compliance sources.

### UI Display

ANSSI certificates appear in:

1. **Common Criteria Tab**: Grouped with CC Portal and ENISA certificates
2. **Source Filter**: Available as "ANSSI" source option
3. **Detail Popover**: Shows all extracted metadata including lab, vendor, product category

## Performance

### Expected Results

- **Total Certificates in PDF**: ~400-500
- **Certificates After Filtering**: ~180-200 (last 2 years)
- **Scrape Time**:
  - First run (download): ~10-15 seconds
  - Cached run: ~5-8 seconds
- **PDF Size**: ~1.9 MB

### Optimization

- Local caching reduces network requests
- Hash-based change detection avoids unnecessary re-parsing
- Context-based extraction is faster than full-text search
- Regex patterns optimized for ANSSI's specific format

## Maintenance

### Updating Catalog URL

If the catalog URL changes or expires:

1. Visit: https://cyber.gouv.fr/offre-de-service/solutions-certifiees-et-qualifiees/services-de-securite-evalue/decouvrir-les-solutions-certifiees-qualifiees
2. Find "Catalogue des produits et services qualifiés, agréés et certifiés"
3. Copy the new URL
4. Update `catalogUrl` in `scripts/scrapers/anssi.ts`

### Adding New Vendors

To recognize new vendors, add them to the vendor regex pattern:

```typescript
const productMatch = context.match(/(?:APPLE|THALES|NEW_VENDOR)\\s+([A-Za-z0-9][^]+?)\\s+EAL\\d/i)
```

### Adding New Labs

To recognize new labs, add them to both patterns:

```typescript
const labMatch = context.match(/\\b(THALES|OPPIDA|NEW_LAB)\\b(?!\\s*Autres)/i)
const categoryMatch = context.match(/(?:THALES|OPPIDA|NEW_LAB)\\s+([A-Za-zÀ-ÿ\\s]{5,80}?)\\s+\\d{2}\\/\\d{2}\\/\\d{4}/i)
```

### Future Enhancements

1. **Cryptographic Algorithm Extraction**: Parse certificate PDFs to extract crypto algorithms
2. **Enhanced Product Name Parsing**: Improve accuracy for complex product names
3. **Certificate Status Tracking**: Track revoked or expired certificates
4. **Multi-language Support**: Handle French and English product names
5. **Detailed Link Pages**: Create dedicated detail pages for each certificate

## Known Issues

### PDF Parsing Reliability

The `pdf-parse` library occasionally throws `InvalidPDFException` even when the PDF downloads successfully. This appears to be a limitation of the library with certain PDF structures. The local cache helps mitigate this by preserving working PDFs.

### Document 404 Errors

Some constructed document URLs return 404 errors because ANSSI hasn't uploaded all documents for every certificate. This is expected and not a scraper error.

### Line-Wrapped References

Certificate references split across lines in the PDF require special handling. The current regex pattern handles this, but future PDF format changes may require updates.

## SSL Certificate Issues

The scraper uses `NODE_TLS_REJECT_UNAUTHORIZED=0` to bypass SSL certificate validation for government websites. This is set in `package.json`:

```json
"scrape": "NODE_TLS_REJECT_UNAUTHORIZED=0 npx tsx scripts/scrape-compliance.ts"
```

## References

- **ANSSI Portal**: https://cyber.gouv.fr
- **Certified Products**: https://cyber.gouv.fr/offre-de-service/solutions-certifiees-et-qualifiees
- **Common Criteria**: https://www.commoncriteriaportal.org/
- **Implementation**: [scripts/scrapers/anssi.ts](file:///Users/ericamador/antigravity/pqc-timeline-app/scripts/scrapers/anssi.ts)
