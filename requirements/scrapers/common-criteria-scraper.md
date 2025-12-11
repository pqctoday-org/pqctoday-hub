# Common Criteria Scraper Requirements

## Data Source
- **URL**: `https://www.commoncriteriaportal.org/products/index.cfm?archived=0&pg=1&ipp=25&orderby=DESC&sortby=CERTIFICATION_DATE&download=1`
- **Type**: CSV Download
- **Update Frequency**: Daily (automated via GitHub Actions)

## Scraping Method

### Primary Data Extraction
1. **Target**: All active Common Criteria certified products
2. **Filter**: Recent certifications (>= 2 years ago)
3. **Extraction Method**: CSV parsing using PapaParse
4. **Secondary**: PDF parsing for detailed algorithm information

### CSV Fields Available

| CSV Column | Maps To | Format | Example | Notes |
|------------|---------|--------|---------|-------|
| `Name` | `productName` | string | `"Acme Secure OS v2.0"` | Product name |
| `Certification Date` | `date` | Date string | `"2024-03-15"` | Certification date |
| `Category` | `productCategory` | string | `"Operating Systems"` | Product category |
| `Assurance Level` | `certificationLevel` | string | `"EAL4+ ALC_FLR.3"` | CC assurance level |
| `Scheme` | Appended to `vendor` | string | `"US"`, `"DE"`, `"FR"` | Certification scheme |
| `Manufacturer` | `vendor` | string | `"Acme Corporation"` | Vendor name |
| `Lab` | `lab` | string | `"Acme Test Lab"` | Evaluation facility (if available) |
| `ITSEF` | `lab` (fallback) | string | `"IT Security Evaluation Facility"` | Alternative lab field |
| `Evaluation Facility` | `lab` (fallback) | string | `"Evaluation Lab Inc."` | Another lab field variant |
| `Security Target URL` | Used for PDF fetch | URL | `http://...ST.pdf` | Security Target document |
| `Certification Report URL` | `link` | URL | `http://...Report.pdf` | Certification report |

### Data Fields Extracted

| Field | Source | Format | Example | Notes |
|-------|--------|--------|---------|-------|
| `id` | Generated | `cc-{name}-{random}` | `cc-acme-secure-os-v2-0-a1b2` | Unique identifier |
| `source` | Static | `"Common Criteria"` | `"Common Criteria"` | Always "Common Criteria" |
| `date` | CSV: `Certification Date` | ISO 8601 (YYYY-MM-DD) | `"2024-03-15"` | Normalized date |
| `link` | CSV: `Certification Report URL` | Full URL (encoded) | `https://...Report.pdf` | URL-encoded link |
| `type` | Static | `"Common Criteria"` | `"Common Criteria"` | Certification type |
| `status` | Static | `"Active"` | `"Active"` | All scraped records are active |
| `pqcCoverage` | PDF + Heuristic | boolean \| string | `"ML-KEM, ML-DSA"` | Extracted from PDF or name |
| `classicalAlgorithms` | PDF extraction | string | `"AES-256, RSA-2048"` | Comma-separated list |
| `productName` | CSV: `Name` | string | `"Acme Secure OS v2.0"` | Product name |
| `productCategory` | CSV: `Category` | string | `"Operating Systems"` | Product category |
| `vendor` | CSV: `Manufacturer` + `Scheme` | string | `"Acme Corp (Scheme: US)"` | Vendor with scheme |
| `lab` | CSV: `Lab` \| `ITSEF` \| PDF | string | `"Acme Test Lab"` | Evaluation facility |
| `certificationLevel` | CSV: `Assurance Level` | string | `"EAL4+ ALC_FLR.3"` | CC assurance level |

## URL Encoding Logic

The CSV contains URLs with spaces and special characters that must be properly encoded:

```typescript
const encodeURL = (url: string) => {
  if (!url || !url.startsWith('http')) return url
  try {
    const urlObj = new URL(url)
    // Encode only the pathname, keeping protocol and host intact
    urlObj.pathname = urlObj.pathname
      .split('/')
      .map(encodeURIComponent)
      .join('/')
    return urlObj.toString()
  } catch {
    return url // Return original if parsing fails
  }
}

// Example:
// Input:  "http://example.com/files/Report File (123).pdf"
// Output: "http://example.com/files/Report%20File%20%28123%29.pdf"
```

## Lab Field Extraction Priority

1. **CSV `Lab` field** (highest priority)
2. **CSV `ITSEF` field**
3. **CSV `Evaluation Facility` field**
4. **PDF extraction** (fallback)

### PDF Lab Extraction

```typescript
// Extract from Security Target or Certification Report PDF
const labMatch = pdfText.match(
  /(?:Evaluation Facility|ITSEF|Evaluation Body)\s*:?\s*([^\n\r,]+)/i
)
if (labMatch) {
  labFromPDF = labMatch[1].trim().substring(0, 50) // Cap at 50 chars
}

// Final lab value:
lab = csvLab || csvITSEF || csvEvalFacility || labFromPDF || undefined
```

## PQC Detection Strategy

### 1. Name-Based Heuristic
```typescript
if (productName.match(/quantum|pqc/i)) {
  pqcCoverage = "Potentially PQC (Name Match)"
}
```

### 2. PDF Extraction
```typescript
// Fetch Security Target or Certification Report PDF
const pdfText = await parsePDF(pdfUrl)

// Extract PQC algorithms
const pqcPatterns = /ML-KEM|ML-DSA|CRYSTALS|Kyber|Dilithium|SPHINCS|LMS|XMSS/gi
const pqcMatches = pdfText.match(pqcPatterns)

if (pqcMatches) {
  pqcCoverage = Array.from(new Set(pqcMatches)).join(', ')
} else if (pqcCoverage === "Potentially PQC") {
  pqcCoverage = "No PQC Mechanisms Detected"
}
```

### 3. Classical Algorithm Extraction
```typescript
const classicalPatterns = /AES-(?:128|192|256)|RSA-(?:2048|3072|4096)|SHA-(?:256|384|512)|ECDSA/gi
const classicalMatches = pdfText.match(classicalPatterns)
classicalAlgorithms = Array.from(new Set(classicalMatches)).join(', ')
```

## Batch Processing

To avoid overwhelming the server and manage memory:

```typescript
const BATCH_SIZE = 5
const records = []

for (let i = 0; i < candidateRecords.length; i += BATCH_SIZE) {
  const batch = candidateRecords.slice(i, i + BATCH_SIZE)
  const batchResults = await Promise.all(
    batch.map(record => processRecord(record))
  )
  records.push(...batchResults.filter(r => r !== null))
  
  // Progress logging
  if (i % 20 === 0) {
    console.log(`[CC] Processed ${i} / ${total} records...`)
  }
}
```

## Error Handling

- **CSV Parse Errors**: Abort scraping, log error
- **PDF Fetch Errors**: Log warning, continue with CSV data only
- **PDF Parse Errors**: Log warning, skip PDF extraction for that record
- **Invalid URLs**: Skip URL encoding, use original URL
- **Missing Required Fields**: Skip record, log warning

## Output Format

```json
{
  "id": "cc-acme-secure-os-v2-0-a1b2",
  "source": "Common Criteria",
  "date": "2024-03-15",
  "link": "http://www.commoncriteriaportal.org/files/epfiles/Certification%20Report%20Acme%20Secure%20OS%20v2.0.pdf",
  "type": "Common Criteria",
  "status": "Active",
  "pqcCoverage": "ML-KEM-768, ML-DSA-65",
  "classicalAlgorithms": "AES-256, SHA-256, RSA-2048",
  "productName": "Acme Secure OS v2.0",
  "productCategory": "Operating Systems",
  "vendor": "Acme Corporation (Scheme: US)",
  "lab": "Acme Test Lab",
  "certificationLevel": "EAL4+ ALC_FLR.3"
}
```

## Known Limitations

1. **PDF Availability**: Not all products have accessible PDFs
2. **PDF Quality**: Some PDFs are scanned images, not searchable text
3. **Lab Field Inconsistency**: Lab information may be in different CSV fields or only in PDF
4. **URL Encoding**: Some URLs may still be malformed even after encoding
5. **PQC Detection**: Heuristic-based, may miss some PQC implementations
6. **Rate Limiting**: Large batch processing may trigger rate limits

## Performance Considerations

- **Batch Size**: 5 concurrent PDF fetches
- **Total Records**: ~862 recent certifications (>= 2 years)
- **PDF Fetch**: ~50% of records have accessible PDFs
- **Total Time**: ~10-15 minutes for full scrape
- **Memory**: PDF parsing can be memory-intensive
