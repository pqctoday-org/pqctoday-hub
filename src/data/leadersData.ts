// SPDX-License-Identifier: GPL-3.0-only
import { compareDatasets, type ItemStatus } from '../utils/dataComparison'
import { loadLatestCSV, splitSemicolon } from './csvUtils'

export interface Leader {
  /** Same value as `leaderId` — the React key / expand / scroll identity. */
  id: string
  /** Stable `leader_id` column (added leaders_09292026.csv): kebab slug of the
   *  name without honorifics, suffixed with the organisation slug (then -2, -3)
   *  only where two rows share a name. Frozen once minted — `?leader=` links use it. */
  leaderId: string
  name: string
  country: string
  title: string
  organizations: string[]
  type: 'Public' | 'Private' | 'Academic'
  category: string
  bio: string
  imageUrl?: string
  websiteUrl?: string
  linkedinUrl?: string
  keyResourceUrl?: string[]
  /** Library reference IDs cited as evidence for this leader's contribution. Used by trust scoring to inherit peer-review + vetting from authored documents (the `keyResourceUrl` field above stores URLs, not IDs, so it cannot be used as a lookup key against the library map). */
  keyResourceRefs?: string[]
  /** Patent numbers (patents.patent_number) this leader is the first-named inventor on — a separate proof anchor from keyResourceRefs, added 2026-07-30 for the patents↔leaders cross-check. */
  patentRefs?: string[]
  /** Google Patents URLs matching patentRefs positionally, same pairing convention as keyResourceRefs/keyResourceUrl. */
  patentUrl?: string[]
  /** migrate-catalog product_ids this leader is a credited open-source maintainer/author of — a third proof anchor, added 2026-07-30 for the migrate-catalog↔leaders cross-check. */
  migrateCatalogRefs?: string[]
  /** Repository URLs matching migrateCatalogRefs positionally, same pairing convention as patentRefs/patentUrl. */
  migrateCatalogUrl?: string[]
  peerReviewed?: 'yes' | 'no' | 'partial'
  vettingBody?: string[]
  status?: 'New' | 'Updated'
  /** 'auto-imported' rows are single-sentence stubs generated from a library
   *  authorship join ("Author or contributor on N PQC reference(s)..."); 'curated'
   *  rows have hand-written bios/roles. Drives the tiered browsing default. */
  sourceKind: 'curated' | 'auto-imported'
  /** ISO date the row's affiliation/role was last confirmed against a public
   *  source, parsed from `data_quality_notes`. Absent means never explicitly
   *  re-verified since import. */
  verifiedDate?: string
}

interface RawLeaderRow {
  Name: string
  Country: string
  Role: string
  Organization: string
  Type: string
  Category: string
  Contribution: string
  ImageUrl: string
  WebsiteUrl: string
  LinkedinUrl: string
  KeyResourceUrls: string
  KeyResourceUrl: string
  KeyResourceRefs: string
  PatentRefs?: string
  PatentUrls?: string
  MigrateCatalogRefs?: string
  MigrateCatalogUrls?: string
  trusted_source_id: string
  peer_reviewed: string
  vetting_body: string
  data_quality_notes: string
  verified_date?: string
  status?: string
  deprecated_at?: string
  deprecated_reason?: string
  leader_id?: string
}

// Distinguishes the 124 single-sentence, library-authorship-derived stub rows
// from the 208 hand-curated profiles (see `data_quality_notes` convention set
// 2026-05-10 by the library-authors auto-import script).
const isAutoImportedRow = (note: string): boolean => note.includes('auto-imported from library')

const modules = import.meta.glob('./leaders_*.csv', {
  query: '?raw',
  import: 'default',
  eager: true,
})

type LeaderCore = Omit<Leader, 'id' | 'status'>

const {
  data: currentItems,
  previousData: previousItems,
  metadata,
} = loadLatestCSV<RawLeaderRow, LeaderCore>(
  modules,
  /leaders_(\d{2})(\d{2})(\d{4})(?:_r(\d+))?\.csv$/,
  (row) => {
    if (row.status && row.status !== 'active') return null
    return {
      leaderId: row.leader_id?.trim() ?? '',
      name: row.Name,
      country: row.Country,
      title: row.Role,
      organizations: splitSemicolon(row.Organization),
      type: row.Type as Leader['type'],
      category: row.Category,
      bio: row.Contribution,
      imageUrl: row.ImageUrl?.includes('ui-avatars.com') ? undefined : row.ImageUrl,
      websiteUrl: row.WebsiteUrl,
      linkedinUrl: row.LinkedinUrl,
      keyResourceUrl: row.KeyResourceUrls
        ? splitSemicolon(row.KeyResourceUrls)
        : row.KeyResourceUrl
          ? splitSemicolon(row.KeyResourceUrl)
          : undefined,
      keyResourceRefs: row.KeyResourceRefs ? splitSemicolon(row.KeyResourceRefs) : undefined,
      patentRefs: row.PatentRefs ? splitSemicolon(row.PatentRefs) : undefined,
      patentUrl: row.PatentUrls ? splitSemicolon(row.PatentUrls) : undefined,
      migrateCatalogRefs: row.MigrateCatalogRefs
        ? splitSemicolon(row.MigrateCatalogRefs)
        : undefined,
      migrateCatalogUrl: row.MigrateCatalogUrls
        ? splitSemicolon(row.MigrateCatalogUrls)
        : undefined,
      peerReviewed: (row.peer_reviewed?.toLowerCase() as Leader['peerReviewed']) || undefined,
      vettingBody: row.vetting_body ? splitSemicolon(row.vetting_body) : undefined,
      sourceKind: isAutoImportedRow(row.data_quality_notes ?? '') ? 'auto-imported' : 'curated',
      verifiedDate: row.verified_date || undefined,
    }
  },
  true // withPrevious for status badges
)

// `leaderId` is left out of the comparison: a previous snapshot minted before
// the column existed would otherwise flag every row as Updated.
const withoutLeaderId = (item: LeaderCore): Omit<LeaderCore, 'leaderId'> => {
  const rest: Partial<LeaderCore> = { ...item }
  delete rest.leaderId
  return rest as Omit<LeaderCore, 'leaderId'>
}

// Compute status map if previous data exists
const statusMap = previousItems
  ? compareDatasets(currentItems.map(withoutLeaderId), previousItems.map(withoutLeaderId), 'name')
  : new Map<string, ItemStatus>()

// Inject status into current items and export. The `${name}-${index}` fallback
// only covers a snapshot without the column; leadersData.test.ts asserts the
// shipped one has a unique leader_id on every row.
export const leadersData: Leader[] = currentItems.map((item, index) => {
  const leaderId = item.leaderId || `${item.name}-${index}`
  return { ...item, id: leaderId, leaderId, status: statusMap.get(item.name) }
})

export const leadersMetadata = metadata
