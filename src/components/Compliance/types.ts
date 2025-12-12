export type ComplianceSource =
  | 'NIST'
  | 'Common Criteria'
  | 'BSI Germany'
  | 'ANSSI'
  | 'ENISA'
  | 'Other'
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
}
