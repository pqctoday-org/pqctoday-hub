# Compliance & Certification Data Requirements

**Status:** ✅ Implemented  
**Last Updated:** 2025-12-16

## Overview

This document defines the technical requirements for the **Compliance & Certification** module, specifically focusing on fetching, parsing, and displaying cryptographic compliance data from authoritative government sources (NIST and Common Criteria).

## Data Sources & Scraping Methods

## Production Architecture: Static Data Pipeline (GitHub Pages)

To support deployment on **GitHub Pages** (which cannot run backend proxies) and to circumvent **strict CORS policies** on government data sources (NIST, NIAP), the compliance module uses a **Static Data Pipeline**.

### Architecture

1.  **Offline Scraper (`scripts/scrape-compliance.ts`)**: A Node.js script that runs in a CI environment. checking the real government sites using `jsdom`.
2.  **GitHub Action (`.github/workflows/update-compliance.yml`)**: A scheduled workflow (daily) that runs the scraper and commits the resulting `public/data/compliance-data.json` file back to the repository.
3.  **Frontend Consumption**: In Production mode (`import.meta.env.PROD`), the application fetches the pre-generated JSON file instead of attempting live scrapes. In Development mode, it retains the ability to proxy/scrape live for testing.

### Scraper Reliability Features

The scraper infrastructure includes several optimizations for reliability and data quality:

#### 1. Fetch with Retry & Exponential Backoff (`scripts/scrapers/utils.ts`)
- **Max Retries**: 3 attempts per request
- **Base Delay**: 1 second, doubling after each failure
- **Max Delay Cap**: 30 seconds
- **Use Case**: All HTTP fetches to government sites use this pattern to handle transient failures

#### 2. PDF Caching (`scripts/scrapers/utils.ts`)
- **Cache Location**: `.cache/pdfs/` directory
- **Cache Key**: MD5 hash of URL
- **Default TTL**: 7 days before re-download
- **Benefit**: Reduces redundant downloads during development and re-runs

#### 3. Health Checks & Validation (`scripts/scrapers/health.ts`)
- **Record Count Validation**: Compares new vs previous record counts per source
- **Expected Minimums**: NIST (100), ACVP (50), Common Criteria (200), ANSSI (20), ENISA (5)
- **Critical Alert**: Triggers on 50%+ drop in record count
- **Warning Alert**: Triggers when below expected minimum
- **Missing Source Alert**: Detects when a previously-present source returns 0 records
- **Behavior**: Build fails on critical health check unless `--force` flag is used

#### 4. Data Normalization (`scripts/scrapers/utils.ts`)
- **Date Standardization**: Converts US (MM/DD/YYYY), EU (DD/MM/YYYY), and other formats to ISO 8601 (YYYY-MM-DD)
- **Algorithm Normalization**: Maps legacy names to canonical form (e.g., `kyber` → `ML-KEM`, `dilithium` → `ML-DSA`, `sphincs` → `SPHINCS+`)
- **Deduplication**: Removes duplicate records by ID
- **Canonical PQC Names**: `ML-KEM`, `ML-DSA`, `SLH-DSA`, `LMS`, `XMSS`, `HSS`, `SPHINCS+`, `Falcon`

#### 5. Lab/ITSEF Extraction (`scripts/scrapers/utils.ts`)
- **Multi-language Support**: Parses English and French patterns for evaluation lab extraction
- **Pattern Priority**: 
  1. Explicit ITSEF/Lab fields
  2. "Testing was completed by" phrases  
  3. Known lab name matching (30+ labs)
- **Name Normalization**: Handles company suffixes (GmbH, Ltd, Inc, SAS, etc.)

### Build Lifecycle & Caching

- **Pre-Build Hook**: The scraper runs automatically via `npm run prebuild` (before `vite build`).
- **Staleness Criteria**: The scraper checks the `mtime` of `compliance-data.json`. If the file is **less than 7 days old**, scraping is skipped to minimize network load and build time. This can be overridden with the `--force` flag.
- **Supported Prebuild Scrapers**:
  - **NIST FIPS 140-3** (Full scrape + Deep Fetch)
  - **NIST ACVP** (Full scrape + PQC mechanism extraction)
  - **Common Criteria** (Global CSV + PDF parsing)
  - **ANSSI** (Direct list scraping + PDF parsing) - _Exclusive to Prebuild Pipeline_.

---

## Data Sources & Scraping Methods

### 1. NIST FIPS 140-3 (Cryptographic Module Validation Program)

- **Source URL:** `https://csrc.nist.gov/projects/cryptographic-module-validation-program/validated-modules/search/all`
- **Main List Scraping:**
  - **Method:** HTML Scraping via Proxy (`/api/nist-search`).
  - **Selector:** `#searchResultsTable tr`.
  - **Columns Mapped:** Cert # (Col 1), Vendor (Col 2), Module (Col 3), Date (Col 5).
  - **Pagination:** Fetch first 250 records.
- **Details Scraping:**
  - **Method:** Individual Fetch per Certificate (`/api/nist-cert/{CertID}`).
  - **Selector target:** `#fips-algo-table` (Approved Algorithms).
  - **Goal:** Identify PQC algorithms (e.g., ML-KEM, Kyber) and extracting Sunset Date.

### 2. NIST ACVP (Algorithm Validation)

- **Source URL:** `https://csrc.nist.gov/projects/cryptographic-algorithm-validation-program/validation-search`
- **Main List Scraping:**
  - **Method:** HTML Scraping via Proxy (or JSDOM in script).
  - **Per-Algorithm Strategy:** Due to NIST query limitations when multiple algorithms are combined, each algorithm group is fetched separately:
    - **ML-KEM:** `algorithm=179&algorithm=180` (Kyber variants)
    - **ML-DSA:** `algorithm=176&algorithm=177&algorithm=178` (Dilithium variants)
    - **LMS:** `algorithm=173&algorithm=174&algorithm=175` (Stateful hash-based signatures)
  - **Items Per Page:** `ipp=10000` to capture all available records per algorithm group.
  - **Deduplication:** Results are merged and deduplicated by certificate ID.
  - **Selector:** `.publications-table tr`.
- **Details Scraping:**
  - **Method:** Deep fetch for PQC mechanism extraction.

### 3. Extraction Logic

**PQC Detection Strategy:**
The scraper scans the detail text (from FIPS certificate pages or ACVP detail pages) for the following keywords/patterns:

- `ML-KEM`
- `ML-DSA`
- `SLH-DSA`
- `LMS`
- `XMSS`
- `Falcon`
- `SPHINCS+`
- `HSS`

**Classical Algorithm Collection:**
The scraper also collects standard algorithms to support backward compatibility analysis:

- `AES`
- `SHA` (SHA-1, SHA-2, SHA-3)
- `HMAC`
- `RSA`, `DSA`, `ECDSA`
- `DRBG`, `KAS`, `KTS`, `KBKDF`, `PBKDF`
- `Triple-DES`

**Field Population:**

- `pqcCoverage`: Populated with a comma-separated list of found PQC algorithms (e.g., "ML-KEM, LMS"). If none found, defaults to "No PQC Mechanisms Detected".
- `classicalAlgorithms`: Populated with a comma-separated list of found classical algorithms (e.g., "AES, RSA"). Displayed in UI via "CLA" column with Tooltip.

### 3. Common Criteria (CC) - International Portal

- **Source URL:** `https://www.commoncriteriaportal.org/products/certified_products.csv`
- **Main List Scraping:**
  - **Method:** CSV Parsing via Proxy (`/api/cc-data`).
  - **Format:** Full CSV dataset.
- **Details Scraping:**
  - **Method:** Downloads and parses the **PDF Certification Report** for each relevant record (certified after Jan 2024).
  - **Tool:** `pdf-parse` library used in the scraper script.
  - **Extraction:** Extracts full text from the PDF report to identify PQC and Classical algorithm keywords.

### 4. NIAP (United States CC)

- **Source:** Deprecated / Removed.
- **Rationale:** NIAP data is fully covered by the Global Common Criteria CSV (Scheme: US). Direct scraping was fragile and redundant.

### 5. BSI (Germany CC)

- **Source:** Derived from **Global Common Criteria CSV**.
- **Method:** Filter Global CSV where `Scheme` contains `(DE)`.

### 6. ANSSI (France CC)

    *   Source URL: `https://cyber.gouv.fr/produits-certifies` (PDF Catalog).
    *   **PDF Catalog Scraper Logic:**
        *   **Catalog Source:** Downloads the official "Liste des produits certifiés" PDF.
        *   **Parsing:** Uses `pdf-parse` to extracting tabular data (Vendor, Product, Lab, Dates).
        *   **Date Filter:** Dynamic **2-Year Rolling Window** (e.g., Records from Today - 2 Years).
        *   **Product Name:** Extracted directly from PDF table columns.
        *   **Vendor Extraction:** Extracted directly from PDF table columns.
        *   **Data Enrichment:** Extracts `Level` (Niveau) and `Lab` from the PDF context.
        *   **PDF Parsing (PQC & Lab Fallback):**
            *   **Dual-Fetch Strategy:**
                1.  **Security Target:** Fetched strictly to extract PQC info (`pqcCoverage`).
                2.  **Certification Report:** Fetched if Lab info is missing in catalog.
            *   **Crypto:** Scans ST text for PQC/Classical algorithms.
            *   **Lab Extraction:** Primary source is the Catalog PDF column. Secondary is the Report PDF using improved regex (`Centre d'évaluation`).
        *   **Date Normalization:** Parses French date formats (DD/MM/YYYY) to ISO 8601.
        *   **Link Recovery:** Constructs URLs based on certificate ID pattern `messervices.cyber.gouv.fr/visas/ANSSI-CC-{Yield}-{Num}...`.

### 7. Global Data Policy

- **Rolling Window:** All scrapers (NIST, CC, ANSSI) must strictly retain records from the **last 2 years only**.

---

## Filtering Criteria

### 1. FIPS 140-3

The application must strictly filter for the following criteria:

- **Standard:** `FIPS 140-3` (Transition from 140-2).
  - _Implementation:_ Append `Standard=FIPS+140-3` to the NIST search URL.
- **Security Level:** `Level 3` (L3) only.
  - _Implementation:_ Append `SecurityLevel=3` to the NIST search URL.
- **Status:** `Active` (exclude Historical/Revoked).
  - _Implementation:_ Append `ValidationStatus=Active` to the NIST search URL.
- **Validation Date:** **Last 2 Years** (Rolling Window).
  - _Implementation:_ Client-side filter on the `Validation Date` column after fetching.

### 2. Common Criteria

- **Status:** `Active` (implied by presence in "Certified Products" list vs "Archived").
- **Certification Date:** **Last 2 Years** (Rolling Window).
  - _Implementation:_ Client-side filter on the `Certification Date` column.
- **Relevance:** Focus on cryptographic or security-relevant categories (e.g., "Key Management", "Signature Generation") where applicable.
- **Product Type:** UI supports filtering by 'Category' (e.g., 'IC with Software', 'Network Device').

### 3. UI Filtering Requirements

- **Search**: Free text search against Product Name, Vendor, Certification ID, and Type.
- **Filter PQC**: Dropdown to filter by PQC algorithm coverage (ML-KEM, ML-DSA, LMS, etc.).
- **Filter Type**: Dropdown to filter by certification type and level (FIPS 140-3, ACVP, Common Criteria).
  - Shows unique certification types (e.g., "FIPS 140-3", "Common Criteria")
  - For CC records, also allows filtering by specific augmentations (e.g., "EAL4+", "EAL5+ ALC_DVS.2")
- **Filter Product**: Dropdown to filter by product category (e.g., "Cryptographic Module", "Access Control Devices").
- **Source Filter**: Dropdown to filter by specific data source (NIST, ANSSI, Common Criteria, ENISA).
- **Vendor Filter**: Dropdown with **search support** to filter by Manufacturer.
- **Scalable UI**:
  - **Pagination**: Client-side pagination (limit 50 items/page) to ensure performance with 2000+ records.
  - **Visual Feedback**: Loading overlay ("Filtering Records...") for operations > 400ms to provide user assurance.
  - **Performance**: Minimal row animations to prevent layout thrashing on large datasets.

---

## Data Extraction Logic

### 0. Source / Authority

- **Definition:** The agency or body providing the certification.
- **Values:**
  - **NIST FIPS / ACVP:** "NIST"
  - **Common Criteria (Global List):** "Common Criteria ({Scheme})"
    - _Logic:_ Extracts the 'Scheme' column from the CSV (e.g., "Common Criteria (FR)", "Common Criteria (US)").
  - **NIAP (US-Specific Scraper):** REMOVED.
  - **BSI (DE-Specific Scraper):** "BSI Germany"
  - **ANSSI (FR-Specific Scraper):** "ANSSI"
  - **ENISA:** "ENISA"

### 1. Certificate ID

- **FIPS:** Extract text from the **1st Column** (`<td>`) anchor tag (`<a>`).
  - _Example:_ "4282"
- **CC:** Extract from `Certification Report URL` filename.
  - _Logic:_ Parse filename ending in `.pdf`. Improved regex handles spaces and special characters.
  - _Example:_ `..._23FMV2873-35.pdf` -> `23FMV2873-35`.

### 2. Vendor Name

- **FIPS:** Extract text from **2nd Column**.
  - _Example:_ "Google, LLC"
- **CC:** Extract value from `Manufacturer` CSV column.

### 3. Product Name / Module Name

- **FIPS:** Extract text from **3rd Column**.
  - _Example:_ "BoringCrypto"
- **CC:** Extract value from `Name` CSV column.

### 4. Level of Certification

- **FIPS:**
  - _Primary:_ Enforced by Query Parameter `SecurityLevel=3`.
  - _Extraction:_ Can verify by deep-scraping detailed page (field: "Security Level").
- **CC:** Extract value from `Assurance Level` CSV column.
  - _Example:_ "EAL4+"

### 5. Issuance / Validation Date

- **FIPS:** Extract text from **5th Column** ("Validation Date").
  - _Format:_ Standardized to **ISO 8601 (`YYYY-MM-DD`)** by the backend scraper.
  - **Date Normalization:** Handles malformed dates (multiple concatenated dates) by extracting the first valid date pattern using regex `(\d{1,2}/\d{1,2}/\d{4})|(\d{4}-\d{2}-\d{2})`.
- **Data Normalization**:

* **Dates**: Must be converted to ISO 8601 `YYYY-MM-DD`.
* **Crypto Scopes**: Input algorithm lists (PQC and Classical) must be normalized to a canonical format (e.g., `ML-KEM`, `ML-DSA`, `SPHINCS+`) to ensure consistent filtering and deduplication.

- **CC:** Extract value from `Certification Date` CSV column.
  - _Format:_ Standardized to **ISO 8601 (`YYYY-MM-DD`)** by the backend scraper.
- **Sorting:** Default view must be **Most Recent First** (Date Descending).

### 6. Certification Level

- **FIPS:** Always "FIPS 140-3 L3" (enforced by query parameters).
- **CC (Global):** Extract from `Assurance Level` CSV column (e.g., "EAL4+", "EAL2+,ALC_FLR.3").
- **ANSSI:** Extracted from PDF Catalog columns.
- **Display:** Shown in TYPE column below the certification type badge.
- **Storage:** Stored in `certificationLevel` field, separate from `productCategory`.

### 7. Lab / Evaluation Facility

- **Definition:** The accredited laboratory that performed the evaluation.
- **Source:**
  - **CC (Global):** Primary: `Lab` or `ITSEF` CSV column. Secondary: Extracted from **Certification Report** PDF.
  - **ANSSI:** Primary: Extracted from **PDF Catalog**. Secondary: Extracted from **Certification Report** PDF.
- **Storage:** Stored in `lab` field. Used for detailed compliance reporting.

### 8. Product Category

- **FIPS:** "Cryptographic Module" (static).
- **ACVP:** "Algorithm Implementation" (static).
- **CC (Global):** Extract from `Category` CSV column (e.g., "Access Control Devices and Systems").
- **ANSSI:** Extracted from PDF Catalog columns or inferred.
- **Display:** Shown as gray subtitle text under product name.
- **Separation:** Must NOT contain certification level or augmentation details.

### 9. Status

- **FIPS:** Extract from **6th Column** (or implied "Active" by search filter).
- **CC:** Implied "Active" if in current list.

### 10. Expiry Date

- **FIPS:** Requires **Deep Fetch** of certificate detail page.
  - _Field:_ "Sunset Date" in the module info table.
- **CC:** Extract value from `Archived Date` string if present, or calculate based on scheme rules (typically 5 years from issuance).

### 11. PQC Algorithm Support Identification

How to identify if a certificate supports Post-Quantum Cryptography (e.g., ML-KEM, crystals-kyber):

- **FIPS (Heuristic + Deep Check):**
  1.  **Fast Check (List View):**
      - Inspect "Module Name" column.
      - **Keywords:** `Quantum`, `PQC`, `Kyber`, `Dilithium`, `Falcon`, `SPHINCS`.
  2.  **Deep Check (Detail View):**
      - Action: Fetch the **Certificate Detail Page** (e.g., `.../certificate/4282`).
      - Target: Parse the HTML for `#fips-algo-table` or the "Module Description" text block.
      - **Specific Algorithms to Match:**
        - `ML-KEM` (Module-Lattice-Based Key-Encapsulation Mechanism)
        - `ML-DSA` (Module-Lattice-Based Digital Signature Algorithm)
        - `SLH-DSA` (Stateless Hash-Based Digital Signature Algorithm) - _Sphincs+_
        - `Falcon`
        - `XMSS` / `LMS` (Stateful Hash-Based Signatures)
  - Check `Name` and `Category` columns for keywords: "Quantum", "PQC".
  - **Deep Check (PDF Parsing):**
    - Downloads the **Security Target** PDF (preferred) or Certification Report.
    - Scans text for PQC keywords (`ML-KEM`, etc.) and Classical keywords (`AES`, `RSA`, etc.).

---

## Persistence & Refresh Strategy

### 1. Persistence Layer

- **Library:** `localforage` (wraps IndexedDB).
- **Store Name:** `compliance_cache`.
- **Granular Cache Keys:**
  - `compliance_data_nist_v{X}`
  - `compliance_data_acvp_v{X}`
  - `compliance_data_cc_v{X}`
  - _Note:_ Keys are separated to allow independent failure and refresh cycles.
- **Timestamps:**
  - `compliance_data_ts_v{X}`: Stores a Map of timestamps e.g., `{ NIST: '...', ACVP: '...' }`.

### 2. Smart Refresh Mechanism

- **Startup:** App checks cache. If data exists and is **less than 7 days old**, it loads instantly without network activity.
- **Staleness Rule:** Auto-refresh only triggers if local data is older than **7 days**.
- **Selective Refresh:** If only one source is stale (e.g., NIST), only that source is fetched; others are loaded from cache.
- **Manual Refresh:** User action ("Refresh Data" button) forces a generic bypass, fetching all sources fresh.
- **Parallel Fetching & Timeouts:** All fetches run in parallel with 10-20s timeouts.

### 3. Failover

- **Failsafe:** If NIST FIPS scraping fails (e.g., bot block), the system falls back to a **Static Snapshot** (`NIST_SNAPSHOT`) bundled with the app.

## Data Availability Matrix

The following table summarizes the data fields available and extracted for each source:

| Source              | Cert ID                 | Vendor              | Product      | Date                 | PQC Detection                    | Deep Details?        |
| :------------------ | :---------------------- | :------------------ | :----------- | :------------------- | :------------------------------- | :------------------- |
| **NIST FIPS 140-3** | ✅ Extracted            | ✅ Extracted        | ✅ Extracted | ✅ Real (Validation) | ✅ High (Deep Scrape + Keywords) | ✅ Yes (API)         |
| **NIST ACVP**       | ✅ Extracted            | ✅ Extracted        | ✅ Extracted | ✅ Real (Validation) | ✅ Medium (Detail Check)         | ✅ Yes (Detail Page) |
| **Common Criteria** | ✅ Extracted (Filename) | ✅ Extracted        | ✅ Extracted | ✅ Real (Cert Date)  | ✅ High (PDF Text Extraction)    | ✅ Yes (PDF Parsing) |
| **BSI (DE)**        | ✅ Extracted (CC CSV)   | ✅ Extracted        | ✅ Extracted | ✅ Real (Cert Date)  | ✅ High (PDF Text Extraction)    | ✅ Yes (PDF Parsing) |
| **ANSSI (FR)**      | ✅ Extracted (Direct)   | ✅ Extracted (PDF)  | ✅ Extracted | ✅ Real (Cert Date)  | ✅ High (PDF Text Extraction)    | ✅ Yes (PDF Parsing) |
| **ENISA (EUCC)**    | ✅ Extracted (HTML)     | ✅ Extracted (HTML) | ✅ Extracted | ✅ Real (Cert Date)  | ✅ High (PDF Text Extraction)    | ✅ Yes (PDF Parsing) |

_Legend:_

- **✅ Extracted:** Data is directly parsed from the source (or authoritative Global CSV).
- **Deep Details:** System fetches individual Detail/Report pages for richer context (e.g., specific algorithm OIDs).

### 4. Link Management Policy (Strict Mode)

- **Objective:** Prevent "dead" or misleading links to generic search pages.
- **Rules:**
  1.  **Prioritization:**
      - **Primary:** Security Target PDF (Technical Specs).
      - **Secondary:** Certification Report PDF (Validation Results).
      - **Tertiary:** Other PDF documents.
  2.  **Strict Validation:** The `link` field (Official Record Source) is **ONLY** populated if a valid PDF URL is found.
  3.  **No Fallback:** If no PDF is found, the link is set to an empty string, disabling the "Official Record Source" button in the UI.
  4.  **Multi-Document Support:** All found valid PDFs are stored in `certificationReportUrls` and `securityTargetUrls` arrays for display in the Details Popover.

---

## Export Features

- **CSV Export:**
  - **Trigger:** "Export CSV" button in table header.
  - **Data:** Exports the _currently filtered and sorted_ view of the table.
  - **Format:** Standard CSV (Comma Separated Values) via `PapaParse`.
  - **Filename:** `compliance_data_YYYY-MM-DD.csv`.

---

## Scraping Viability & Recommendations

Based on E2E Validation Tests, the sources categorize as follows:

### 1. Stable Sources (Live Fetch Supported)

These sources respond reliably to standard HTTP requests and are suitable for live client-side fetching via proxy.

- **NIST FIPS 140-3**: ✅ Stable (API-like structure, consistent selectors).
- **NIST ACVP**: ✅ Stable (Consistent `publications-table`).
- **Common Criteria (Global)**: ✅ Stable (Direct CSV download).

### 2. Fragile Sources (Static Data Recommended)

These sources exhibit active bot protection (Cloudflare/Incapsula) or frequent structural changes that block simple scrape proxies.

- **BSI (DE)**: ⚠️ **Fragile**. (Dynamic redirects, unstable selectors).
- **ANSSI (FR)**: ⚠️ **Fragile**. (Requires PDF parsing infrastructure).
- **ENISA (EUCC)**: ⚠️ **Moderate**. (Requires PDF parsing infrastructure).

### Recommendation: Scheme-Based Derivation + Prebuild

**Unified Strategy:**

- **Tier 1 (NIST FIPS / ACVP):** Live Fetching via proxy.
- **Tier 2 (CC / ANSSI / ENISA):** **Prebuild Scrape Only**.
  - **Global CC:** Scraped via CSV + PDF Parsing.
  - **ANSSI:** Scraped via PDF Catalog + PDF Parsing.
  - **ENISA:** Scraped via HTML List + PDF Parsing.

---
