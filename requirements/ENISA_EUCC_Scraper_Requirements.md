# ENISA EUCC Scraper Requirements

## Overview

The ENISA EUCC scraper extracts European Union Cybersecurity Certification (EUCC) certificates from the ENISA certification portal. EUCC is the European Common Criteria-based cybersecurity certification scheme.

## Data Source

**Portal URL**: https://certification.enisa.europa.eu/certificates_en

**Certificate Detail Pages**: Follow pattern `https://certification.enisa.europa.eu/certificates/{certificate-id}_en`

**Example Certificates**:

- https://certification.enisa.europa.eu/certificates/eucc-3090-2025-10-0004_en
- https://certification.enisa.europa.eu/certificates/eucc-3110-2025-09-2500093-01_en

## Data Structure

ENISA certificate pages use an HTML table structure with label-value pairs. Each certificate contains detailed metadata about the certified product.

### Required Fields

| Field                  | Label in HTML                                                | Example Value                        | Notes                      |
| ---------------------- | ------------------------------------------------------------ | ------------------------------------ | -------------------------- |
| Certificate ID         | "Certificate ID"                                             | "CERTIFICATE EUCC-3090-2025-10-0004" | Unique identifier          |
| Product Name           | "Name of Product"                                            | "S3NSEN6"                            | Official product name      |
| Product Type           | "Type of Product"                                            | "smart card and similar device"      | Category of product        |
| Product Version        | "Version of Product"                                         | "S3NSEN6_20250630"                   | Specific version certified |
| Vendor                 | "Name of the Holder"                                         | "SAMSUNG ELECTRONICS CO. LTD"        | Certificate holder         |
| Lab (ITSEF)            | "Name of the ITSEF which performed the evaluation"           | "CEA-LETI"                           | Evaluation facility        |
| Certification Body     | "Name of the certification body that issued the certificate" | "ANSSI"                              | Issuing authority          |
| Scheme                 | "Scheme"                                                     | "(UE) 2024/482 - EUCC"               | Certification scheme       |
| Assurance Level        | "Assurance level"                                            | "High"                               | Security assurance level   |
| Certificate Issue Date | "Certificate issue date"                                     | "16/10/2025"                         | Date of issuance           |

### Optional Fields

| Field              | Label in HTML        | Example Value                                                                    | Notes                             |
| ------------------ | -------------------- | -------------------------------------------------------------------------------- | --------------------------------- |
| Protection Profile | "Protection Profile" | "Security IC Platform Protection Profile with Augmentation Packages version 1.0" | PP used for evaluation            |
| CC Version         | "CC Version"         | "ISO/IEC 15408:2022"                                                             | Common Criteria version           |
| CEM Version        | "CEM Version"        | "ISO/IEC 18045:2022"                                                             | Evaluation methodology version    |
| AVA_VAN Level      | "AVA_VAN Level"      | "5"                                                                              | Vulnerability assessment level    |
| Package            | "Package"            | "EAL5 AugmentéADV_IMP.2, ADV_INT.3, ADV_TDS.5..."                                | Full augmentation package details |
| Responsible NCCA   | "Responsible NCCA"   | "ANSSI"                                                                          | National certification authority  |

### Document URLs

ENISA provides multiple PDF documents for each certificate:

1. **Certification Report**: Certificate document
2. **Security Target**: Product security specifications
3. **Additional Documents**: Other evaluation artifacts

Documents are linked in the HTML with `<a href="...pdf">` tags and can be categorized by:

- Filename/URL contains "certificate", "cert", "report" → Certification Report
- Filename/URL contains "security", "target", "st" → Security Target
- All others → Additional Documents

## Extraction Logic

### HTML Parsing Strategy

The scraper uses a custom `extractField(label: string)` function that:

1. **Locates Field Labels**: Searches for the exact label text in the page content
2. **Extracts Value**: Captures text between the label and the next field label
3. **Cleans Value**: Removes tabs, collapses whitespace, trims
4. **Validates**: Ensures value length is reasonable (1-300 characters)

### Field Label Recognition

The scraper recognizes 25+ field labels including:

- Certificate ID, Name of Product, Type of Product, Version of Product
- Name of the Holder, Address of the Holder, Contact Information
- Name of the certification body, NANDO ID, Address of the certification body
- Name of the ITSEF, Responsible NCCA, Scheme
- Assurance level, CC Version, CEM Version, AVA_VAN Level, Package
- Protection Profile, Year of issuance, Month of Issuance
- Certificate issue date, period of validity

### Date Parsing

Dates are extracted from:

1. "Certificate issue date" field (format: DD/MM/YYYY)
2. `<time>` HTML elements
3. `.certification-date` or `.date` CSS classes

Dates are converted to ISO format (YYYY-MM-DD) for storage.

### Filtering

**Time Filter**: Only certificates from the last 2 years are included.

**Cutoff Logic**:

```typescript
const cutoffDate = new Date()
cutoffDate.setFullYear(cutoffDate.getFullYear() - 2)
if (new Date(date) < cutoffDate) {
  break // Stop scraping older records
}
```

## Algorithm Detection

### PDF Parsing

The scraper attempts to download and parse Security Target PDFs to detect cryptographic algorithms:

1. **Download PDF**: Fetches from ENISA portal
2. **Extract Text**: Uses `pdf-parse` library
3. **Pattern Matching**: Searches for PQC and classical algorithm patterns
4. **Categorization**:
   - **PQC Algorithms**: ML-KEM, ML-DSA, SLH-DSA, LMS, XMSS, HSS
   - **Classical Algorithms**: AES, SHA-256, RSA, ECDSA, etc.

### Fallback

If PDF parsing fails (network error, invalid PDF, etc.):

- `pqcCoverage`: "No PQC Mechanisms Detected"
- `classicalAlgorithms`: "" (empty)

## Output Format

### ComplianceRecord Structure

```typescript
{
  id: string                    // "enisa-eucc-{certId}"
  source: 'ENISA'              // Always ENISA
  date: string                 // ISO date YYYY-MM-DD
  link: string                 // Certificate detail page URL
  type: 'EUCC'                 // Always EUCC
  status: 'Active'             // Always Active
  pqcCoverage: string          // PQC algorithms or "No PQC Mechanisms Detected"
  classicalAlgorithms?: string // Comma-separated classical algorithms
  productName: string          // Truncated to 150 chars
  productCategory: string      // Product type or "EUCC Certified Product"
  vendor: string               // Certificate holder
  certificationLevel?: string  // Package info or assurance level
  lab?: string                 // ITSEF name

  // EUCC-specific metadata
  productType?: string         // Type of product
  productVersion?: string      // Version of product
  certificationBody?: string   // Issuing certification body
  scheme?: string              // Certification scheme
  protectionProfile?: string   // Protection profile used
  ccVersion?: string           // CC version
  cemVersion?: string          // CEM version
  avaVanLevel?: string         // AVA_VAN level
  packageInfo?: string         // Full package/augmentation details

  // Document URLs
  certificationReportUrls?: string[]
  securityTargetUrls?: string[]
  additionalDocuments?: Array<{ name: string; url: string }>
}
```

## Error Handling

### Portal Accessibility

If the ENISA portal is not accessible:

```typescript
try {
  const html = await fetchText(listUrl)
  // ... parse certificates
} catch (fetchError) {
  console.warn('[ENISA] Portal not accessible or structure changed:', fetchError)
  return [] // Return empty array
}
```

### PDF Parsing Errors

If PDF parsing fails for a specific certificate:

```typescript
try {
  const pdfBuffer = await fetch(absolutePdfUrl).then((res) => res.arrayBuffer())
  // ... parse PDF
} catch (e) {
  console.warn('[ENISA] PDF parsing error:', e)
  // Continue with default values
}
```

### Missing Fields

All optional fields use fallback values:

- `lab`: undefined if not found
- `productType`: undefined if not found
- `certificationLevel`: undefined if no package info or assurance level
- etc.

## Integration

### CLI Usage

```bash
# Scrape only ENISA
npm run scrape -- --enisa

# Force re-scrape (ignore existing data)
npm run scrape -- --enisa --force

# Scrape all sources including ENISA
npm run scrape -- --all
```

### Data Storage

ENISA records are merged into `public/data/compliance-data.json` with all other compliance sources.

### UI Display

ENISA EUCC certificates appear in:

1. **Common Criteria Tab**: Filtered with CC Portal and ANSSI certificates
2. **Source Filter**: Available as "ENISA" source option
3. **Detail Popover**: Shows all extracted metadata including lab, product type, scheme, etc.

## Maintenance

### Portal Structure Changes

If ENISA changes their HTML structure:

1. Update field labels in `extractField()` function
2. Adjust regex patterns if needed
3. Test with sample certificate URLs
4. Verify all fields are extracted correctly

### New Fields

To add new fields:

1. Add field to `ComplianceRecord` type (frontend and backend)
2. Add extraction in ENISA scraper using `extractField()`
3. Include field in record creation
4. Update UI to display new field

### SSL Certificate Issues

The scraper uses `NODE_TLS_REJECT_UNAUTHORIZED=0` to bypass SSL certificate validation for government websites. This is set in `package.json`:

```json
"scrape": "NODE_TLS_REJECT_UNAUTHORIZED=0 npx tsx scripts/scrape-compliance.ts"
```

## Performance

### Expected Results

- **Certificates Found**: ~8-10 EUCC certificates (as of Dec 2024)
- **Scrape Time**: ~30-60 seconds (depends on PDF downloads)
- **PDF Downloads**: 1-3 PDFs per certificate (Security Target prioritized)

### Optimization

- Only downloads first Security Target PDF for algorithm detection
- Stops scraping when encountering certificates older than 2 years
- Reuses existing data when not using `--force` flag

## Example Certificate Data

```json
{
  "id": "enisa-eucc-certificate-eucc-3090-2025-10-0004",
  "source": "ENISA",
  "date": "2025-10-16",
  "link": "https://certification.enisa.europa.eu/certificates/eucc-3090-2025-10-0004_en",
  "type": "EUCC",
  "status": "Active",
  "pqcCoverage": "No PQC Mechanisms Detected",
  "productName": "S3NSEN6",
  "productCategory": "smart card and similar device",
  "vendor": "SAMSUNG ELECTRONICS CO. LTD",
  "certificationLevel": "EAL5 AugmentéADV_IMP.2, ADV_INT.3, ADV_TDS.5...",
  "lab": "CEA-LETI",
  "productType": "smart card and similar device",
  "productVersion": "S3NSEN6_20250630",
  "certificationBody": "ANSSI",
  "scheme": "(UE) 2024/482 - EUCC",
  "protectionProfile": "Security IC Platform Protection Profile with Augmentation Packages version 1.0",
  "ccVersion": "ISO/IEC 15408:2022",
  "cemVersion": "ISO/IEC 18045:2022",
  "avaVanLevel": "5",
  "certificationReportUrls": [
    "https://certification.enisa.europa.eu/document/download/7b7d94d0-aa57-49ca-867c-a9034c238a0a_en?filename=EUCC-3090-2025_10_04_Certificat.pdf"
  ],
  "securityTargetUrls": [
    "https://certification.enisa.europa.eu/document/download/bb223d5c-1035-461d-8173-127853d4fb37_en?filename=EUCC-3090-2025_10_04_cible.pdf"
  ]
}
```

## References

- **ENISA Portal**: https://certification.enisa.europa.eu/certificates_en
- **EUCC Scheme**: https://www.enisa.europa.eu/topics/certification/eucc
- **Common Criteria**: https://www.commoncriteriaportal.org/
- **Implementation**: [scripts/scrapers/enisa.ts](file:///Users/ericamador/antigravity/pqc-timeline-app/scripts/scrapers/enisa.ts)
