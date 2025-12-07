# Quantum Threat Impacts Requirements

**Status:** ✅ Implemented  
**Last Updated:** 2025-12-06

## 1. Functional Requirements

### 1.1 Dashboard View

- A dashboard or card-based view showing specific threats by industry.
- **Visuals**: High-impact icons/graphics for each industry with "Threat Level" indicators.

## 2. Industry Data Points (Draft)

### Finance

- **Threats**:
  - "Harvest Now, Decrypt Later" (HNDL) targeting long-term transaction records.
  - Forged digital signatures compromising transaction integrity.
- **Risk Level**: Critical

### IoT (Internet of Things)

- **Threats**:
  - Device longevity exceeding crypto lifespan.
  - "Ghost Incompatibilities" in firmware updates.
  - Resource constraints preventing easy PQC upgrades.
- **Risk Level**: High

### Transportation

- **Threats**:
  - V2X (Vehicle-to-Everything) communication compromises.
  - GPS spoofing risks affecting autonomous navigation.
- **Risk Level**: High

### Government

- **Threats**:
  - Exposure of National Secrets (HNDL).
  - Vulnerabilities in Critical Infrastructure (e.g., power grids).
- **Risk Level**: Critical

### Healthcare

- **Threats**:
  - Genomic data privacy (lifetime sensitivity).
  - Tampering with medical devices (pacemakers, etc.).
- **Risk Level**: High

## 3. Data Requirements

### 3.1 Data Source

- **File**: `src/data/quantum_threats_hsm_industries_YYYYMMDD.csv`
- **Format**: CSV (Comma Separated Values)
- **Update Frequency**: Ad-hoc updates based on new research.

### 3.2 Fields

- **Industry**: Target sector (e.g., "Financial Services / Banking").
- **Threat ID**: Unique identifier (e.g., "FIN-001").
- **Description**: Detailed description of the quantum threat.
- **Criticality**: Risk level (Critical, High, Medium, Low).
- **Crypto at Risk**: Current cryptographic algorithms vulnerable to the threat.
- **PQC Replacement**: Recommended Post-Quantum Cryptography algorithms.
- **Source**: Citation or reference for the threat.

> [!NOTE]
> **URL Field Exclusion**: A `url` field was considered for direct links to sources but was explicitly **excluded** due to concerns about data quality and maintenance of external links.

## 4. Test Plan

### 4.1 Automated Testing

- **Unit Tests**:
  - Verify CSV parsing logic handles commas within quotes.
  - Verify correct mapping of CSV columns to `ThreatData` objects.
  - Ensure `url` field is **not** present in the parsed data.
- **E2E Tests**:
  - Verify the "Impacts" dashboard loads without errors.
  - Verify that threat cards are displayed for each industry.
  - Verify that the "Ref" column/link is **not** present in the UI.

### 4.2 Manual Verification

- **Visual Inspection**:
  - Check for layout issues in the Threats table.
  - Verify filtering by Industry and Criticality works as expected.
