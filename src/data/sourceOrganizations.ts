// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Canonical identities for source organizations used by the Compliance Hub.
 *
 * A display name is not an identifier. The compliance catalogue contains short
 * names, full names, organizational units, and joint-publisher strings. Keeping
 * the aliases here lets applicability code answer the narrow provenance
 * question (domestic / foreign / international) without pretending that every
 * publisher is a regulator.
 *
 * This registry starts with the organizations whose aliases affect visible
 * jurisdiction claims. Unknown organizations deliberately remain unclassified;
 * the UI must never infer "foreign" from a failed string match.
 */

export type SourceOrganizationKind =
  | 'government_agency'
  | 'regulator'
  | 'standards_body'
  | 'certification_scheme'
  | 'professional_body'
  | 'industry_consortium'
  | 'international_arrangement'

export interface SourceOrganization {
  id: string
  name: string
  aliases: readonly string[]
  kind: SourceOrganizationKind
  /** Empty for international or multijurisdictional organizations. */
  domiciles: readonly string[]
  scope: 'national' | 'regional' | 'international'
  parentId?: string
  sourceUrl: string
  verifiedAt: string
  /** Explicitly prevents a domicile inference when the source itself is unnamed or unresolved. */
  relationshipOverride?: 'unclassified'
}

import { loadLatestCSV, splitPipe, splitSemicolon } from './csvUtils'

/**
 * The registry is the rows of `source_organizations_*.csv` (newest date, then
 * revision): one row per organization, with its aliases (`|`-separated, because a
 * few aliases are joint-publisher strings that contain `;`), kind, domiciles,
 * scope, parent, official source page and the date the identity was last verified.
 */
interface RawSourceOrganizationRow {
  id: string
  name: string
  aliases: string
  kind: string
  domiciles: string
  scope: string
  parent_id: string
  source_url: string
  verified_at: string
  relationship_override: string
}

const KINDS: readonly SourceOrganizationKind[] = [
  'government_agency',
  'regulator',
  'standards_body',
  'certification_scheme',
  'professional_body',
  'industry_consortium',
  'international_arrangement',
]
const SCOPES: readonly SourceOrganization['scope'][] = ['national', 'regional', 'international']

const csvModules = import.meta.glob('./source_organizations_*.csv', {
  query: '?raw',
  import: 'default',
  eager: true,
})

export const SOURCE_ORGANIZATIONS: readonly SourceOrganization[] = loadLatestCSV<
  RawSourceOrganizationRow,
  SourceOrganization
>(csvModules, /source_organizations_(\d{2})(\d{2})(\d{4})(?:_r(\d+))?\.csv$/, (row) => {
  const id = row.id?.trim()
  if (!id) return null
  const kind = row.kind?.trim() as SourceOrganizationKind
  const scope = row.scope?.trim() as SourceOrganization['scope']
  if (!KINDS.includes(kind))
    throw new Error(`Source organization ${id}: unknown kind "${row.kind}"`)
  if (!SCOPES.includes(scope)) {
    throw new Error(`Source organization ${id}: unknown scope "${row.scope}"`)
  }
  const override = row.relationship_override?.trim()
  return {
    id,
    name: row.name.trim(),
    aliases: splitPipe(row.aliases),
    kind,
    domiciles: splitSemicolon(row.domiciles),
    scope,
    ...(row.parent_id?.trim() ? { parentId: row.parent_id.trim() } : {}),
    sourceUrl: row.source_url.trim(),
    verifiedAt: row.verified_at.trim(),
    ...(override === 'unclassified' ? { relationshipOverride: override } : {}),
  }
}).data

function normalizeOrganizationName(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[’']/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLocaleLowerCase('en-US')
}

const BY_ALIAS = new Map<string, SourceOrganization>()
for (const organization of SOURCE_ORGANIZATIONS) {
  for (const alias of [organization.name, ...organization.aliases]) {
    const key = normalizeOrganizationName(alias)
    const existing = BY_ALIAS.get(key)
    if (existing && existing.id !== organization.id) {
      throw new Error(`Duplicate source-organization alias: ${alias}`)
    }
    BY_ALIAS.set(key, organization)
  }
}

export function sourceOrganizationFor(value: string | null | undefined): SourceOrganization | null {
  const key = normalizeOrganizationName(value ?? '')
  return key ? (BY_ALIAS.get(key) ?? null) : null
}

const BY_ID = new Map<string, SourceOrganization>(SOURCE_ORGANIZATIONS.map((o) => [o.id, o]))

/** The curated organization with this `id`, or null. An id is not a display name; use `sourceOrganizationFor` for names. */
export function sourceOrganizationById(id: string | null | undefined): SourceOrganization | null {
  return id ? (BY_ID.get(id) ?? null) : null
}
