// SPDX-License-Identifier: GPL-3.0-only
import type { ComplianceRecord, ComplianceSource } from './types'
import type { TrustTier } from '@/data/trustScore'
import { matchesTrustTierFilter } from '../common/TrustTierFilter'
import { getMigrateCategory } from './migrateCategories'
import { isCurrentRecord, recordTypeLabel, type RecordScope } from './recordSemantics'

/**
 * The Product Records filters, one predicate per URL param.
 *
 * Extracted from ComplianceTable's filter pass (2026-09-28, deep-link PR 1) so
 * the table and the `?cert=` deep-link widening share ONE definition of "this
 * record is hidden, and by which filter". Before, a `?cert=` link to a record
 * hidden by the default "current" scope or a same-URL filter opened nothing
 * and said nothing.
 */

/** Keyed by the URL param each filter is stored under. */
export type RecordFilterKey =
  'rstatus' | 'rtab' | 'q' | 'pqc' | 'cat' | 'src' | 'vendor' | 'mcat' | 'tier'

export interface RecordFilterState {
  scope: RecordScope
  certType: string
  text: string
  pqc: readonly string[]
  category: readonly string[]
  source: readonly string[]
  vendor: readonly string[]
  migrateCat: readonly string[]
  tiers?: readonly TrustTier[]
}

/**
 * Maps a cert record's `source` to the framework ID used to look up
 * trust scores. Records whose source has no corresponding scored framework
 * (e.g. 'Other') return null and are excluded when a tier filter is active.
 */
const SOURCE_TO_FRAMEWORK_ID: Record<ComplianceSource, string | null> = {
  NIST: 'NIST',
  'Common Criteria': 'COMMON-CRITERIA',
  'BSI Germany': 'BSI',
  ANSSI: 'ANSSI',
  ENISA: 'ENISA',
  Other: null,
}

export function matchesCertType(record: ComplianceRecord, certType: string): boolean {
  if (!certType) return true
  const ct = certType.toLowerCase()
  if (ct === 'all') return true
  if (ct === 'fips' || ct === 'fips 140-3') return record.type === 'FIPS 140-3'
  if (ct === 'acvp') return record.type === 'ACVP'
  if (ct === 'cc') return record.type === 'Common Criteria'
  if (ct === 'cspn') return record.type === 'CSPN'
  return true
}

export function matchesRecordText(record: ComplianceRecord, text: string): boolean {
  const s = text.toLowerCase()
  if (!s) return true
  return (
    record.productName.toLowerCase().includes(s) ||
    record.vendor.toLowerCase().includes(s) ||
    record.source.toLowerCase().includes(s) ||
    recordTypeLabel(record.type).toLowerCase().includes(s) ||
    record.id.toLowerCase().includes(s)
  )
}

function matchesTier(record: ComplianceRecord, tiers: readonly TrustTier[] | undefined): boolean {
  if (!tiers || tiers.length === 0) return true
  const frameworkId = SOURCE_TO_FRAMEWORK_ID[record.source]
  if (!frameworkId) return false
  return matchesTrustTierFilter([...tiers], 'compliance', frameworkId)
}

/** Every filter that hides `record`, in URL-param terms. Empty = visible. */
export function recordFilterExclusions(
  record: ComplianceRecord,
  f: RecordFilterState
): RecordFilterKey[] {
  const out: RecordFilterKey[] = []
  if (f.scope !== 'all' && !isCurrentRecord(record)) out.push('rstatus')
  if (!matchesCertType(record, f.certType)) out.push('rtab')
  if (!matchesRecordText(record, f.text)) out.push('q')
  if (
    f.pqc.length > 0 &&
    !(
      typeof record.pqcCoverage === 'string' &&
      f.pqc.some((p) => record.pqcCoverage.toString().includes(p))
    )
  )
    out.push('pqc')
  if (f.category.length > 0 && !f.category.includes(record.productCategory)) out.push('cat')
  if (f.source.length > 0 && !f.source.includes(record.source)) out.push('src')
  if (f.vendor.length > 0 && !f.vendor.some((v) => record.vendor.includes(v))) out.push('vendor')
  if (
    f.migrateCat.length > 0 &&
    !f.migrateCat.includes(getMigrateCategory(record.productCategory)?.categoryId ?? '')
  )
    out.push('mcat')
  if (!matchesTier(record, f.tiers)) out.push('tier')
  return out
}

const FILTER_LABEL: Record<RecordFilterKey, string> = {
  rstatus: 'the current-only scope',
  rtab: 'the record-type tab',
  q: 'the search',
  pqc: 'the PQC filter',
  cat: 'the category filter',
  src: 'the source filter',
  vendor: 'the vendor filter',
  mcat: 'the Migrate category filter',
  tier: 'the trust-tier filter',
}

/** "the search and the vendor filter" — for the widened-notice sentence. */
export function describeExclusions(keys: readonly RecordFilterKey[]): string {
  // eslint-disable-next-line security/detect-object-injection -- k is a RecordFilterKey literal
  const labels = keys.map((k) => FILTER_LABEL[k])
  if (labels.length <= 1) return labels[0] ?? ''
  return `${labels.slice(0, -1).join(', ')} and ${labels[labels.length - 1]}`
}

/**
 * The same params with just the excluding filters relaxed: scope widened to
 * `rstatus=all`, every other excluding filter cleared, and the page reset.
 * Everything else (tab, cert, sort, non-excluding filters) is kept.
 */
export function widenRecordParams(
  prev: URLSearchParams,
  keys: readonly RecordFilterKey[]
): URLSearchParams {
  const next = new URLSearchParams(prev)
  for (const k of keys) {
    if (k === 'rstatus') next.set('rstatus', 'all')
    else next.delete(k)
  }
  next.delete('page')
  return next
}

/**
 * Undo for {@link widenRecordParams}: put back exactly the relaxed filters as
 * they were in `before`, on top of whatever the URL holds now — so undoing
 * never re-opens a record the reader has since closed.
 */
export function restoreRecordParams(
  current: URLSearchParams,
  before: URLSearchParams,
  keys: readonly RecordFilterKey[]
): URLSearchParams {
  const next = new URLSearchParams(current)
  for (const k of [...keys, 'page']) {
    next.delete(k)
    for (const v of before.getAll(k)) next.append(k, v)
  }
  return next
}
