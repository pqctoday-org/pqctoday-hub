// SPDX-License-Identifier: AGPL-3.0-only
export type ComplianceSource =
  'NIST' | 'Common Criteria' | 'BSI Germany' | 'ANSSI' | 'ENISA' | 'Other'
/**
 * Record types published in compliance-data.json. FIPS 140-2 is deliberately
 * absent: the dataset keeps FIPS 140-3 (NIST CMVP) records only. 'ACVP' is the
 * internal value for NIST CAVP algorithm validations — show it to users through
 * `recordTypeLabel()` (recordSemantics.ts), never raw. 'CSPN' is ANSSI's French
 * national first-level scheme, a separate scheme from Common Criteria. 'ESV' is a
 * NIST CMVP entropy source validation certificate (SP 800-90B): it says nothing
 * about PQC algorithms, so PQC coverage does not apply to it (`isPqcApplicable()`).
 */
export type ComplianceType = 'FIPS 140-3' | 'ACVP' | 'Common Criteria' | 'EUCC' | 'CSPN' | 'ESV'

/**
 * Statuses the sources publish verbatim. FIPS 140-3 (CMVP): Active / Historical
 * / Revoked. CAVP: Validated (no lifecycle — NIST shows "First Validated").
 * ESV: Validated (NIST publishes no lifecycle status for entropy certificates;
 * one NIST stops listing leaves the snapshot).
 * CC Portal / ANSSI / EUCC: Active / Archived / Expired / Withdrawn.
 * 'Pending' and 'In Process' are legacy values kept only so an older cached
 * copy still renders; no current source writes them (the in-browser scrape that
 * did was removed 2026-09-25).
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

/** Where a module's entropy certificate numbers were read: its own Security Policy. */
export interface EntropyCertificatesSource {
  policyUrl: string
  policySha256?: string
  /** The table caption, e.g. 'Table 8: Entropy Certificates'. */
  table: string
  /** The PDF page the table is on. */
  page: number
}

/** One row of a NIST entropy certificate's entropy table, as the page words it. */
export interface EsvEntropyClaim {
  bitsOfEntropyPerOutput?: string
  outputSizeBits?: string
  entropyPerSample?: string
  sampleSize?: string
  /** The row's text verbatim, kept only when its layout was not recognised. */
  statedAs?: string
  operatingEnvironments?: string[]
  /** Vetted conditioning components: the CAVP validation they cite. */
  conditioningComponents?: Array<{ cavp?: string; url?: string; algorithm?: string; text?: string }>
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
  /** EUCC: the certificate number the ENISA page shows (e.g. 'EUCC-3089-2026-002'); `id` is only a generated key. */
  euccCertificateId?: string

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

  // ── FIPS 140-3: entropy certificates named in the module's Security Policy ──
  /**
   * ESV certificate numbers (e.g. ['E252', 'E63']) from the "Entropy Certificates" table of the
   * module's NIST-hosted Security Policy. Present only when that table is clear: a module whose
   * policy has no such table has none, which is not a statement that it uses no entropy source.
   */
  entropyCertificates?: string[]
  entropyCertificatesSource?: EntropyCertificatesSource

  // ── NIST entropy source validation certificate (ESV, SP 800-90B) ──
  // Only what the NIST certificate page states. The page does not say whether the
  // source is hardware or software: `esvNoiseSourceClassification` (Physical /
  // Non-Physical) is NIST's own classification of the noise source, nothing more.
  esvStandard?: string
  esvVersion?: string
  esvDescription?: string
  esvNoiseSourceClassification?: string
  esvReuseStatus?: string
  /** Entropy claims, one per table row on the certificate page. */
  esvEntropyClaims?: EsvEntropyClaim[]
  esvFirstValidated?: string
  /** Every validation on the certificate page, oldest first. */
  esvValidationHistory?: Array<{ date: string; lab: string }>
  /** When the certificate page was read — ISO datetime. */
  esvDetailsFetchedAt?: string
  /** Set instead of `esvDetailsFetchedAt` when only the NIST list could be read. */
  esvListObservedAt?: string

  // ── Common Criteria (CC Portal lists) ──
  ccArchivedDate?: string | null
  ccListObservedAt?: string

  /** Official sources that disagree on a field — both shown, neither chosen. */
  sourceConflicts?: SourceConflict[]
}

/** One field on which two official sources state different values. */
export interface SourceConflict {
  field: string
  note?: string
  values: Array<{ value: string; source: string; url?: string; quote?: string }>
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
    esv?: string
    cc?: string
    excluded?: string[]
  }
  partitions?: Record<string, ComplianceMetaPartition>
  exclusions?: { byReason?: Record<string, number> }
  fieldSources?: Record<string, Record<string, string>>
}
