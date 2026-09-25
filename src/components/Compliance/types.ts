// SPDX-License-Identifier: GPL-3.0-only
export type ComplianceSource =
  'NIST' | 'Common Criteria' | 'BSI Germany' | 'ANSSI' | 'ENISA' | 'Other'
export type ComplianceType = 'FIPS 140-3' | 'ACVP' | 'Common Criteria' | 'EUCC'
export type ComplianceStatus = 'Active' | 'Historical' | 'Pending' | 'In Process' | 'Revoked'

export interface ComplianceRecord {
  id: string
  source: ComplianceSource
  date: string // ISO date string YYYY-MM-DD
  link: string
  type: ComplianceType
  status: ComplianceStatus
  pqcCoverage: boolean | string // boolean or description like "SHA-3"
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
  // CMVP certificate-page fields (FIPS records only). Parsed by the
  // private pipeline's enrich-cmvp-certificate-details.py from each record's
  // own certificate page. Absent = the page was never read; null = the page
  // was read and does not state the field (or it did not parse). Never guessed.
  sunsetDate?: string | null // ISO YYYY-MM-DD, from "Sunset Date"
  overallLevel?: number | null // 1-4, from "Overall Level"
  caveat?: string | null // "Caveat", verbatim (may literally be "None")
  embodiment?: string | null // "Embodiment", verbatim (CMVP spells values several ways)
  moduleType?: string | null // "Module Type": Hardware / Software / Firmware / Hybrid ...
  /** "Tested Configuration(s)": [] = the page states N/A; null = the page has no such field. */
  operationalEnvironments?: string[] | null
  cmvpStandard?: string | null // "Standard" as the page states it, e.g. "FIPS 140-2"
  cmvpStatus?: string | null // "Status" as the page states it, e.g. "Historical"
  cmvpHistoricalReason?: string | null // "Historical Reason", when given
  /** "Approved Algorithms" section ONLY: [] = empty section; null = the page has no such section. */
  cmvpApprovedAlgorithms?: CmvpApprovedAlgorithm[] | null
  cmvpDetailsFetchedAt?: string // UTC ISO timestamp of the page fetch the fields above came from
}

/** One algorithm in a CMVP certificate's "Approved Algorithms" section. */
export interface CmvpApprovedAlgorithm {
  name: string // e.g. "ML-KEM KeyGen" (current layout) or "AES" (legacy FIPS 140-2 layout)
  cavpRefs: string[] // CAVP certificate refs verbatim, e.g. ["A5021"]; [] for "vendor affirmed"
}
