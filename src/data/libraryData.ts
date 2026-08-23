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
  /** CSV `last_verified` — the date a human or agent last confirmed this row's
   *  facts against the actual document (not merely re-scraped a page). Sparse
   *  by design: most rows have never been re-checked since intake. Distinct
   *  from initialPublicationDate (the DOCUMENT's own date) and lastUpdateDate
   *  (when the CATALOG record last changed) — this is "when did we last look".
   *  Same convention as timeline's last_verified (added 2026-07-16); added
   *  here 2026-08-11 so a living page with no publication date (a vendor docs
   *  portal, the OpenSSL manual) still has an honest freshness signal instead
   *  of either a blank or an invented publication date. */
  lastVerified?: string
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
  /** Coarse intent bucket (Education / Reference / Planning) used by the
   *  top-level "purpose doors" pre-filter. From the CSV `purpose` column when
   *  present, else heuristic — see `resolvePurpose` / `detectPurpose`. */
  purpose: LibraryPurpose
  peerReviewed?: 'yes' | 'no' | 'partial'
  vettingBody?: string[]
  githubContributionUrl?: string
  downloadUrlQuality?: string
  /**
   * 'paid' when the publisher SELLS this document (ISO, IEC, IEEE SA, ANSI,
   * SAE/ARINC). Absent means free. The site names paid standards because the
   * name stays editorially relevant, but must never present `downloadUrl` as
   * a download for these — it is a purchase page. See the maintenance repo's
   * SCHEMA.md section 6 "Paid-source policy".
   */
  accessType?: 'paid'
  /**
   * A freely-readable page that DESCRIBES a paid standard (official abstract
   * or scope page). It is a summary, NOT the standard — any UI surfacing it
   * must say so, or a reader will think they have the full document.
   */
  freeSummaryUrl?: string
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
  // EXTENDED 2026-08-22. 163 active rows carried a manual_category outside the
  // original ten and so matched NO filter chip — visible only under "All".
  // These three are the clusters that genuinely do not reduce to an existing
  // value; everything else was mapped onto the ten (see CATEGORY_ALIASES).
  //
  // 'Compliance & Certification' covers what was split across "Standards &
  // Compliance" (46), "Compliance Frameworks" (39) and "Certification Schemes"
  // (13). Folding those into 'Government & Policy' would lose the distinction
  // a reader is actually filtering on: a policy statement is not an auditable
  // control framework.
  //
  // 'Blockchain Standards' is 25 BIPs and EIPs — a coherent corpus with its own
  // numbering and its own audience.
  //
  // 'Implementations' covers libraries, vendor roadmaps, hardware and firmware:
  // documents about SHIPPING code rather than about a specification.
  'Compliance & Certification',
  'Blockchain Standards',
  'Implementations',
] as const

export type LibraryCategory = (typeof LIBRARY_CATEGORIES)[number]

// ── Purpose: a coarse "why are you here" axis layered OVER the 10 topical
// categories. Three doors let a visitor enter the library by intent — learn,
// look something up, or plan a migration — before drilling into a category.
// A dedicated `purpose` CSV column overrides the heuristic where a row has
// been manually reviewed (see `resolvePurpose`); most rows still fall back to
// the manual_category heuristic. Measured split across the active catalog is
// ~Reference 76% / Education 13% / Planning 10%.
export const LIBRARY_PURPOSES = ['education', 'reference', 'planning'] as const
export type LibraryPurpose = (typeof LIBRARY_PURPOSES)[number]

// Migration-planning keywords are checked FIRST so a "migration strategy" lands
// in Planning rather than Reference; Education next; everything else (standards,
// specs, protocols, policy, PKI, algorithms, frameworks) falls to Reference.
const PURPOSE_PLANNING_KEYWORDS = [
  'migration',
  'program guidance',
  'playbook',
  'roadmap',
  'readiness',
  'strategy',
  'transition',
  'planning',
  'recommendation',
]
const PURPOSE_EDUCATION_KEYWORDS = [
  'research',
  'news',
  'education',
  'threat',
  'analysis',
  'whitepaper',
  'white paper',
  'blog',
  'opinion',
  'case study',
  'academ',
  'book',
]

/**
 * Coarse intent bucket for a document. Reads manual_category when present (the
 * validated signal), else falls back to document_type so the rows with a blank
 * manual_category still bucket sensibly. Title is deliberately NOT used — it
 * over-triggers (every other RFC mentions "migration" or "analysis"). Exported
 * for unit testing the mapping against the real catalog.
 */
export function detectPurpose(
  manualCategory: string | undefined,
  documentType: string | undefined
): LibraryPurpose {
  const hay = (
    manualCategory && manualCategory.trim() ? manualCategory : (documentType ?? '')
  ).toLowerCase()
  if (PURPOSE_PLANNING_KEYWORDS.some((k) => hay.includes(k))) return 'planning'
  if (PURPOSE_EDUCATION_KEYWORDS.some((k) => hay.includes(k))) return 'education'
  return 'reference'
}

/**
 * Resolve a row's purpose door: prefer the dedicated `purpose` CSV column
 * (a manually-assigned, non-heuristic signal) when it's a recognized value;
 * otherwise fall back to the `detectPurpose` heuristic. The CSV column is
 * sparse by design — only rows manually reviewed for door placement carry it.
 */
export function resolvePurpose(
  csvPurpose: string | undefined,
  manualCategory: string | undefined,
  documentType: string | undefined
): LibraryPurpose {
  const trimmed = csvPurpose?.trim().toLowerCase()
  if (trimmed && (LIBRARY_PURPOSES as readonly string[]).includes(trimmed)) {
    return trimmed as LibraryPurpose
  }
  return detectPurpose(manualCategory, documentType)
}

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
  last_verified?: string
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
  access_type: string
  free_summary_url: string
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
  /** Optional dedicated purpose-door assignment, overriding the manual_category
   *  heuristic when present. Sparse — most rows still fall back to the
   *  heuristic. See `resolvePurpose` for the resolution logic. */
  purpose?: string
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
    lastVerified: row.last_verified || undefined,
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
    purpose: resolvePurpose(row.purpose, row.manual_category || undefined, row.document_type),
    peerReviewed: (row.peer_reviewed?.toLowerCase() as LibraryItem['peerReviewed']) || undefined,
    vettingBody: row.vetting_body ? splitSemicolon(row.vetting_body) : undefined,
    githubContributionUrl: row.github_contribution_url?.trim() || undefined,
    downloadUrlQuality: row.download_url_quality || undefined,
    accessType: row.access_type?.trim().toLowerCase() === 'paid' ? 'paid' : undefined,
    freeSummaryUrl: row.free_summary_url?.trim() || undefined,
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

/** Corpus health, read live from the latest CSV — never hardcode this
 * anywhere it's displayed (design_handoff_2026_pages/IMPLEMENTATION-PLAN-
 * LIBRARY-2026-08-01.md §3.1). `reasonCounts` uses the CSV's own real
 * `deprecated_reason` values verbatim, not invented copy. */
export interface LibraryCorpusHealth {
  active: number
  deprecated: number
  total: number
  reasonCounts: { reason: string; count: number }[]
}
let libraryCorpusHealth: LibraryCorpusHealth = {
  active: 0,
  deprecated: 0,
  total: 0,
  reasonCounts: [],
}

if (import.meta.env.VITE_MOCK_DATA === 'true') {
  currentItems = parseLibraryCSV(MOCK_LIBRARY_CSV_CONTENT)
  parsedMetadata = { filename: 'MOCK_LIBRARY_DATA', lastUpdate: new Date() }
  libraryCorpusHealth = {
    active: currentItems.length,
    deprecated: 0,
    total: currentItems.length,
    reasonCounts: [],
  }
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

  // Second pass over the same latest CSV, this time keeping every
  // deprecated/obsolete row (not just the ones with a superseded_by link
  // transformDeprecatedRow requires) so the corpus-health count and its
  // "why" breakdown reflect the true deprecated total.
  const deprecatedRowResult = loadLatestCSV<RawLibraryRow, { reason: string }>(
    modules,
    /library_(\d{2})(\d{2})(\d{4})(?:_r(\d+))?\.csv$/,
    (row) =>
      row.status === 'deprecated' || row.status === 'obsolete'
        ? { reason: (row.deprecated_reason || '').trim() || 'No reason recorded' }
        : null
  )
  const reasonTally = new Map<string, number>()
  for (const { reason } of deprecatedRowResult.data) {
    reasonTally.set(reason, (reasonTally.get(reason) ?? 0) + 1)
  }

  // Keep currentItems FLAT + enriched; buildTree runs last (in the export below).
  currentItems = attachPriorRevisions(result.data, priorResult.data)
  previousItems = result.previousData ? result.previousData : []
  parsedMetadata = result.metadata
  libraryCorpusHealth = {
    active: currentItems.length,
    deprecated: deprecatedRowResult.data.length,
    total: currentItems.length + deprecatedRowResult.data.length,
    reasonCounts: [...reasonTally.entries()]
      .map(([reason, count]) => ({ reason, count }))
      .sort((a, b) => b.count - a.count),
  }
}

export { libraryCorpusHealth }

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

// ── New / Updated badge derivation (recency window) ──────────────────────────
// A document is 'New' when its publication date is within the last
// RECENCY_WINDOW_DAYS, else 'Updated' when its last-update date is. Evaluated at
// load time as a rolling window (the catalog is static per deploy, so the badge
// naturally ages out). This replaces the previous-CSV diff, which is inert with a
// single CSV on disk; the diff result (statusMap) is kept as a fallback.
export const RECENCY_WINDOW_DAYS = 30

export function parseDateMs(value: string | undefined): number | null {
  if (!value) return null
  const ms = Date.parse(value.trim())
  return Number.isNaN(ms) ? null : ms
}

export function computeRecencyStatus(
  item: Pick<LibraryItem, 'initialPublicationDate' | 'lastUpdateDate'>,
  nowMs: number,
  windowDays: number = RECENCY_WINDOW_DAYS
): 'New' | 'Updated' | undefined {
  const windowMs = windowDays * 24 * 60 * 60 * 1000
  const published = parseDateMs(item.initialPublicationDate)
  if (published !== null && published <= nowMs && nowMs - published <= windowMs) return 'New'
  const updated = parseDateMs(item.lastUpdateDate)
  if (updated !== null && updated <= nowMs && nowMs - updated <= windowMs) return 'Updated'
  return undefined
}

const nowMs = Date.now()

// Inject status + citationCount, THEN build the dependency tree as the final step
// so `children[]` reference the same fully-enriched objects as the top-level array
// (priorRevisions/groupStatusBucket/status/citationCount all present). This is what
// lets findByRef(...) resolve a child and still see priorRevisions in the detail view.
export const libraryData: LibraryItem[] = buildTree(
  currentItems.map((item) => ({
    ...item,
    status: computeRecencyStatus(item, nowMs) ?? statusMap.get(item.referenceId),
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

// ── Renamed reference_id aliases ──────────────────────────────────────────
// CSV snapshots occasionally rename a reference_id (e.g. a draft's id gains a
// revision suffix). Stale deep links elsewhere in the app — the FAQ, chat
// citations, external bookmarks — may still use the old id. Add an entry here
// whenever a rename happens so `findLibraryItemByRef` keeps resolving old
// links instead of silently opening to nothing.
export const REFERENCE_ID_ALIASES: Record<string, string> = {
  'NIST-IR-8547': 'NIST-IR-8547-IPD2',
  'NIST-CSWP-39': 'NIST CSWP 39',
}

/** Resolve a `?ref=` value to a live library item, tolerating known reference_id renames. */
export function findLibraryItemByRef(ref: string): LibraryItem | undefined {
  const resolved = REFERENCE_ID_ALIASES[ref] ?? ref
  return libraryData.find((item) => item.referenceId === resolved)
}
