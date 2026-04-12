// SPDX-License-Identifier: GPL-3.0-only
import { MOCK_LIBRARY_CSV_CONTENT } from './mockTimelineData'
import { compareDatasets, type ItemStatus } from '../utils/dataComparison'
import { loadLatestCSV, splitSemicolon } from './csvUtils'

export interface LibraryItem {
  referenceId: string
  documentTitle: string
  downloadUrl: string
  initialPublicationDate: string
  lastUpdateDate: string
  documentStatus: string
  shortDescription: string
  documentType: string
  applicableIndustries: string[]
  authorsOrOrganization: string
  dependencies: string
  regionScope: string
  algorithmFamily: string
  securityLevels: string
  protocolOrToolImpact: string
  toolchainSupport: string
  migrationUrgency: string
  localFile?: string // e.g. "public/library/FIPS_203.pdf"
  manualCategory?: string
  moduleIds?: string[] // e.g. ['pki-workshop', 'email-signing']
  miscInfo?: string // Informal context terms with no library referenceId (e.g. algorithm family names, generic standards)
  children?: LibraryItem[]
  categories: string[] // Multi-category support
  peerReviewed?: 'yes' | 'no' | 'partial'
  vettingBody?: string[]
  githubContributionUrl?: string
  status?: 'New' | 'Updated'
}

// C-001: Single source of truth for categories
export const LIBRARY_CATEGORIES = [
  'Digital Signature',
  'KEM',
  'PKI Certificate Management',
  'Protocols',
  'Government & Policy',
  'NIST Standards',
  'International Frameworks',
  'Migration Guidance',
  'Algorithm Specifications',
  'Industry & Research',
] as const

export type LibraryCategory = (typeof LIBRARY_CATEGORIES)[number]

// C-002/C-003: Map CSV manual_category values to UI categories
const CATEGORY_ALIASES: Record<string, LibraryCategory> = {
  'PQC Protocol Specification': 'Protocols',
  'PQC Certificate Standard': 'PKI Certificate Management',
  // Legacy aliases (pre-03302026 CSVs)
  'General PQC Migration': 'Migration Guidance',
  'Government Guidance': 'Government & Policy',
  'General Recommendations': 'Migration Guidance',
}

// Broad categories that should be removed when a more specific category also matches
const BROAD_CATEGORIES: ReadonlySet<string> = new Set([
  'Migration Guidance',
  'Industry & Research',
  'Government & Policy',
])

// Helper to detect all applicable categories for an item
function detectCategories(title: string, type: string): LibraryCategory[] {
  const categories: LibraryCategory[] = []
  const lowerTitle = title.toLowerCase()
  const lowerType = type.toLowerCase()

  // PKI/Certificate detection
  if (
    lowerType.includes('pki') ||
    lowerType.includes('certificate') ||
    lowerTitle.includes('x.509') ||
    lowerTitle.includes('x509')
  ) {
    categories.push('PKI Certificate Management')
  }

  // Protocol detection
  if (
    lowerType === 'protocol' ||
    lowerTitle.includes('tls') ||
    lowerTitle.includes('ssh') ||
    lowerTitle.includes('ikev2') ||
    lowerTitle.includes('cms') ||
    lowerTitle.includes('ipsec')
  ) {
    categories.push('Protocols')
  }

  // KEM detection
  if (
    (lowerTitle.includes('key-encapsulation') ||
      lowerTitle.includes('kem') ||
      lowerTitle.includes('kyber')) &&
    (lowerType === 'algorithm' || lowerType.includes('pki'))
  ) {
    categories.push('KEM')
  }

  // Digital Signature detection
  if (
    (lowerTitle.includes('signature') ||
      lowerTitle.includes('dsa') ||
      lowerTitle.includes('sign') ||
      lowerTitle.includes('dilithium') ||
      lowerTitle.includes('sphincs')) &&
    (lowerType === 'algorithm' || lowerType.includes('pki'))
  ) {
    categories.push('Digital Signature')
  }

  // Fallback to Migration Guidance if no specific category detected
  if (categories.length === 0) {
    categories.push('Migration Guidance')
  }

  return categories
}

// R-002: Export error state for UI consumption
export const libraryError: string | null = null

interface RawLibraryRow {
  reference_id: string
  document_title: string
  download_url: string
  initial_publication_date: string
  last_update_date: string
  document_status: string
  short_description: string
  document_type: string
  applicable_industries: string
  authors_or_organization: string
  dependencies: string
  region_scope: string
  AlgorithmFamily: string
  SecurityLevels: string
  ProtocolOrToolImpact: string
  ToolchainSupport: string
  MigrationUrgency: string
  change_status: string
  manual_category: string
  downloadable: string
  local_file: string
  module_ids: string
  misc_info: string
  peer_reviewed: string
  vetting_body: string
  github_contribution_url?: string
}

function transformLibraryRow(row: RawLibraryRow): LibraryItem {
  const moduleIds =
    row.module_ids && row.module_ids.trim() ? splitSemicolon(row.module_ids) : undefined

  const item: LibraryItem = {
    referenceId: row.reference_id,
    documentTitle: row.document_title,
    downloadUrl: row.download_url,
    initialPublicationDate: row.initial_publication_date,
    lastUpdateDate: row.last_update_date,
    documentStatus: row.document_status,
    shortDescription: row.short_description,
    documentType: row.document_type,
    applicableIndustries: splitSemicolon(row.applicable_industries),
    authorsOrOrganization: row.authors_or_organization,
    dependencies: row.dependencies,
    regionScope: row.region_scope,
    algorithmFamily: row.AlgorithmFamily,
    securityLevels: row.SecurityLevels,
    protocolOrToolImpact: row.ProtocolOrToolImpact,
    toolchainSupport: row.ToolchainSupport,
    migrationUrgency: row.MigrationUrgency,
    localFile: row.local_file || undefined,
    manualCategory: row.manual_category || undefined,
    moduleIds,
    miscInfo: row.misc_info?.trim() || undefined,
    children: [],
    categories: [], // Will be populated below
    peerReviewed: (row.peer_reviewed?.toLowerCase() as LibraryItem['peerReviewed']) || undefined,
    vettingBody: row.vetting_body ? splitSemicolon(row.vetting_body) : undefined,
    githubContributionUrl: row.github_contribution_url?.trim() || undefined,
  }

  // Multi-category Logic: Combine manual_category WITH auto-detected categories
  const autoCategories = detectCategories(item.documentTitle, item.documentType)

  if (item.manualCategory) {
    const mappedCategory = CATEGORY_ALIASES[item.manualCategory] ?? item.manualCategory
    if (LIBRARY_CATEGORIES.includes(mappedCategory as LibraryCategory)) {
      const allCategories = new Set<string>([mappedCategory])
      autoCategories.forEach((cat) => allCategories.add(cat))
      if (allCategories.size > 1) {
        for (const broad of BROAD_CATEGORIES) {
          if (allCategories.has(broad) && allCategories.size > 1) {
            allCategories.delete(broad)
          }
        }
      }
      item.categories = Array.from(allCategories)
    } else {
      item.categories = autoCategories
    }
  } else {
    item.categories = autoCategories
  }

  return item
}

function parseLibraryCSV(csvContent: string): LibraryItem[] {
  const modules = { __mock__: csvContent }
  const { data: items } = loadLatestCSV<RawLibraryRow, LibraryItem>(
    modules,
    /__mock__$/,
    transformLibraryRow
  )

  return buildTree(items)
}

function buildTree(items: LibraryItem[]): LibraryItem[] {
  const itemMap = new Map<string, LibraryItem>()
  items.forEach((item) => itemMap.set(item.referenceId, item))

  items.forEach((item) => {
    const deps = item.dependencies
      .split(';')
      .map((d) => d.trim())
      .filter((d) => d)

    deps.forEach((depId) => {
      if (depId === item.referenceId) return // skip self-reference
      const parent = itemMap.get(depId)
      if (parent) {
        if (item.children?.some((c) => c.referenceId === depId)) return
        parent.children = parent.children || []
        if (!parent.children.includes(item)) {
          parent.children.push(item)
        }
      }
    })
  })

  return items
}

// ── Load and parse ──────────────────────────────────────────────────────

let currentItems: LibraryItem[] = []
let previousItems: LibraryItem[] = []
let parsedMetadata: { filename: string; lastUpdate: Date } | null = null

if (import.meta.env.VITE_MOCK_DATA === 'true') {
  currentItems = parseLibraryCSV(MOCK_LIBRARY_CSV_CONTENT)
  parsedMetadata = { filename: 'MOCK_LIBRARY_DATA', lastUpdate: new Date() }
} else {
  const modules = import.meta.glob('./library_*.csv', {
    query: '?raw',
    import: 'default',
    eager: true,
  })

  const result = loadLatestCSV<RawLibraryRow, LibraryItem>(
    modules,
    /library_(\d{2})(\d{2})(\d{4})(?:_r(\d+))?\.csv$/,
    transformLibraryRow,
    true // withPrevious for status badges
  )

  currentItems = buildTree(result.data)
  previousItems = result.previousData ? buildTree(result.previousData) : []
  parsedMetadata = result.metadata
}

// Compute status map if previous data exists
const statusMap =
  previousItems.length > 0
    ? compareDatasets(currentItems, previousItems, 'referenceId')
    : new Map<string, ItemStatus>()

// Inject status into current items and export
export const libraryData: LibraryItem[] = currentItems.map((item) => ({
  ...item,
  status: statusMap.get(item.referenceId),
}))

export const libraryMetadata = parsedMetadata

// Returns library items tagged for a given learn module ID
export function getLibraryItemsForModule(moduleId: string): LibraryItem[] {
  return libraryData.filter((item) => item.moduleIds?.includes(moduleId))
}
