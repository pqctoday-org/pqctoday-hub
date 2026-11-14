// SPDX-License-Identifier: AGPL-3.0-only
import { loadLatestCSV, splitSemicolon } from './csvUtils'
import { tagKey } from './patentFilters'
import type {
  PatentItem,
  CryptoAgilityMode,
  MigrationStrategy,
  QuantumRelevance,
  ClaimDependency,
  NistStatus,
  ImpactLevel,
  NistStatusValue,
  PublicationKind,
} from '../types/PatentTypes'

interface RawPatentRow {
  patent_number: string
  title: string
  inventors: string
  assignee: string
  filing_jurisdiction?: string
  filing_jurisdiction_application?: string
  filing_jurisdiction_source_url?: string
  priority_date: string
  issue_date: string
  filing_date: string
  cpc_codes: string
  one_sentence_summary: string
  primary_inventive_claim: string
  crypto_agility_mode: string
  migration_strategy: string
  quantum_relevance: string
  quantum_notes: string
  quantum_safe_basis?: string
  protocols: string
  classical_algorithms: string
  pqc_algorithms: string
  quantum_technology: string
  key_management_ops: string
  hardware_components: string
  authentication_factors: string
  standards_referenced: string
  threat_model: string
  entropy_source: string
  primitive_types: string
  application_domain: string
  independent_claim_subjects: string
  performance_claims: string
  data_types_protected: string
  compliance_targets: string
  citation_graph: string
  claim_dependencies: string
  nist_round_status: string
  pqc_migration_score: string
  pqc_migration_reason: string
  // DS-series lifecycle (since patents_09172026.csv): rows outside the
  // Patents page scope are deprecated, never deleted. Optional because
  // the previous generation has no such columns.
  status?: string
  deprecated_at?: string
  deprecated_reason?: string
}

const FIPS_STATUSES: NistStatusValue[] = ['fips_203', 'fips_204', 'fips_205']

/**
 * Hub impact score, 0–100 (owner decision 2026-11-14): half from what the
 * record itself says, half from its curated 1–10 PQC migration score.
 *
 * Facts (0–50):
 *  - FIPS standards named (0–20): one of FIPS 203/204/205 = 12, two = 16,
 *    three = 20; no FIPS but another NIST track (Round 4, selected, stateful
 *    hash standard) = 6.
 *  - Protocols (0–8): any protocol named.
 *  - Hardware (0–7): any hardware component named.
 *  - Application domains (0–10): 2 per domain, up to 5.
 *  - Data types protected (0–5): health or biometric 3, financial 2, PII 1,
 *    any other type 1.
 * Migration (0–50): migration score × 5. A record not yet scored takes its
 * facts half twice, so a missing score neither lifts nor sinks it.
 *
 * The old formula gave post-quantum-only patents 10 of 40 "urgency" points
 * (urgency measures how badly a CLASSICAL system must migrate), so none of
 * them could reach High. That component is gone.
 */
export function computeImpactParts(
  item: Omit<PatentItem, 'impactScore' | 'impactLevel' | 'impactFacts' | 'impactMigration'>
): { facts: number; migration: number } {
  const fipsCount = new Set(
    item.nistRoundStatus
      .map((s) => s.status)
      .filter((s) => FIPS_STATUSES.includes(s as NistStatusValue))
  ).size
  const otherNistTrack = item.nistRoundStatus.some((s) =>
    ['round4_candidate', 'selected_for_standardization', 'stateful_hash_standard'].includes(
      s.status
    )
  )
  const standards =
    fipsCount >= 3 ? 20 : fipsCount === 2 ? 16 : fipsCount === 1 ? 12 : otherNistTrack ? 6 : 0
  const protocols = item.protocols.length > 0 ? 8 : 0
  const hardware = item.hardwareComponents.length > 0 ? 7 : 0
  const domains = Math.min(item.applicationDomain.length, 5) * 2

  const types = item.dataTypesProtected
  let data = 0
  if (types.includes('PHI') || types.includes('biometric')) data += 3
  if (types.includes('financial')) data += 2
  if (types.includes('PII')) data += 1
  if (types.some((t) => !['PHI', 'biometric', 'financial', 'PII'].includes(t))) data += 1
  data = Math.min(data, 5)

  const facts = standards + protocols + hardware + domains + data
  const score = item.pqcMigrationScore
  const migration = score == null ? facts : Math.round(Math.max(0, Math.min(score, 10)) * 5)
  return { facts, migration }
}

/**
 * Titles harvested from Google Patents search results keep the snippet's
 * match markup ("Cryptographic system for <b>post-quantum</b> …"). React
 * escapes it, so readers saw the tags. Strip the markup; the words stay.
 */
export function cleanPatentTitle(raw: string | undefined): string {
  return (raw ?? '')
    .replace(/<\/?b>/gi, '')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * A US number of 11 digits starting with the year ("20260189535") is a
 * pre-grant publication of an application: its claims are still being
 * examined. Shorter numbers ("12470376") are granted patents.
 */
export function publicationKindOf(rawNumber: string): PublicationKind {
  const digits = rawNumber.trim().replace(/^US/i, '')
  return /^(19|20)\d{9}$/.test(digits) ? 'published_application' : 'granted_patent'
}

/**
 * Individual holders arrive in the USPTO "Surname; Given names" form
 * ("Nix; John A."), sometimes several joined by commas, while other rows
 * carry the same person as "John A. Nix". Turn each "Surname; Given" part
 * into "Given Surname" (an all-capitals surname gets ordinary capitals) so
 * the canonicaliser below can merge them. Company names have no ";" and are
 * left alone.
 */
export function normalizePersonalAssignee(name: string): string {
  if (!name.includes(';')) return name
  return name
    .split(',')
    .map((part) => {
      const [surname, ...given] = part.split(';')
      if (given.length === 0) return part.trim()
      const sur = surname.trim()
      const nice = sur === sur.toUpperCase() ? sur.charAt(0) + sur.slice(1).toLowerCase() : sur
      return `${given.join(' ').trim()} ${nice}`.trim()
    })
    .join(', ')
}

export const IMPACT_HIGH_MIN = 72

export function toImpactLevel(score: number): ImpactLevel {
  // 72 (owner decision 2026-11-14: roughly the top 15–20% High). On
  // patents_11122026.csv that is 138 of 732 records (18.9%); no multiple of
  // 5 falls in the band (70 → 23.1%, 75 → 14.1%).
  if (score >= IMPACT_HIGH_MIN) return 'High'
  if (score >= 35) return 'Medium'
  return 'Low'
}

function parseJsonField<T>(raw: string, fallback: T): T {
  if (!raw || raw.trim() === '') return fallback
  try {
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

export function transformRow(row: RawPatentRow): PatentItem | null {
  if (!row.patent_number?.trim()) return null
  // Lifecycle filter (2026-09-17): a deprecated row is carried in the CSV
  // for self-containment but is not a patent this page shows. Done here,
  // on the raw row (lifecycle status is not carried onto PatentItem).
  const lifecycle = row.status?.trim().toLowerCase()
  if (lifecycle && lifecycle !== 'active') return null

  const partial: Omit<
    PatentItem,
    'impactScore' | 'impactLevel' | 'impactFacts' | 'impactMigration'
  > = {
    patentNumber: `US${row.patent_number.trim()}`,
    publicationKind: publicationKindOf(row.patent_number),
    filingJurisdiction: row.filing_jurisdiction?.trim() || undefined,
    filingJurisdictionApplication: row.filing_jurisdiction_application?.trim() || undefined,
    filingJurisdictionSourceUrl: row.filing_jurisdiction_source_url?.trim() || undefined,
    title: cleanPatentTitle(row.title),
    inventors: row.inventors?.trim() ?? '',
    assignee: normalizePersonalAssignee(row.assignee?.trim() ?? ''),
    priorityDate: row.priority_date?.trim() ?? '',
    issueDate: row.issue_date?.trim() ?? '',
    filingDate: row.filing_date?.trim() ?? '',
    cpcCodes: row.cpc_codes?.trim() ?? '',
    summary: row.one_sentence_summary?.trim() ?? '',
    primaryInventiveClaim: row.primary_inventive_claim?.trim() ?? '',
    cryptoAgilityMode: (row.crypto_agility_mode?.trim() as CryptoAgilityMode) || 'unclear',
    migrationStrategy: (row.migration_strategy?.trim() as MigrationStrategy) || 'none',
    quantumRelevance: (row.quantum_relevance?.trim() as QuantumRelevance) || 'none',
    quantumNotes: row.quantum_notes?.trim() ?? '',
    quantumSafeBasis: (row.quantum_safe_basis?.trim() ?? '') as PatentItem['quantumSafeBasis'],
    protocols: splitSemicolon(row.protocols),
    classicalAlgorithms: splitSemicolon(row.classical_algorithms),
    pqcAlgorithms: splitSemicolon(row.pqc_algorithms),
    quantumTechnology: splitSemicolon(row.quantum_technology),
    keyManagementOps: splitSemicolon(row.key_management_ops),
    hardwareComponents: splitSemicolon(row.hardware_components),
    authenticationFactors: splitSemicolon(row.authentication_factors),
    standardsReferenced: splitSemicolon(row.standards_referenced),
    threatModel: splitSemicolon(row.threat_model),
    entropySource: splitSemicolon(row.entropy_source),
    primitiveTypes: splitSemicolon(row.primitive_types),
    applicationDomain: splitSemicolon(row.application_domain),
    independentClaimSubjects: splitSemicolon(row.independent_claim_subjects),
    performanceClaims: splitSemicolon(row.performance_claims),
    dataTypesProtected: splitSemicolon(row.data_types_protected),
    complianceTargets: splitSemicolon(row.compliance_targets),
    citationGraph: splitSemicolon(row.citation_graph),
    claimDependencies: parseJsonField<ClaimDependency[]>(row.claim_dependencies, []),
    nistRoundStatus: parseJsonField<NistStatus[]>(row.nist_round_status, []),
    priorityYear: parseInt(row.priority_date?.slice(0, 4) ?? '0', 10) || 0,
    filingYear: parseInt(row.filing_date?.slice(0, 4) ?? '0', 10) || 0,
    // Preserve null for missing/unparseable scores rather than coercing to 0 — an
    // unscored patent is not the same as one genuinely scored at the bottom.
    // parseFloat (not parseInt) because pqc_migration_score is a decimal string ("8.0").
    pqcMigrationScore: (() => {
      const raw = row.pqc_migration_score?.trim()
      if (!raw) return null
      const n = parseFloat(raw)
      return Number.isFinite(n) ? n : null
    })(),
    pqcMigrationReason: row.pqc_migration_reason?.trim() ?? '',
  }

  const { facts, migration } = computeImpactParts(partial)
  const impactScore = facts + migration
  return {
    ...partial,
    impactFacts: facts,
    impactMigration: migration,
    impactScore,
    impactLevel: toImpactLevel(impactScore),
  }
}

// Source records mix casing and punctuation conventions across pulls (e.g.
// "Intel Corporation" vs "INTEL CORPORATION", "Thales Dis Cpl Usa, Inc." vs
// "THALES DIS CPL USA, INC" with no trailing period), which fragments the same
// company into separate rows in filters and Top Assignees. Collapse each
// normalized-key group onto whichever exact spelling is most common, so
// duplicates merge without hand-maintained rules. Punctuation is stripped only
// for the grouping key, not the displayed name — and only trivial noise
// (periods/commas/whitespace), not corporate-suffix letters (e.g. "SA" vs
// "SAS" stay distinct, since that can reflect a genuinely different legal
// entity rather than a typo).
function normalizeAssigneeKey(name: string): string {
  return name.toLowerCase().replace(/[.,]/g, '').replace(/\s+/g, ' ').trim()
}

function canonicalizeAssignees(items: PatentItem[]): PatentItem[] {
  const variantCounts = new Map<string, Map<string, number>>()
  for (const item of items) {
    if (!item.assignee) continue
    const key = normalizeAssigneeKey(item.assignee)
    const variants = variantCounts.get(key) ?? new Map<string, number>()
    variants.set(item.assignee, (variants.get(item.assignee) ?? 0) + 1)
    variantCounts.set(key, variants)
  }
  const canonical = new Map<string, string>()
  for (const [key, variants] of variantCounts) {
    const best = [...variants.entries()].sort((a, b) => b[1] - a[1])[0][0]
    canonical.set(key, best)
  }
  return items.map((item) =>
    item.assignee
      ? { ...item, assignee: canonical.get(normalizeAssigneeKey(item.assignee))! }
      : item
  )
}

type TagField =
  | 'pqcAlgorithms'
  | 'classicalAlgorithms'
  | 'protocols'
  | 'hardwareComponents'
  | 'standardsReferenced'
  | 'threatModel'
const TAG_FIELDS: TagField[] = [
  'pqcAlgorithms',
  'classicalAlgorithms',
  'protocols',
  'hardwareComponents',
  'standardsReferenced',
  'threatModel',
]

/** Collapse spelling variants of each tag onto the spelling most rows use. */
export function canonicalizeTags(items: PatentItem[]): PatentItem[] {
  const canonical = new Map<TagField, Map<string, string>>()
  for (const field of TAG_FIELDS) {
    const counts = new Map<string, Map<string, number>>()
    for (const item of items) {
      for (const tag of item[field]) {
        const key = tagKey(tag)
        const variants = counts.get(key) ?? new Map<string, number>()
        variants.set(tag, (variants.get(tag) ?? 0) + 1)
        counts.set(key, variants)
      }
    }
    const best = new Map<string, string>()
    for (const [key, variants] of counts) {
      // Most rows first; ties go to the spelling that sorts first, so the
      // choice never depends on row order.
      const [winner] = [...variants.entries()].sort(
        (a, b) => b[1] - a[1] || a[0].localeCompare(b[0])
      )[0]
      best.set(key, winner)
    }
    canonical.set(field, best)
  }
  return items.map((item) => {
    const next = { ...item }
    for (const field of TAG_FIELDS) {
      const map = canonical.get(field)!
      next[field] = Array.from(new Set(item[field].map((t) => map.get(tagKey(t)) ?? t)))
    }
    return next
  })
}

const modules = import.meta.glob('./patents_*.csv', {
  query: '?raw',
  import: 'default',
  eager: true,
})

const result = loadLatestCSV<RawPatentRow, PatentItem>(
  modules,
  /patents_(\d{2})(\d{2})(\d{4})(?:_r(\d+))?\.csv$/,
  transformRow,
  false
)

const canonicalizedData = canonicalizeTags(canonicalizeAssignees(result.data))

export const patentsData: PatentItem[] = canonicalizedData

/**
 * Records granted or published in the `days` before the newest grant or
 * publication date in the catalogue, newest first. Sorted by those dates —
 * NOT by when the Hub added a record (the page has no previous file to
 * compare with, so a "new since last update" list could never be filled).
 */
export function latestGrantsAndPublications(items: PatentItem[], days = 90): PatentItem[] {
  const dated = items.filter((p) => /^\d{4}-\d{2}-\d{2}$/.test(p.issueDate))
  if (dated.length === 0) return []
  const newest = dated.reduce((m, p) => (p.issueDate > m ? p.issueDate : m), dated[0].issueDate)
  const cutoff = new Date(`${newest}T00:00:00Z`)
  cutoff.setUTCDate(cutoff.getUTCDate() - days)
  const from = cutoff.toISOString().slice(0, 10)
  return dated
    .filter((p) => p.issueDate > from)
    .sort(
      (a, b) =>
        b.issueDate.localeCompare(a.issueDate) || a.patentNumber.localeCompare(b.patentNumber)
    )
}
export const patentsMetadata = result.metadata
