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
  // Enrichment provenance (dataset 05062026+)
  leiCoverageFlag?: string
  websiteUrlQuality?: string
  gleifUrlQuality?: string
  dataQualityNotes?: string
  // Trust Engine attribution (T06 — added 2026-05-08)
  trustedSourceId?: string
  peerReviewed?: 'yes' | 'no' | 'partial'
  // DS01 status-column schema (added 2026-05-09; see csv-status-schema.md)
  status?: 'active' | 'deprecated' | 'obsolete'
  deprecatedAt?: string
  deprecatedReason?: string
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
  productId: string
  softwareName: string
  /** Earlier display names (from the catalogue's former_names column). */
  formerNames?: string[]
  /** What the product is (library, sdk, application, cloud_service, appliance, hsm,
   *  semiconductor, firmware, protocol_implementation, tool, reference_implementation, other). */
  productKind?: string
  /** 'pqc_relevant' | 'migration_baseline' — reported separately, never one denominator. */
  cataloguePopulation?: string
  /** "<segment>: <why>" for a migration-baseline product. */
  baselineRationale?: string
  /** Product line this row belongs to; '' for a singleton. */
  familyId?: string
  categoryId: string
  categoryName: string
  infrastructureLayer: string
  cisaCategory: string
  pqcSupport: string
  /**
   * Is the product's PQC support CERTIFIED? Distinct from whether the product
   * holds any certificate at all — see {@link hasCertification}.
   *
   * Added 2026-09-26. Until then this verdict existed only as a prose prefix
   * on `pqcSupport`, and a substring search for "CMVP"/"FIPS 140" could not
   * tell a claim from its denial: a row reading "No (CMVP certificate #5038
   * approved-algorithm list contains no ML-KEM…)" counted as claiming a
   * certification. The better the note, the more certainly it was miscounted.
   *
   * - `yes`     — claims a formal certification covering PQC algorithms
   * - `partial` — a qualified claim (certificate exists, scope is narrower)
   * - `no`      — explicitly NOT PQC-certified, usually citing the certificate
   *               whose approved-algorithm list contains no PQC
   * - `none`    — says nothing about certification either way
   *
   * Optional so test mocks and older data may omit it; the loader always sets
   * it, defaulting to `none` — the same convention as `pqcStatusCanonical`.
   */
  pqcCertified?: 'yes' | 'partial' | 'no' | 'none'
  /**
   * Does the product hold ANY certificate, PQC or not? The pairing that
   * matters is `hasCertification: 'yes'` with `pqcCertified: 'no'` — 11 active
   * products are FIPS 140-3 validated for classical algorithms only, which is
   * a fact the catalogue could not express before these two columns existed.
   *
   * `unknown` means nothing in the data asserts either way, which is the
   * honest default — no row currently asserts `no`.
   *
   * Optional for the same reason as {@link pqcCertified}; the loader always
   * sets it, defaulting to `unknown`.
   */
  hasCertification?: 'yes' | 'no' | 'unknown'
  /** Normalized PQC status from the catalog: available | partial | roadmap |
   *  none | unknown (the single source of truth for product PQC status).
   *  Optional so test mocks / older data may omit it; the loader always sets it. */
  pqcStatusCanonical?: string
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
  productBriefUrl?: string
  userManualUrl?: string
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
  githubContributionUrl?: string
  confidenceScore?: number
  cswp39Tags?: string[]
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
  productId: string
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
  productId: string
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
  productId: string
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

export interface SaasXref {
  softwareName: string
  /** Catalogue product_id (blank on files older than 2026-09-24). */
  productId?: string
  saasUrl: string
  deploymentModel: 'managed-service' | 'api-platform' | 'hybrid-cloud'
  lastVerifiedDate: string
}

export interface VendorRoadmap {
  vendorId: string
  vendorName: string
  roadmapUrl: string
  roadmapTitle: string
  roadmapType: 'official_doc' | 'blog_post' | 'announcement' | 'whitepaper' | ''
  publishDate: string
  lastVerifiedDate: string
  coverageNotes: string
  /**
   * `${vendorId}|${roadmapUrl}` — the row's real identity now that a vendor
   * can carry more than one concurrently-active row. Used only for the
   * New/Updated diff (`compareDatasets` needs a real object key, not a
   * derived expression); `vendorId` alone is no longer unique per row.
   */
  compositeId: string
  /** Data-lifecycle state from the CSV (active rows are loaded; deprecated carried forward). */
  roadmapStatus?: 'active' | 'deprecated'
  /** New/Updated badge vs the previous dated CSV (parity with the product catalog). */
  status?: 'New' | 'Updated'
}

export interface VendorRoadmapEnrichment {
  vendorId: string
  /**
   * The specific roadmap row this extraction came from — a vendor with more
   * than one active roadmap row has one enrichment record per row, each
   * extracted from that row's own document. Empty when the source section
   * predates this field (legacy content, still valid for a single-row
   * vendor).
   */
  roadmapUrl: string
  roadmapScope: string
  pqcAlgorithms: string[]
  targetMigrationDates: string
  productsCovered: string
  complianceFrameworks: string[]
  hybridModeSupport: string
  currentGaStatus: string
  customerActionRequired: string
  keyQuotes: string[]
  extractionQuality: 'HIGH' | 'MEDIUM' | 'LOW'
}

export interface VendorPartner {
  softwareName: string
  partnerVendorId: string
  partnerName: string
  role: 'primary' | 'partner'
  lastUpdated: string
}

export interface PqcStats {
  established: number
  inProgress: number
  noCapabilities: number
  total: number
}
