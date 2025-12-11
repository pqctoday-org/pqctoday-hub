# NIST FIPS 140-3 Scraper Requirements

## Data Source

- **URL**: `https://csrc.nist.gov/projects/cryptographic-module-validation-program/validated-modules/search`
- **Type**: HTML Web Page
- **Update Frequency**: Daily (automated via GitHub Actions)

## Scraping Method

### Primary Data Extraction

1. **Target**: FIPS 140-3 Level 3 validated modules
2. **Filter**: `validationLevel=140-3-L3`
3. **Extraction Method**: DOM parsing using JSDOM

### Data Fields Extracted

| Field                 | Source                       | Format                       | Example                     | Notes                                  |
| --------------------- | ---------------------------- | ---------------------------- | --------------------------- | -------------------------------------- |
| `id`                  | Generated                    | `fips-{cert#}`               | `fips-4853`                 | Unique identifier                      |
| `source`              | Static                       | `"NIST"`                     | `"NIST"`                    | Always "NIST"                          |
| `date`                | HTML: `.validation-date`     | ISO 8601 (YYYY-MM-DD)        | `"2024-03-15"`              | Normalized from various formats        |
| `link`                | HTML: Certificate detail URL | Full URL                     | `https://csrc.nist.gov/...` | Direct link to certificate             |
| `type`                | Static                       | `"FIPS 140-3"`               | `"FIPS 140-3"`              | Certification type                     |
| `status`              | HTML: Status badge           | `"Active"` \| `"Historical"` | `"Active"`                  | Validation status                      |
| `pqcCoverage`         | Heuristic                    | boolean \| string            | `"ML-KEM, ML-DSA"`          | Extracted from module name/description |
| `classicalAlgorithms` | Heuristic                    | string                       | `"AES, SHA-256"`            | Comma-separated list                   |
| `productName`         | HTML: Module name            | string                       | `"Acme Crypto Module v2.0"` | Product/module name                    |
| `productCategory`     | Static                       | `"Cryptographic Module"`     | `"Cryptographic Module"`    | Always same for FIPS                   |
| `vendor`              | HTML: Vendor name            | string                       | `"Acme Corporation"`        | Manufacturer/vendor                    |
| `lab`                 | Not available                | `undefined`                  | -                           | FIPS data doesn't include lab info     |
| `certificationLevel`  | Static                       | `"FIPS 140-3 L3"`            | `"FIPS 140-3 L3"`           | Always Level 3                         |

## Date Normalization Logic

The NIST FIPS data has inconsistent date formats. The scraper normalizes them:

```typescript
// Input formats encountered:
// - "03/15/2024"
// - "2024-03-15"
// - "03/15/202403/20/2024" (malformed - concatenated dates)

// Normalization:
1. Split on common delimiters (/, -, space)
2. Extract first valid date pattern
3. Convert to ISO 8601: YYYY-MM-DD
4. Validate date is reasonable (not in future, not before 2020)
```

## PQC Detection Heuristics

```typescript
// Name-based detection:
if (moduleName.match(/ML-KEM|ML-DSA|CRYSTALS|Kyber|Dilithium|SPHINCS|LMS|XMSS/i)) {
  pqcCoverage = extractedAlgorithms // e.g., "ML-KEM-768, ML-DSA-65"
}

// If no match:
pqcCoverage = 'No PQC Mechanisms Detected'
```

## Error Handling

- **Network Errors**: Retry up to 3 times with exponential backoff
- **Parse Errors**: Log warning, skip record, continue processing
- **Invalid Dates**: Use fallback date or skip record

## Output Format

```json
{
  "id": "fips-4853",
  "source": "NIST",
  "date": "2024-03-15",
  "link": "https://csrc.nist.gov/projects/cryptographic-module-validation-program/certificate/4853",
  "type": "FIPS 140-3",
  "status": "Active",
  "pqcCoverage": "ML-KEM-768, ML-DSA-65",
  "classicalAlgorithms": "AES-256, SHA-256, SHA-512",
  "productName": "Acme Quantum-Safe Crypto Module v2.0",
  "productCategory": "Cryptographic Module",
  "vendor": "Acme Corporation",
  "certificationLevel": "FIPS 140-3 L3"
}
```

## Known Limitations

1. **Lab Information**: Not available in FIPS 140-3 public data
2. **Date Quality**: Some dates are malformed and require normalization
3. **PQC Detection**: Heuristic-based, may have false positives/negatives
4. **Rate Limiting**: NIST may rate-limit requests; scraper includes delays
