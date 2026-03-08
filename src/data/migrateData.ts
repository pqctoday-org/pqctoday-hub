// SPDX-License-Identifier: GPL-3.0-only
import type { SoftwareItem } from '../types/MigrateTypes'
import { compareDatasets, type ItemStatus } from '../utils/dataComparison'
import { loadLatestCSV } from './csvUtils'

// Glob import to find all matching CSV files
const modules = import.meta.glob('./quantum_safe_cryptographic_software_reference_*.csv', {
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
}

const {
  data: currentItems,
  previousData: previousItems,
  metadata,
} = loadLatestCSV<RawSoftwareItem, SoftwareItem>(
  modules,
  /reference_(\d{2})(\d{2})(\d{4})(?:_r(\d+))?\.csv$/,
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

export function getMigrateItemsForModule(moduleId: string): SoftwareItem[] {
  return softwareData.filter((item) => {
    if (!item.learningModules) return false
    return item.learningModules
      .split(';')
      .map((m) => m.trim())
      .includes(moduleId)
  })
}
