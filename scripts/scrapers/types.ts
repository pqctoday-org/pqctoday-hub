export interface ComplianceRecord {
  id: string
  source: string
  date: string
  link: string
  type: string
  status: string
  pqcCoverage: boolean | string
  classicalAlgorithms?: string
  productName: string
  productCategory: string
  vendor: string
  lab?: string
  certificationLevel?: string
}
