export type ComplianceSource =
  | 'NIST'
  | 'Common Criteria'
  | 'NIAP'
  | 'BSI Germany'
  | 'ANSSI'
  | 'Other'
export type ComplianceType = 'FIPS 140-3' | 'ACVP' | 'Common Criteria'
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
}
