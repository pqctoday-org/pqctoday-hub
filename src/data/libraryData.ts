// SPDX-License-Identifier: GPL-3.0-only
import { MOCK_LIBRARY_CSV_CONTENT } from './mockTimelineData'
import { compareDatasets, type ItemStatus } from '../utils/dataComparison'
import { loadLatestCSV, splitSemicolon } from './csvUtils'
import {
  getDocumentStatusBucket,
  getGroupStatusBucket,
  type DocumentStatusBucket,
} from '../utils/documentStatusBucket'

/**
 * A prior (deprecated) revision of a document, attached to its surviving active
 * record so a single tile can link out to older versions. Distinct from the
 * trust-engine "revisions" audit trail (`useRevisions` / revisions.jsonl).
 */
export interface PriorRevision {
  referenceId: string
  documentTitle: string
  documentStatus: string
  documentStatusBucket: DocumentStatusBucket
  downloadUrl: string
  supersededBy: string
  deprecatedAt?: string
  deprecatedReason?: string
}

export interface LibraryItem {
  referenceId: string
  documentTitle: string
  downloadUrl: string
  initialPublicationDate: string
  lastUpdateDate: string
  documentStatus: string
  documentStatusBucket: DocumentStatusBucket
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
  localFile?: string
  manualCategory?: string
  moduleIds?: string[]
  miscInfo?: string
  children?: LibraryItem[]
  categories: string[]
  peerReviewed?: 'yes' | 'no' | 'partial'
  vettingBody?: string[]
  githubContributionUrl?: string
  downloadUrlQuality?: string
  trustedSourceIdStatus?: string
  dataQualityNotes?: string
  confidenceScore?: number
  status?: 'New' | 'Updated'
  /** Mathematical family / families (semicolon-separated in CSV). Sourced from enrichment dimension `Math Family`. */
  mathFamily?: string[]
  /** Standardisation-round lifecycle (`Standardised`, `Draft`, `Round 2`, etc.). Sourced from enrichment dimension `PQC Round`. */
  pqcRound?: string
  /** Number of other library items that name this item in their `dependencies`
   *  field. Derived in a single pass over `libraryData` at module load and
   *  used as the researcher persona's default "Most cited" sort. */
  citationCount?: number
  /** Older (deprecated) revisions of this same document, collapsed into this
   *  surviving tile. Present only when this record superseded ≥1 other. */
  priorRevisions?: PriorRevision[]
  /** Most-advanced lifecycle bucket across this record and its priorRevisions.
   *  Tiles render this (falling back to documentStatusBucket) so a collapsed
   *  group shows the furthest stage reached. */
  groupStatusBucket?: DocumentStatusBucket
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
  download_url_quality?: string
  trusted_source_id_status?: string
  data_quality_notes?: string
  confidence_score?: string
  math_family?: string
  pqc_round?: string
  status?: string
  deprecated_at?: string
  deprecated_reason?: string
  superseded_by?: string
}

/**
 * Transform ONLY deprecated/obsolete rows into a `PriorRevision` (returns null
 * for active rows). Run as a second pass over the latest CSV so deprecated
 * revisions — dropped from the main grid by `transformLibraryRow` — can be
 * attached to their surviving record.
 */
function transformDeprecatedRow(row: RawLibraryRow): PriorRevision | null {
  if (row.status !== 'deprecated' && row.status !== 'obsolete') return null
  if (!(row.superseded_by ?? '').trim()) return null
  return {
    referenceId: row.reference_id,
    documentTitle: row.document_title,
    documentStatus: row.document_status,
    documentStatusBucket: getDocumentStatusBucket(row.document_status ?? ''),
    downloadUrl: row.download_url,
    supersededBy: (row.superseded_by ?? '').trim(),
    deprecatedAt: row.deprecated_at || undefined,
    deprecatedReason: row.deprecated_reason || undefined,
  }
}

/** Extract the RFC number (as a string) from a record's id or URL, else null. */
function rfcNumber(rec: { referenceId: string; downloadUrl: string }): string | null {
  return (
    /\bRFC[ -]?(\d{3,5})\b/i.exec(rec.referenceId)?.[1] ??
    /rfc[-_/ ]?(\d{3,5})/i.exec(rec.downloadUrl)?.[1] ??
    null
  )
}

/**
 * Attach prior (deprecated) revisions to their surviving active record, keyed by
 * `supersededBy`, and compute `groupStatusBucket`. Deprecated rows are never
 * added to the returned array — they only enrich the survivor — so the grid
 * still renders one tile per logical document. Exported for unit testing.
 *
 * A prior is HIDDEN when it resolves to the same RFC number as the survivor
 * (a pure id-alias such as `IETF RFC 8391` under `RFC 8391`): the tile still
 * collapses the duplicate, but it is not surfaced as a genuine older revision.
 */
export function attachPriorRevisions(items: LibraryItem[], priors: PriorRevision[]): LibraryItem[] {
  const bySurvivor = new Map<string, PriorRevision[]>()
  for (const p of priors) {
    if (!p.supersededBy) continue
    const arr = bySurvivor.get(p.supersededBy) ?? []
    arr.push(p)
    bySurvivor.set(p.supersededBy, arr)
  }
  return items.map((item) => {
    const revs = bySurvivor.get(item.referenceId)
    if (!revs || revs.length === 0) return item
    const itemRfc = rfcNumber(item)
    const sorted = [...revs]
      // hide same-RFC-number id-aliases (not a genuine older version)
      .filter((rev) => !(itemRfc && rfcNumber(rev) === itemRfc))
      .sort((a, b) => (b.deprecatedAt ?? '').localeCompare(a.deprecatedAt ?? ''))
    if (sorted.length === 0) return item
    return {
      ...item,
      priorRevisions: sorted,
      groupStatusBucket: getGroupStatusBucket(
        item.documentStatusBucket,
        sorted.map((r) => r.documentStatusBucket)
      ),
    }
  })
}

function transformLibraryRow(row: RawLibraryRow): LibraryItem | null {
  if (row.status && row.status !== 'active') return null
  const moduleIds =
    row.module_ids && row.module_ids.trim() ? splitSemicolon(row.module_ids) : undefined

  const item: LibraryItem = {
    referenceId: row.reference_id,
    documentTitle: row.document_title,
    downloadUrl: row.download_url,
    initialPublicationDate: row.initial_publication_date,
    lastUpdateDate: row.last_update_date,
    documentStatus: row.document_status,
    documentStatusBucket: getDocumentStatusBucket(row.document_status ?? ''),
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
    downloadUrlQuality: row.download_url_quality || undefined,
    trustedSourceIdStatus: row.trusted_source_id_status || undefined,
    dataQualityNotes: row.data_quality_notes || undefined,
    confidenceScore: row.confidence_score ? Number(row.confidence_score) : undefined,
    mathFamily:
      row.math_family && row.math_family.trim() ? splitSemicolon(row.math_family) : undefined,
    pqcRound: row.pqc_round?.trim() || undefined,
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
  const { data: priors } = loadLatestCSV<RawLibraryRow, PriorRevision>(
    modules,
    /__mock__$/,
    transformDeprecatedRow
  )

  // Attach prior revisions to the FLAT list; the dependency tree is built last
  // (in the export below) so children share the fully-enriched object references.
  return attachPriorRevisions(items, priors)
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

  const priorResult = loadLatestCSV<RawLibraryRow, PriorRevision>(
    modules,
    /library_(\d{2})(\d{2})(\d{4})(?:_r(\d+))?\.csv$/,
    transformDeprecatedRow
  )

  // Keep currentItems FLAT + enriched; buildTree runs last (in the export below).
  currentItems = attachPriorRevisions(result.data, priorResult.data)
  previousItems = result.previousData ? result.previousData : []
  parsedMetadata = result.metadata
}

// Compute status map if previous data exists
const statusMap =
  previousItems.length > 0
    ? compareDatasets(currentItems, previousItems, 'referenceId')
    : new Map<string, ItemStatus>()

/**
 * Build a citation-count map: how many other items name THIS item in their
 * `dependencies` field. Single O(N) pass. Used by the "Most cited" sort
 * (researcher default). Exported so the derivation can be unit-tested
 * against synthetic fixtures without re-loading the CSV.
 */
export function computeCitationCounts(
  items: Pick<LibraryItem, 'referenceId' | 'dependencies'>[]
): Map<string, number> {
  const counts = new Map<string, number>()
  for (const item of items) {
    if (!item.dependencies) continue
    const deps = item.dependencies
      .split(';')
      .map((d) => d.trim())
      .filter((d) => d && d !== item.referenceId)
    for (const dep of deps) {
      counts.set(dep, (counts.get(dep) ?? 0) + 1)
    }
  }
  return counts
}

const citationCounts = computeCitationCounts(currentItems)

// Inject status + citationCount, THEN build the dependency tree as the final step
// so `children[]` reference the same fully-enriched objects as the top-level array
// (priorRevisions/groupStatusBucket/status/citationCount all present). This is what
// lets findByRef(...) resolve a child and still see priorRevisions in the detail view.
export const libraryData: LibraryItem[] = buildTree(
  currentItems.map((item) => ({
    ...item,
    status: statusMap.get(item.referenceId),
    citationCount: citationCounts.get(item.referenceId) ?? 0,
  }))
)

export const libraryMetadata = parsedMetadata

// Returns library items tagged for a given learn module ID
export function getLibraryItemsForModule(moduleId: string): LibraryItem[] {
  return libraryData.filter((item) => item.moduleIds?.includes(moduleId))
}

/**
 * Canonical concept_id for a library row — PR 3c of the IR 8477 fidelity
 * remediation. Resolves via the concept_registry by (source_table, source_row_id).
 * Returns undefined when the row has no registry entry.
 */
import { conceptIdForStoreKey } from './conceptRegistry'
export function conceptIdForLibraryItem(item: { referenceId: string }): string | undefined {
  return conceptIdForStoreKey('library', item.referenceId)
}
