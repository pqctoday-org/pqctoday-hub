# Quantum Threat Impacts Requirements

**Status:** ✅ Implemented  
**Last Updated:** 2025-12-11

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
- **Source**: Citation or reference for the threat (mapped from `main_source`).
- **Source URL**: Direct link to the reference source (mapped from `source_url`).

## 3.3 User Interface

### Threats Dashboard

- **Layout**: Table view with sortable columns.
- **Columns**: Industry, ID, Description, Criticality, Crypto at Risk, PQC Replacement, Info.
- **Interactivity**:
  - Filter by Industry and Criticality.
  - Search by keyword.
  - **Info Button**: Opens a detailed popup for the selected threat.

### Threat Details Popup

- **Trigger**: Click "Info" icon in the table row.
- **Content**:
  - Full Threat Description.
  - Detailed "At-Risk Cryptography" and "PQC Mitigation" sections.
  - **Reference Source**: Displayed as a clickable external link (using `sourceUrl`).

## 4. Test Plan

### 4.1 Automated Testing

- **Unit Tests**:
  - Verify CSV parsing logic handles `main_source` and `source_url`.
  - Verify `ThreatData` interface includes `sourceUrl`.
- **E2E Tests** (`e2e/impacts-popup.spec.ts`):
  - Verify the "Impacts" dashboard loads correctly.
  - Verify "Info" buttons are visible.
  - **Popup Verification**:
    - Click "Info" button.
    - Verify popup displays correct details (Description, Crypto, PQC).
    - **Link Verification**: Verify "Reference Source" link exists and has a valid `href`.

### 4.2 Manual Verification

- **Visual Inspection**:
  - Check layout issues in the Threats table.
  - Check popup styling (glass-morphism, responsiveness).
  - Verify "View Source" link opens in a new tab (`target="_blank"`).
