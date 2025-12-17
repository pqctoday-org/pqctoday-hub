import type { SoftwareItem } from '../types/MigrateTypes'
import Papa from 'papaparse'
import { compareDatasets, type ItemStatus } from '../utils/dataComparison'

// Glob import to find all matching CSV files
const modules = import.meta.glob('./quantum_safe_cryptographic_software_reference_*.csv', {
  query: '?raw',
  import: 'default',
  eager: true,
})

// Helper to find the latest software files (Current and Previous)
function getLatestSoftwareFiles(): {
  current: { content: string; filename: string; date: Date } | null
  previous: { content: string; filename: string; date: Date } | null
} {
  const files = Object.keys(modules)
    .map((path) => {
      // Expected format: ...reference_MMDDYYYY.csv
      const match = path.match(/reference_(\d{2})(\d{2})(\d{4})\.csv$/)
      if (match) {
        const [, month, day, year] = match
        const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
        return { path, date, content: modules[path] as string }
      }
      return null
    })
    .filter((f): f is { path: string; date: Date; content: string } => f !== null)

  if (files.length === 0) {
    console.warn('No software reference CSV files found.')
    return { current: null, previous: null }
  }

  // Sort by date descending
  files.sort((a, b) => b.date.getTime() - a.date.getTime())

  return {
    current: {
      content: files[0].content,
      filename: files[0].path.split('/').pop() || files[0].path,
      date: files[0].date,
    },
    previous:
      files.length > 1
        ? {
            content: files[1].content,
            filename: files[1].path.split('/').pop() || files[1].path,
            date: files[1].date,
          }
        : null,
  }
}

const { current, previous } = getLatestSoftwareFiles()

// Parse current and previous data
const currentItems = current ? parseSoftwareCSV(current.content) : []
const previousItems = previous ? parseSoftwareCSV(previous.content) : []

// Compute status map if previous data exists
// Using softwareName as the unique key
const statusMap = previous
  ? compareDatasets(currentItems, previousItems, 'softwareName')
  : new Map<string, ItemStatus>()

export const softwareMetadata = current
  ? { filename: current.filename, lastUpdate: current.date }
  : null

export const softwareData: SoftwareItem[] = currentItems.map((item) => ({
  ...item,
  status: statusMap.get(item.softwareName),
}))

interface RawSoftwareItem {
  software_name: string
  category_id: string
  category_name: string
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
}

function parseSoftwareCSV(csvContent: string): SoftwareItem[] {
  const { data } = Papa.parse(csvContent.trim(), {
    header: true,
    skipEmptyLines: true,
  })

  // Map raw CSV data to SoftwareItem interface
  return (data as RawSoftwareItem[]).map((row) => ({
    softwareName: row.software_name,
    categoryId: row.category_id,
    categoryName: row.category_name,
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
  }))
}
