// SPDX-License-Identifier: GPL-3.0-only
/**
 * One place for what a certification record's type, status and pqcCoverage
 * MEAN, so every consumer (records table, detail popover, trend chart,
 * exports, executive counts, developer panel) reads them the same way.
 *
 * Rules (user decision, 24 Sep 2026):
 *  - Current = 'Active' (CMVP / CC / ANSSI / EUCC) or 'Validated' (CAVP, which
 *    has no lifecycle status). Everything else — Historical, Revoked, Archived,
 *    Expired, Withdrawn, and any status string we do not recognise — is NOT
 *    current. An unknown status is never defaulted to Active.
 *  - 'ACVP' is the internal type value for NIST CAVP algorithm validations; it
 *    is shown to users as "NIST CAVP", never "ACVP certificate".
 *  - 'CSPN' is ANSSI's French national first-level scheme — separate from
 *    Common Criteria, never counted as CC.
 *  - pqcCoverage '' means the source page could not be read (unknown), not
 *    "no PQC". For CC / EUCC / CSPN the PQC names come from the Security
 *    Target, which is a claim in the evaluated document, not validated support.
 */
import type { ComplianceMeta, ComplianceRecord, ComplianceType } from './types'

// ── Status ────────────────────────────────────────────────────────────────

const CURRENT_STATUSES: ReadonlySet<string> = new Set(['Active', 'Validated'])
const HISTORICAL_STATUSES: ReadonlySet<string> = new Set([
  'Historical',
  'Archived',
  'Expired',
  'Withdrawn',
])

/** True only for a status that a source publishes as current. Unknown → false. */
export function isCurrentStatus(status: unknown): boolean {
  return typeof status === 'string' && CURRENT_STATUSES.has(status.trim())
}

export function isCurrentRecord(record: Pick<ComplianceRecord, 'status'>): boolean {
  return isCurrentStatus(record.status)
}

export type StatusTone = 'current' | 'historical' | 'revoked' | 'pending' | 'unknown'

export function statusTone(status: unknown): StatusTone {
  if (typeof status !== 'string') return 'unknown'
  const s = status.trim()
  if (CURRENT_STATUSES.has(s)) return 'current'
  if (HISTORICAL_STATUSES.has(s)) return 'historical'
  if (s === 'Revoked') return 'revoked'
  if (s === 'Pending' || s === 'In Process') return 'pending'
  return 'unknown'
}

/** Badge classes per tone — semantic tokens only. */
export const STATUS_TONE_CLASS: Record<StatusTone, string> = {
  current: 'bg-status-success/10 text-status-success border-status-success/30',
  historical: 'bg-muted text-muted-foreground border-border',
  revoked: 'bg-status-error/10 text-status-error border-status-error/30',
  pending: 'bg-status-warning/10 text-status-warning border-status-warning/30',
  unknown: 'bg-muted text-foreground border-border border-dashed',
}

export function statusBadgeClass(status: unknown): string {
  return STATUS_TONE_CLASS[statusTone(status)]
}

/** 'current' = Active + Validated only (the default view); 'all' adds historical / archived. */
export type RecordScope = 'current' | 'all'

export function applyRecordScope<T extends Pick<ComplianceRecord, 'status'>>(
  records: readonly T[],
  scope: RecordScope
): T[] {
  return scope === 'all' ? [...records] : records.filter(isCurrentRecord)
}

// ── Type ──────────────────────────────────────────────────────────────────

const TYPE_LABEL: Record<ComplianceType, string> = {
  'FIPS 140-3': 'FIPS 140-3',
  ACVP: 'NIST CAVP',
  'Common Criteria': 'Common Criteria',
  EUCC: 'EUCC',
  CSPN: 'CSPN (ANSSI)',
}

const TYPE_DESCRIPTION: Record<ComplianceType, string> = {
  'FIPS 140-3': 'FIPS 140-3 module validation (NIST CMVP)',
  ACVP: 'NIST CAVP algorithm validation',
  'Common Criteria': 'Common Criteria product certificate',
  EUCC: 'EU Common Criteria (EUCC) certificate',
  CSPN: 'CSPN (ANSSI) — French national first-level certification, separate from Common Criteria',
}

/** User-facing short label for a record type. Unknown types render as-is. */
export function recordTypeLabel(type: string): string {
  return type in TYPE_LABEL ? TYPE_LABEL[type as ComplianceType] : type
}

/** User-facing long label for a record type (tooltips, detail view). */
export function recordTypeDescription(type: string): string {
  return type in TYPE_DESCRIPTION ? TYPE_DESCRIPTION[type as ComplianceType] : type
}

/** Types whose PQC names come from a Security Target, not a validation. */
export function isSecurityTargetType(type: string): boolean {
  return type === 'Common Criteria' || type === 'EUCC' || type === 'CSPN'
}

/** NIST validation types (CMVP module validation, CAVP algorithm validation). */
export function isNistValidationType(type: string): boolean {
  return type === 'FIPS 140-3' || type === 'ACVP'
}

// ── PQC coverage ──────────────────────────────────────────────────────────

export type PqcCoverageState = 'not-read' | 'none' | 'pending' | 'heuristic' | 'named' | 'flag'

export function pqcCoverageState(
  pqcCoverage: ComplianceRecord['pqcCoverage'] | undefined
): PqcCoverageState {
  if (pqcCoverage === true) return 'flag'
  if (pqcCoverage === false) return 'none'
  const v = (pqcCoverage ?? '').trim()
  if (!v || v === 'Not Yet Analyzed') return 'not-read'
  if (v === 'No PQC Mechanisms Detected') return 'none'
  if (v === 'Pending Check...') return 'pending'
  if (/potential/i.test(v)) return 'heuristic'
  return 'named'
}

/** PQC algorithm names on the record, split from the ', '-joined string. */
export function pqcNames(pqcCoverage: ComplianceRecord['pqcCoverage'] | undefined): string[] {
  if (pqcCoverageState(pqcCoverage) !== 'named') return []
  return String(pqcCoverage)
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
}

/** Where a record's PQC names come from — the label to show beside them. */
export function pqcEvidenceLabel(type: string): string {
  if (type === 'FIPS 140-3') return "On the certificate's Approved Algorithms list"
  if (type === 'ACVP') return 'NIST CAVP validated algorithms'
  if (isSecurityTargetType(type)) return 'Named in the Security Target'
  return 'PQC mechanisms'
}

/** One-line text describing a record's PQC coverage, for exports and tooltips. */
export function pqcCoverageSummary(record: Pick<ComplianceRecord, 'type' | 'pqcCoverage'>) {
  const state = pqcCoverageState(record.pqcCoverage)
  if (state === 'not-read') return 'Not read (source page could not be read)'
  if (state === 'none') return 'None listed'
  if (state === 'pending') return 'Pending check'
  if (state === 'heuristic') return 'Unconfirmed (name match only)'
  if (state === 'flag') return 'PQC indicated (no algorithm names)'
  return `${pqcEvidenceLabel(record.type)}: ${pqcNames(record.pqcCoverage).join(', ')}`
}

// ── Links ─────────────────────────────────────────────────────────────────

export function cavpValidationUrl(ref: string): string {
  return `https://csrc.nist.gov/projects/cryptographic-algorithm-validation-program/details?validation=${encodeURIComponent(ref)}`
}

// ── Dates ─────────────────────────────────────────────────────────────────

const MONTH_ABBR = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
]

/**
 * '2026-09-25' or an ISO datetime → '25 Sep 2026'. UTC, so a date-only value
 * never shifts a day, and a fixed month table so the output does not depend on
 * the runtime's ICU data ('Sep' vs 'Sept'). Unparseable input is returned as-is.
 */
export function formatIsoDate(iso: string | null | undefined): string | null {
  if (!iso) return null
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return `${d.getUTCDate()} ${MONTH_ABBR[d.getUTCMonth()]} ${d.getUTCFullYear()}`
}

// ── Snapshot scope + retrieval (sidecar) ──────────────────────────────────

export const DEFAULT_SCOPE_NOTICE =
  'FIPS 140-3 modules only (NIST CMVP; FIPS 140-2 is not included) · NIST CAVP validations for selected PQC families (ML-KEM, ML-DSA, SLH-DSA, LMS) · Common Criteria Portal, ANSSI (CC and CSPN) and ENISA EUCC. Not every national certification programme is covered.'

/** Scope notice for the records view and exports; appends the sidecar's exclusion list when present. */
export function scopeNotice(meta: ComplianceMeta | null | undefined): string {
  const excluded = meta?.scope?.excluded?.filter(Boolean) ?? []
  return excluded.length > 0
    ? `${DEFAULT_SCOPE_NOTICE} Excluded: ${excluded.join('; ')}.`
    : DEFAULT_SCOPE_NOTICE
}

export interface RetrievalEntry {
  key: string
  label: string
  retrievedAt: string
  /** Formatted date, e.g. '25 Sep 2026'. */
  date: string
}

const PARTITION_ORDER = ['fips', 'cavp', 'cc', 'anssi', 'eucc']

/** Per-partition snapshot retrieval dates from the sidecar, in a stable order. */
export function snapshotRetrievalEntries(
  meta: ComplianceMeta | null | undefined
): RetrievalEntry[] {
  const partitions = meta?.partitions
  if (!partitions) return []
  const keys = Object.keys(partitions).sort((a, b) => {
    const ia = PARTITION_ORDER.indexOf(a)
    const ib = PARTITION_ORDER.indexOf(b)
    return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib) || a.localeCompare(b)
  })
  const out: RetrievalEntry[] = []
  for (const key of keys) {
    // eslint-disable-next-line security/detect-object-injection
    const p = partitions[key]
    const date = formatIsoDate(p?.retrievedAt)
    if (!p?.retrievedAt || !date) continue
    out.push({ key, label: p.label || key, retrievedAt: p.retrievedAt, date })
  }
  return out
}
