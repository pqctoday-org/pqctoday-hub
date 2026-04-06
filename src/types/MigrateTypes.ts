// SPDX-License-Identifier: GPL-3.0-only
export interface Vendor {
  vendorId: string
  vendorName: string
  vendorDisplayName: string
  website: string
  vendorType: string
  entityCategory:
    | 'Commercial Vendor'
    | 'Open Source Foundation'
    | 'Open Source Community'
    | 'Hybrid Commercial/Community'
    | 'Blockchain Protocol'
    | 'Government / Standards Body'
    | 'Research Project'
    | 'SaaS Platform'
  hqCountry: string
  pqcCommitment: 'Active' | 'Partial' | 'Announced' | 'None' | 'Unknown'
  lastVerifiedDate: string
  productCount?: number
  // GLEIF LEI — ultimate-parent legal entity identifier (ISO 17442)
  leiCode?: string
  leiLegalName?: string
  leiEntityStatus?: string
  gleifUrl?: string
  leiLastVerifiedDate?: string
}

export const CISA_CATEGORIES = [
  'Cloud Services',
  'Collaboration Software',
  'Web Software',
  'Endpoint Security',
  'Networking Hardware',
  'Networking Software',
  'Telecommunications Hardware',
  'Computers (Physical and Virtual)',
  'Computer Peripherals',
  'Storage Area Network',
  'Identity, Credential, and Access Management (ICAM) Software',
  'Identity, Credential, and Access Management (ICAM) Hardware',
  'Data',
  'Enterprise Security',
  'Other / Unclassified',
] as const

export type CisaCategoryType = (typeof CISA_CATEGORIES)[number]

export interface SoftwareItem {
  softwareName: string
  categoryId: string
  categoryName: string
  infrastructureLayer: string
  cisaCategory: string
  pqcSupport: string
  pqcCapabilityDescription: string
  licenseType: string
  license: string
  latestVersion: string
  releaseDate: string
  fipsValidated: string
  pqcMigrationPriority: string
  primaryPlatforms: string
  targetIndustries: string
  authoritativeSource: string
  repositoryUrl: string
  productBrief: string
  sourceType: string
  verificationStatus: string
  lastVerifiedDate: string
  migrationPhases: string
  learningModules: string
  vendorId?: string
  peerReviewed?: 'yes' | 'no' | 'partial'
  vettingBody?: string[]
  evidenceFlags?: string[]
  proofUrl?: string
  proofPublicationDate?: string
  proofRelevantInfo?: string
  validationResult?:
    | 'VALIDATED'
    | 'VALIDATED_NO_PQC'
    | 'CORRECTED'
    | 'FIPS_VERIFIED'
    | 'FIPS_ISSUE'
    | 'PARTIALLY_VALIDATED'
    | 'NEEDS_REVIEW'
    | 'NOT_VALIDATED'
  correctionNotes?: string
  quantumTech?: 'QKD' | 'QRNG' | 'QKD,QRNG'
  wip?: boolean
  status?: 'New' | 'Updated' | 'Deleted'
}

export interface MigrationStepTask {
  title: string
  description: string
}

export interface MigrationFrameworkMapping {
  source: string
  mapping: string
}

export interface MigrationReference {
  name: string
  organization: string
  url: string
  description: string
  type: 'Government' | 'Industry'
}

export interface MigrationStep {
  id: string
  stepNumber: number
  title: string
  shortTitle: string
  description: string
  icon: string
  tasks: MigrationStepTask[]
  frameworks: MigrationFrameworkMapping[]
  relevantSoftwareCategories: string[]
  nsaTimeline?: string
  estimatedDuration: string
}

export interface CertificationXref {
  softwareName: string
  certType: 'FIPS 140-3' | 'ACVP' | 'Common Criteria' | 'PSA Certified'
  certId: string
  certVendor: string
  certProduct: string
  pqcAlgorithms: string
  certificationLevel: string
  status: string
  certDate: string
  certLink: string
}

export interface SoftwareCategoryGap {
  categoryId: string
  categoryName: string
  pqcPriority: string
  urgencyScore: number
  recommendedTimeline: string
  industriesAffected: string
  hasSoftwareInReference: boolean
  softwareCount: number
}

export interface CpeXref {
  softwareName: string
  cpeUri: string
  cpeVendor: string
  cpeProduct: string
  matchConfidence: 'exact' | 'partial' | 'manual' | ''
  status: 'matched' | 'partial' | 'not_found'
  nvdUrl: string
  lastVerifiedDate: string
}

export interface PurlXref {
  softwareName: string
  purl: string
  purlType: 'npm' | 'pypi' | 'maven' | 'go' | 'github' | 'cargo' | 'nuget' | ''
  purlNamespace: string
  purlName: string
  matchConfidence: 'exact' | 'partial' | 'manual' | ''
  status: 'matched' | 'not_found'
  registryUrl: string
  lastVerifiedDate: string
}

export interface PqcStats {
  established: number
  inProgress: number
  noCapabilities: number
  total: number
}
