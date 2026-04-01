// SPDX-License-Identifier: GPL-3.0-only
import type { SoftwareItem } from '../types/MigrateTypes'
import { compareDatasets, type ItemStatus } from '../utils/dataComparison'
import { loadLatestCSV } from './csvUtils'
import { vendorMap } from './vendorData'

// Glob import to find all matching CSV files
const modules = import.meta.glob('./pqc_product_catalog_*.csv', {
  query: '?raw',
  import: 'default',
  eager: true,
})

interface RawSoftwareItem {
  software_name: string
  category_id: string
  category_name: string
  infrastructure_layer: string
  pqc_support: string
  pqc_capability_description: string
  license_type: string
  license: string
  latest_version: string
  release_date: string
  fips_validated: string
  pqc_migration_priority: string
  primary_platforms: string
  target_industries: string
  authoritative_source: string
  repository_url: string
  product_brief: string
  source_type: string
  verification_status: string
  last_verified_date: string
  migration_phases: string
  learning_modules: string
  vendor_id?: string
  trusted_source_id?: string
  peer_reviewed?: string
  vetting_body?: string
  evidence_flags?: string
  proof_url?: string
  proof_publication_date?: string
  proof_relevant_info?: string
  validation_result?: string
  correction_notes?: string
}

const {
  data: currentItems,
  previousData: previousItems,
  metadata,
} = loadLatestCSV<RawSoftwareItem, SoftwareItem>(
  modules,
  /catalog_(\d{2})(\d{2})(\d{4})(?:_r(\d+))?\.csv$/,
  (row) => ({
    softwareName: row.software_name,
    categoryId: row.category_id,
    categoryName: row.category_name,
    infrastructureLayer: row.infrastructure_layer,
    pqcSupport: row.pqc_support,
    pqcCapabilityDescription: row.pqc_capability_description,
    licenseType: row.license_type,
    license: row.license,
    latestVersion: row.latest_version,
    releaseDate: row.release_date,
    fipsValidated: row.fips_validated,
    pqcMigrationPriority: row.pqc_migration_priority,
    primaryPlatforms: row.primary_platforms,
    targetIndustries: row.target_industries,
    authoritativeSource: row.authoritative_source,
    repositoryUrl: row.repository_url,
    productBrief: row.product_brief,
    sourceType: row.source_type,
    verificationStatus: row.verification_status,
    lastVerifiedDate: row.last_verified_date,
    migrationPhases: row.migration_phases || '',
    learningModules: row.learning_modules || '',
    vendorId: row.vendor_id || '',
    peerReviewed: (row.peer_reviewed?.toLowerCase() as SoftwareItem['peerReviewed']) || undefined,
    vettingBody: row.vetting_body
      ? row.vetting_body
          .split(';')
          .map((s: string) => s.trim())
          .filter(Boolean)
      : undefined,
    evidenceFlags: row.evidence_flags
      ? row.evidence_flags
          .split(';')
          .map((s: string) => s.trim())
          .filter(Boolean)
      : undefined,
    proofUrl: row.proof_url || undefined,
    proofPublicationDate: row.proof_publication_date || undefined,
    proofRelevantInfo: row.proof_relevant_info || undefined,
    validationResult: (row.validation_result as SoftwareItem['validationResult']) || undefined,
    correctionNotes: row.correction_notes || undefined,
  }),
  true // withPrevious for status badges
)

// Compute status map if previous data exists
const statusMap = previousItems
  ? compareDatasets(currentItems, previousItems, 'softwareName')
  : new Map<string, ItemStatus>()

export const softwareMetadata = metadata

export const softwareData: SoftwareItem[] = currentItems.map((item) => ({
  ...item,
  status: statusMap.get(item.softwareName),
}))

// Compute productCount for each vendor
softwareData.forEach((item) => {
  if (item.vendorId && vendorMap.has(item.vendorId)) {
    const vendor = vendorMap.get(item.vendorId)!
    vendor.productCount = (vendor.productCount ?? 0) + 1
  }
})

// Re-export vendorMap with computed productCounts
export { vendorMap }

export function getMigrateItemsForModule(moduleId: string): SoftwareItem[] {
  return softwareData.filter((item) => {
    if (!item.learningModules) return false
    return item.learningModules
      .split(';')
      .map((m) => m.trim())
      .includes(moduleId)
  })
}
