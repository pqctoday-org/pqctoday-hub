# ANSSI (French Common Criteria) Scraper Requirements

## Data Source

- **URL**: `https://cyber.gouv.fr/produits-certifies`
- **Type**: HTML Web Page
- **Update Frequency**: Daily (automated via GitHub Actions)

## Scraping Method

### Primary Data Extraction

1. **Target**: ANSSI certified products (French Common Criteria scheme)
2. **Extraction Method**: DOM parsing (JSDOM) of Product Detail Pages (Body Text Regex)
3. **Secondary**: PDF parsing (Cert Report > ST) for Algorithms (PQC/Classical) and Lab fallback

### HTML Structure

The ANSSI website lists certified products with links to detail pages. Each detail page contains:

- Product information
- Certification metadata
- Links to certification documents (Certificat, Rapport, Cible de sécurité)

### Data Fields Extracted

| Field                     | Source                          | Format                  | Example                                   | Notes                          |
| ------------------------- | ------------------------------- | ----------------------- | ----------------------------------------- | ------------------------------ |
| `id`                      | Generated                       | `anssi-{name}-{random}` | `anssi-acme-firewall-a1b2`                | Unique identifier              |
| `source`                  | Static                          | `"ANSSI"`               | `"ANSSI"`                                 | Always "ANSSI"                 |
| `date`                    | HTML/PDF: Certification date    | ISO 8601 (YYYY-MM-DD)   | `"2024-03-15"`                            | Extracted from metadata        |
| `link`                    | HTML: Detail page URL           | Full URL                | `https://cyber.gouv.fr/...`               | Product detail page            |
| `type`                    | Static                          | `"Common Criteria"`     | `"Common Criteria"`                       | ANSSI uses CC                  |
| `status`                  | Static                          | `"Active"`              | `"Active"`                                | All scraped records are active |
| `pqcCoverage`             | PDF extraction                  | boolean \| string       | `"ML-KEM, ML-DSA"`                        | Extracted from PDF             |
| `classicalAlgorithms`     | PDF extraction                  | string                  | `"AES-256, SHA-256"`                      | Comma-separated list           |
| `productName`             | HTML: Product name              | string                  | `"Acme Firewall v3.0"`                    | Product name                   |
| `productCategory`         | HTML: `Catégorie` regex         | string                  | `"Firewall"`                              | Product category               |
| `vendor`                  | HTML: `Développeur` regex       | string                  | `"Acme Corporation"`                      | Vendor/developer               |
| `lab`                     | HTML (Primary) / PDF (Fallback) | string                  | `"LETI"`                                  | Evaluation center              |
| `certificationLevel`      | HTML: `Niveau` regex            | string                  | `"EAL4+ AVA_VAN.5"`                       | CC level with augmentations    |
| `certificationReportUrls` | PDF Links                       | array                   | `["...Certificat.pdf", "...Rapport.pdf"]` | Validation docs                |
| `securityTargetUrls`      | PDF Links                       | array                   | `["...Cible.pdf"]`                        | Technical specs                |

## PDF Metadata Extraction

ANSSI certification reports contain structured metadata in French:

```typescript
// Metadata fields in PDF:
{
  "Référence du rapport de certification": "ANSSI-CC-2024/12",
  "Nom du produit": "Acme Firewall v3.0",
  "Référence/version du produit": "v3.0",
  "Développeur": "Acme Corporation",
  "Centre d'évaluation": "LETI",
  "Critères d'évaluation et version": "Critères Communs v3.1 R5",
  "Niveau d'évaluation": "EAL4+",
  "Augmentations": "AVA_VAN.5, ALC_FLR.3",
  "Catégorie": "Firewall"
}
```

### Extraction Logic

```typescript
// Extract metadata from PDF
const metadata = {
  productName: extractField(pdfText, /Nom du produit\s*:?\s*([^\n]+)/i),
  vendor: extractField(pdfText, /Développeur\s*:?\s*([^\n]+)/i),
  lab: extractField(pdfText, /Centre d'évaluation\s*:?\s*([^\n]+)/i),
  level: extractField(pdfText, /Niveau d'évaluation\s*:?\s*([^\n]+)/i),
  augmentation: extractField(pdfText, /Augmentations?\s*:?\s*([^\n]+)/i),
  category: extractField(pdfText, /Catégorie\s*:?\s*([^\n]+)/i),
}

// Combine level and augmentation
certificationLevel = metadata.level
  ? `${metadata.level}${metadata.augmentation ? ' ' + metadata.augmentation : ''}`.trim()
  : undefined

// Use category for productCategory
productCategory = metadata.category || 'Certified Product'
```

## Lab Field Extraction

The lab (evaluation center) is extracted from the PDF metadata:

```typescript
// French field name: "Centre d'évaluation"
// Priority: Extracted from Certification Report (best source) -> Security Target -> Other
const labMatch = pdfText.match(
  /(?:Centre d'évaluation|Evaluation Facility|ITSEF)\s*:?\s*([^\n\r,]+)/i
)
if (labMatch) {
  lab = labMatch[1].trim()
}

// Common ANSSI evaluation centers:
// - CEA - LETI
// - Thales CESTI
// - Oppida
// - Amossys
// - Serma Safety & Security
```

## PDF Link Categorization

The scraper recovers all PDF links using a relaxed selector `a[href*=".pdf"]` to handle query parameters. Links are then categorized based on keywords in the URL or link text:

1.  **Security Targets (`securityTargetUrls`)**:
    - Keywords: `cible`, `security target`, `st`
2.  **Certification Reports (`certificationReportUrls`)**:
    - Keywords: `rapport`, `certification`, `report`, `certificat`
3.  **Other Documents (`additionalDocuments`)**:
    - Anything not matching the above.

## Product Category Extraction

Product categories are extracted from the "Catégorie" metadata field in French:

```typescript
const categoryMatch = pdfText.match(/Catégorie\s*:?\s*([^\n\r]+)/i)
if (categoryMatch) {
  productCategory = categoryMatch[1].trim()
}

// Common categories (in French):
// - "Pare-feu" (Firewall)
// - "Système d'exploitation" (Operating System)
// - "Carte à puce" (Smart Card)
// - "Module cryptographique" (Cryptographic Module)
```

## Certification Level Extraction

ANSSI uses Common Criteria levels with augmentations:

```typescript
// Extract level (e.g., "EAL4+")
const levelMatch = pdfText.match(/Niveau d'évaluation\s*:?\s*([^\n]+)/i)
const level = levelMatch ? levelMatch[1].trim() : ''

// Extract augmentations (e.g., "AVA_VAN.5, ALC_FLR.3")
const augMatch = pdfText.match(/Augmentations?\s*:?\s*([^\n]+)/i)
const augmentation = augMatch ? augMatch[1].trim() : ''

// Combine
certificationLevel = level ? `${level}${augmentation ? ' ' + augmentation : ''}`.trim() : undefined

// Example output: "EAL4+ AVA_VAN.5, ALC_FLR.3"
```

## PQC Detection

```typescript
// Name-based heuristic
if (productName.match(/quantum|pqc|post-quantique/i)) {
  pqcCoverage = 'Potentially PQC (Name Match)'
}

// PDF extraction
const pqcPatterns = /ML-KEM|ML-DSA|CRYSTALS|Kyber|Dilithium|SPHINCS|LMS|XMSS/gi
const pqcMatches = pdfText.match(pqcPatterns)

if (pqcMatches) {
  pqcCoverage = Array.from(new Set(pqcMatches)).join(', ')
} else if (pqcCoverage === 'Potentially PQC') {
  pqcCoverage = 'No PQC Mechanisms Detected'
}
```

## Error Handling

- **Network Errors**: Retry up to 3 times with exponential backoff
- **PDF Fetch Errors**: Log warning, skip record
- **PDF Parse Errors**: Common with scanned PDFs
  - `InvalidPDFException`: Skip PDF extraction, use HTML data only
  - Log warning with product name for debugging
- **Missing Metadata**: Use fallback values or skip field

## Output Format

```json
{
  "id": "anssi-acme-firewall-v3-0-a1b2",
  "source": "ANSSI",
  "date": "2024-03-15",
  "link": "https://cyber.gouv.fr/produits-certifies/acme-firewall-v3-0",
  "type": "Common Criteria",
  "status": "Active",
  "pqcCoverage": "No PQC Mechanisms Detected",
  "classicalAlgorithms": "AES-256, SHA-256",
  "productName": "Acme Firewall v3.0",
  "productCategory": "Pare-feu",
  "vendor": "Acme Corporation",
  "lab": "LETI",
  "certificationLevel": "EAL4+ AVA_VAN.5, ALC_FLR.3"
}
```

## Known Limitations

1. **PDF Quality**: Many ANSSI PDFs are scanned images, not searchable text
   - Results in `InvalidPDFException` errors
   - Scraper continues with HTML data only
2. **French Language**: Metadata is in French, requires French field names
3. **PDF Availability**: Not all products have accessible PDFs
4. **Metadata Inconsistency**: Field names and formats vary across PDFs
5. **PQC Detection**: Limited PQC adoption in ANSSI certifications
6. **Rate Limiting**: ANSSI website may rate-limit requests

## Performance Considerations

- **Total Records**: ~210 ANSSI certifications
- **PDF Fetch**: ~70% of records have accessible PDFs
- **PDF Parse Success**: ~50% (many are scanned images)
- **Total Time**: ~5-7 minutes for full scrape
- **Error Rate**: ~30-40% PDF parse errors (expected)

## Language Considerations

All metadata extraction must handle French field names:

| English           | French              | Field Name                   |
| ----------------- | ------------------- | ---------------------------- |
| Product Name      | Nom du produit      | `productName`                |
| Developer         | Développeur         | `vendor`                     |
| Evaluation Center | Centre d'évaluation | `lab`                        |
| Evaluation Level  | Niveau d'évaluation | `certificationLevel`         |
| Augmentations     | Augmentations       | Part of `certificationLevel` |
| Category          | Catégorie           | `productCategory`            |
