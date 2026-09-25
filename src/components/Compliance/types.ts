// SPDX-License-Identifier: GPL-3.0-only
export type ComplianceSource =
  'NIST' | 'Common Criteria' | 'BSI Germany' | 'ANSSI' | 'ENISA' | 'Other'
/**
 * Record types published in compliance-data.json. FIPS 140-2 is deliberately
 * absent: the dataset keeps FIPS 140-3 (NIST CMVP) records only. 'ACVP' is the
 * internal value for NIST CAVP algorithm validations — show it to users through
 * `recordTypeLabel()` (recordSemantics.ts), never raw. 'CSPN' is ANSSI's French
 * national first-level scheme, a separate scheme from Common Criteria.
 */
export type ComplianceType = 'FIPS 140-3' | 'ACVP' | 'Common Criteria' | 'EUCC' | 'CSPN'

/**
 * Statuses the sources publish verbatim. FIPS 140-3 (CMVP): Active / Historical
 * / Revoked. CAVP: Validated (no lifecycle — NIST shows "First Validated").
 * CC Portal / ANSSI / EUCC: Active / Archived / Expired / Withdrawn.
 * 'Pending' and 'In Process' are kept for the dev-only live-scrape fixtures.
 *
 * The union is open (`string & {}`) on purpose: an unknown status string must
 * render as-is and be treated as NOT current — see `isCurrentStatus()`.
 */
export type KnownComplianceStatus =
  | 'Active'
  | 'Validated'
  | 'Historical'
  | 'Revoked'
  | 'Archived'
  | 'Expired'
  | 'Withdrawn'
  | 'Pending'
  | 'In Process'
export type ComplianceStatus = KnownComplianceStatus | (string & {})

/** One entry of a FIPS 140-3 certificate page's "Approved Algorithms" list. */
export interface CmvpApprovedAlgorithm {
  name: string
  /** CAVP validation references on the certificate page, e.g. 'A1234'. */
  cavpRefs: string[]
}

/** One capability row of a NIST CAVP validation details page. */
export interface CavpCapability {
  algorithm: string
  operatingEnvironment: string
  parameterSets: string[]
  functions: string[]
  details: string[]
}

export interface ComplianceRecord {
  id: string
  source: ComplianceSource
  date: string // ISO date string YYYY-MM-DD
  link: string
  type: ComplianceType
  status: ComplianceStatus
  /**
   * FIPS 140-3: PQC names from the certificate page's Approved Algorithms list,
   * 'No PQC Mechanisms Detected' when the page was read and lists none, or ''
   * when the page could not be read (unknown — never "none").
   * CC / EUCC / CSPN: PQC names found in the Security Target (not a validation).
   */
  pqcCoverage: boolean | string
  classicalAlgorithms?: string // Comma-separated list of classical algos (e.g. "AES, SHA-256")
  productName: string
  productCategory: string
  vendor: string
  lab?: string // Evaluation lab/facility for CC records
  certificationLevel?: string // FIPS: "FIPS 140-3 L3", CC: "EAL4+ ALC_DVS.2, ALC_FLR.1"
  // Multi-URL support for CC certificates
  certificationReportUrls?: string[]
  securityTargetUrls?: string[]
  additionalDocuments?: Array<{ name: string; url: string }>
  // EUCC-specific additional metadata
  productType?: string // Type of product (e.g., "smart card and similar device")
  productVersion?: string // Version of the product
  certificationBody?: string // Name of the certification body that issued the certificate
  scheme?: string // Certification scheme (e.g., "(UE) 2024/482 - EUCC")
  protectionProfile?: string // Protection profile used
  ccVersion?: string // Common Criteria version (e.g., "ISO/IEC 15408:2022")
  cemVersion?: string // CEM version (e.g., "ISO/IEC 18045:2022")
  avaVanLevel?: string // AVA_VAN level
  packageInfo?: string // Full package/augmentation details

  // ── FIPS 140-3 (NIST CMVP certificate page) ──
  cmvpStandard?: string
  cmvpStatus?: string
  cmvpHistoricalReason?: string | null
  /** When the certificate page (and so the status) was read — ISO datetime. */
  cmvpDetailsFetchedAt?: string
  cmvpApprovedAlgorithms?: CmvpApprovedAlgorithm[]
  sunsetDate?: string | null
  overallLevel?: number | null
  caveat?: string
  embodiment?: string
  moduleType?: string
  operationalEnvironments?: string[] | null

  // ── NIST CAVP validation details page ──
  cavpFirstValidated?: string
  cavpImplementationVersion?: string
  cavpImplementationType?: string
  cavpProductUrl?: string
  cavpDetailsFetchedAt?: string
  cavpCapabilities?: CavpCapability[]

  // ── Common Criteria (CC Portal lists) ──
  ccArchivedDate?: string | null
  ccListObservedAt?: string
}

/** One source partition of the published snapshot (compliance-data.meta.json). */
export interface ComplianceMetaPartition {
  label: string
  sourceUrl?: string
  retrievedAt?: string
  count?: number
}

/** Sidecar describing a compliance-data.json publication. */
export interface ComplianceMeta {
  schemaVersion: number
  /** sha256 of the compliance-data.json this sidecar describes. */
  publicationId?: string
  generatedAt?: string
  scope?: {
    fips?: string
    cavp?: string
    cc?: string
    excluded?: string[]
  }
  partitions?: Record<string, ComplianceMetaPartition>
  exclusions?: { byReason?: Record<string, number> }
  fieldSources?: Record<string, Record<string, string>>
}
