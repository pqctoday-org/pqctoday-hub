export interface ComplianceRecord {
  id: string
  source: string
  date: string
  link: string
  type: 'FIPS 140-3' | 'ACVP' | 'Common Criteria' | 'EUCC'
  status: string
  pqcCoverage: boolean | string
  classicalAlgorithms?: string
  productName: string
  productCategory: string
  vendor: string
  lab?: string
  certificationLevel?: string
  certificationReportUrls?: string[]
  securityTargetUrls?: string[]
  additionalDocuments?: Array<{ name: string; url: string }>
  // EUCC-specific additional metadata
  productType?: string
  productVersion?: string
  certificationBody?: string
  scheme?: string
  protectionProfile?: string
  ccVersion?: string
  cemVersion?: string
  avaVanLevel?: string
  packageInfo?: string
}
