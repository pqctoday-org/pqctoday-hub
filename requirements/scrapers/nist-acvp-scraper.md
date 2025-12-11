# NIST ACVP Scraper Requirements

## Data Source

- **URL**: `https://csrc.nist.gov/projects/cryptographic-algorithm-validation-program/validation/validation-list`
- **Type**: HTML Web Page with Search Form
- **Update Frequency**: Daily (automated via GitHub Actions)

## Scraping Method

### Primary Data Extraction

1. **Target**: ACVP validations for PQC algorithms
2. **Strategy**: Per-algorithm fetching to bypass NIST query limitations
3. **Algorithms Targeted**:
   - ML-KEM (IDs: 179, 180)
   - ML-DSA (IDs: 176, 177, 178)
   - LMS (IDs: 173, 174, 175)
4. **Extraction Method**: DOM parsing using JSDOM

### Query Strategy

Due to NIST ACVP search limitations (max 25 results per multi-algorithm query), the scraper uses a per-algorithm approach:

```typescript
const ALGORITHM_GROUPS = [
  { name: 'ML-KEM', ids: [179, 180] },
  { name: 'ML-DSA', ids: [176, 177, 178] },
  { name: 'LMS', ids: [173, 174, 175] },
]

// Fetch each algorithm group separately
for (const group of ALGORITHM_GROUPS) {
  const records = await fetchAlgorithmGroup(group)
  allRecords.push(...records)
}
```

### Data Fields Extracted

| Field                 | Source                    | Format                       | Example                        | Notes                              |
| --------------------- | ------------------------- | ---------------------------- | ------------------------------ | ---------------------------------- |
| `id`                  | Generated                 | `acvp-{cert#}-{algo}`        | `acvp-C1234-mlkem`             | Unique identifier                  |
| `source`              | Static                    | `"NIST"`                     | `"NIST"`                       | Always "NIST"                      |
| `date`                | HTML: Validation date     | ISO 8601 (YYYY-MM-DD)        | `"2024-03-15"`                 | Certificate issue date             |
| `link`                | HTML: Certificate URL     | Full URL                     | `https://csrc.nist.gov/...`    | Direct link to validation          |
| `type`                | Static                    | `"ACVP"`                     | `"ACVP"`                       | Certification type                 |
| `status`              | HTML: Status              | `"Active"` \| `"Historical"` | `"Active"`                     | Validation status                  |
| `pqcCoverage`         | Algorithm name            | string                       | `"ML-KEM-768"`                 | Specific algorithm validated       |
| `classicalAlgorithms` | Not applicable            | `""`                         | `""`                           | ACVP is PQC-specific               |
| `productName`         | HTML: Implementation name | string                       | `"Acme ML-KEM Implementation"` | Implementation name                |
| `productCategory`     | Static                    | `"Cryptographic Algorithm"`  | `"Cryptographic Algorithm"`    | Always same for ACVP               |
| `vendor`              | HTML: Vendor name         | string                       | `"Acme Corporation"`           | Vendor/implementer                 |
| `lab`                 | Not available             | `undefined`                  | -                              | ACVP data doesn't include lab info |
| `certificationLevel`  | Not applicable            | `undefined`                  | -                              | ACVP doesn't have levels           |

## Algorithm ID Mapping

| Algorithm | NIST IDs      | Description                                |
| --------- | ------------- | ------------------------------------------ |
| ML-KEM    | 179, 180      | Module-Lattice Key Encapsulation Mechanism |
| ML-DSA    | 176, 177, 178 | Module-Lattice Digital Signature Algorithm |
| LMS       | 173, 174, 175 | Leighton-Micali Signature                  |

## Search Parameters

```typescript
const searchParams = {
  algorithm: algorithmIds.join(','), // e.g., "179,180"
  validationYear: '', // All years
  implementationType: '', // All types
  vendor: '', // All vendors
  page: 1,
  resultsPerPage: 100,
}
```

## PQC Algorithm Extraction

```typescript
// Extract specific algorithm variant from validation details
const extractPQCAlgorithm = (validationText: string, algorithmName: string) => {
  // Look for patterns like "ML-KEM-768", "ML-DSA-65", etc.
  const patterns = {
    'ML-KEM': /ML-KEM-(?:512|768|1024)/g,
    'ML-DSA': /ML-DSA-(?:44|65|87)/g,
    LMS: /LMS-(?:SHA256|SHAKE)/g,
  }

  const matches = validationText.match(patterns[algorithmName])
  return matches ? matches.join(', ') : algorithmName
}
```

## Error Handling

- **Network Errors**: Retry up to 3 times with exponential backoff
- **Parse Errors**: Log warning, skip record, continue processing
- **Empty Results**: Log info, continue to next algorithm group
- **Rate Limiting**: Add 500ms delay between algorithm group fetches

## Output Format

```json
{
  "id": "acvp-C1234-mlkem",
  "source": "NIST",
  "date": "2024-03-15",
  "link": "https://csrc.nist.gov/projects/cryptographic-algorithm-validation-program/details?validation=C1234",
  "type": "ACVP",
  "status": "Active",
  "pqcCoverage": "ML-KEM-768",
  "classicalAlgorithms": "",
  "productName": "Acme Quantum-Safe Crypto Library v1.0",
  "productCategory": "Cryptographic Algorithm",
  "vendor": "Acme Corporation",
  "certificationLevel": undefined
}
```

## Known Limitations

1. **Query Limitations**: NIST limits results to 25 per multi-algorithm query
   - **Solution**: Per-algorithm fetching strategy
2. **Lab Information**: Not available in ACVP public data
3. **Algorithm Variants**: May require PDF parsing for exact parameter sets
4. **Historical Data**: Older validations may have different formats
5. **Rate Limiting**: NIST may throttle requests; scraper includes delays

## Performance Considerations

- **Batch Size**: 5 concurrent requests per algorithm group
- **Delay**: 500ms between algorithm groups
- **Timeout**: 30s per request
- **Total Time**: ~2-3 minutes for all PQC algorithms
