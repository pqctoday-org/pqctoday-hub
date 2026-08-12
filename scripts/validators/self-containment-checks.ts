// SPDX-License-Identifier: GPL-3.0-only
/**
 * self-containment-checks.ts — DS03 / DS19 / DS19-VOCAB / DS20
 *
 * Implemented 2026-07-09 (data-pipelines remediation, WP1.1). The original
 * module referenced by validate-data-integrity.ts was never committed and had
 * no recoverable git history (see the 07-07 stub this file replaces), so these
 * checks are defined from the repo's actual, documented CSV lifecycle rules:
 *
 *   DS03  Self-containment: every dated snapshot is cut from the genuine
 *         previous generation — a key present in the previous file must still
 *         exist in the latest one (active or deprecated). Rows are never
 *         silently dropped; retirement is an explicit status change.
 *   DS19  Status column integrity: status ∈ {active, deprecated}; a
 *         deprecated row must carry deprecated_at + deprecated_reason.
 *   DS19-VOCAB  Controlled vocabularies on shared provenance columns:
 *         peer_reviewed ∈ {yes, no, partial, ''} and source_url_quality ∈
 *         {url_authoritative, url_needs_review, url_unverified, ''}.
 *   DS20  Restore integrity: a row that flips deprecated → active between
 *         generations must show new proof (local_file / proof_url / SourceUrl)
 *         — deprecation-for-lost-proof may only be reversed with real proof.
 *   DS21  Revision-chain integrity: a deprecated row's superseded_by must
 *         resolve directly to a row with status='active'. The UI
 *         (attachPriorRevisions in libraryData.ts) only resolves ONE hop
 *         against active rows — a chain of deprecated rows pointing at each
 *         other never surfaces as a "PREVIOUS REVISIONS" tile. Added
 *         2026-07-11 after PKCS11's current OASIS Standard (v3.2, finalized
 *         2026-06-03) was found deprecated with no superseded_by at all —
 *         invisible in the UI — while two other rows describing older
 *         revisions stood as separate, wrongly-labeled active tiles. A sweep
 *         of the rest of library_*.csv found 22 more rows whose own
 *         deprecated_reason already named a real successor that was never
 *         linked via superseded_by; nothing in the maintainer-agent toolset
 *         reads or writes this column today (confirmed by grep — it is
 *         purely hand-maintained), so this check is the only thing that
 *         will catch a repeat.
 *   DS21-CANDIDATES  Non-blocking companion to DS21: deprecated rows with an
 *         EMPTY superseded_by whose deprecated_reason text names another
 *         in-CSV reference_id. Most of these are legitimate no-successor
 *         retirements (a dead vendor blog link, a withdrawn whitepaper) —
 *         the reason just happens to mention a sibling row for context, not
 *         as a successor. Reported as INFO for human triage, never ERROR.
 *
 * The patents family is deliberately not covered here: its lifecycle is
 * enforced by the patents pipeline itself (pqctoday-priv/patents).
 */

import fs from 'fs'
import path from 'path'
import Papa from 'papaparse'
import { getDataDir } from './data-loader.js'
import type { CheckResult, Finding } from './types.js'

type Row = Record<string, string>

interface Family {
  prefix: string
  /** Key column(s); multiple columns form a composite key. */
  key: string[]
  /** Column holding proof/source evidence, for the DS20 restore rule. */
  proofColumns?: string[]
}

const FAMILIES: Family[] = [
  { prefix: 'library_', key: ['reference_id'], proofColumns: ['local_file', 'url'] },
  { prefix: 'compliance_', key: ['id'], proofColumns: ['url'] },
  { prefix: 'quantum_threats_hsm_industries_', key: ['threat_id'], proofColumns: ['local_file'] },
  {
    // Keyed on the composite Country+OrgName+Title until 2026-07-16 (timeline
    // maintainer-process remediation Phase 3) — meaning a Title correction (or
    // a jurisdiction-encoding fix, e.g. "MY"→"Malaysia") tripped DS03 as if the
    // row had been silently dropped, even though nothing was lost. `event_id`
    // (added the same remediation, sacred from mint) is a real stable ID
    // independent of Title/Country/OrgName edits — the same problem class
    // DS21's superseded_by chain already solves for library. One-time gap:
    // the 07152026 generation predates event_id, so this generation's DS03
    // diff trivially passes (empty key on both sides is skipped by the
    // `k.replaceAll('|','') === ''` guard below) rather than comparing
    // anything meaningful — self-resolves on the next dated snapshot, since
    // every generation from 07162026 onward carries event_id.
    prefix: 'timeline_',
    key: ['event_id'],
    proofColumns: ['local_file', 'SourceUrl'],
  },
  { prefix: 'pqc_product_catalog_', key: ['product_id'], proofColumns: ['proof_url'] },
  { prefix: 'vendors_', key: ['vendor_id'] },
  { prefix: 'leaders_', key: ['Name'] },
]

const VALID_STATUS = new Set(['active', 'deprecated'])
const VALID_PEER_REVIEWED = new Set(['yes', 'no', 'partial', ''])
const VALID_URL_QUALITY = new Set(['url_authoritative', 'url_needs_review', 'url_unverified', ''])

interface Generation {
  file: string
  rows: Row[]
}

/** The two most recent dated generations of a family (latest first). */
function latestGenerations(prefix: string, count: number): Generation[] {
  const dir = getDataDir()
  const parsed = fs
    .readdirSync(dir)
    .filter((f) => f.startsWith(prefix))
    .map((f) => {
      const m = f.match(/_(\d{2})(\d{2})(\d{4})(?:_r(\d+))?\.csv$/)
      if (!m) return null
      return {
        file: f,
        key: `${m[3]}-${m[1]}-${m[2]}#${String(Number(m[4] ?? 0)).padStart(3, '0')}`,
      }
    })
    .filter((p): p is { file: string; key: string } => p !== null)
    .sort((a, b) => b.key.localeCompare(a.key))
    .slice(0, count)
  return parsed.map(({ file }) => ({
    file,
    rows: Papa.parse<Row>(fs.readFileSync(path.join(dir, file), 'utf-8').trim(), {
      header: true,
      skipEmptyLines: true,
    }).data,
  }))
}

function rowKey(row: Row, key: string[]): string {
  return key.map((k) => (row[k] ?? '').trim()).join('|')
}

function check(
  id: string,
  description: string,
  sourceA: string,
  severity: CheckResult['severity'],
  findings: Finding[]
): CheckResult {
  return {
    id,
    category: 'structure',
    description,
    sourceA,
    sourceB: null,
    severity,
    status: findings.length === 0 ? 'PASS' : 'FAIL',
    findings,
  }
}

export function runSelfContainmentChecks(): CheckResult[] {
  const findings: Finding[] = []
  for (const fam of FAMILIES) {
    const gens = latestGenerations(fam.prefix, 2)
    if (gens.length < 2) continue
    const [latest, previous] = gens
    const latestKeys = new Set(latest.rows.map((r) => rowKey(r, fam.key)))
    previous.rows.forEach((r, i) => {
      const k = rowKey(r, fam.key)
      if (k.replaceAll('|', '') === '') return
      if (!latestKeys.has(k)) {
        findings.push({
          csv: latest.file,
          row: i + 2,
          field: fam.key.join('|'),
          value: k,
          message: `Row present in ${previous.file} is missing from ${latest.file} — rows must be deprecated, never dropped`,
        })
      }
    })
  }
  return [
    check(
      'DS03',
      'Self-containment: latest snapshot carries every key from the previous generation',
      'dated CSV families',
      'ERROR',
      findings
    ),
  ]
}

export function runStatusColumnChecks(): CheckResult[] {
  const findings: Finding[] = []
  for (const fam of FAMILIES) {
    const [latest] = latestGenerations(fam.prefix, 1)
    if (!latest || latest.rows.length === 0 || !('status' in latest.rows[0])) continue
    latest.rows.forEach((r, i) => {
      const status = (r.status ?? '').trim()
      if (!VALID_STATUS.has(status)) {
        findings.push({
          csv: latest.file,
          row: i + 2,
          field: 'status',
          value: status,
          message: `status must be 'active' or 'deprecated'`,
        })
        return
      }
      if (status === 'deprecated') {
        if (!(r.deprecated_at ?? '').trim())
          findings.push({
            csv: latest.file,
            row: i + 2,
            field: 'deprecated_at',
            value: '',
            message: 'deprecated row is missing deprecated_at',
          })
        if (!(r.deprecated_reason ?? '').trim())
          findings.push({
            csv: latest.file,
            row: i + 2,
            field: 'deprecated_reason',
            value: '',
            message: 'deprecated row is missing deprecated_reason',
          })
      }
    })
  }
  return [
    check(
      'DS19',
      'Status column integrity: active|deprecated enum + deprecation metadata',
      'dated CSV families',
      'ERROR',
      findings
    ),
  ]
}

export function runVocabTagChecks(): CheckResult[] {
  const findings: Finding[] = []
  for (const fam of FAMILIES) {
    const [latest] = latestGenerations(fam.prefix, 1)
    if (!latest || latest.rows.length === 0) continue
    const cols = Object.keys(latest.rows[0])
    latest.rows.forEach((r, i) => {
      if (cols.includes('peer_reviewed')) {
        const v = (r.peer_reviewed ?? '').trim()
        if (!VALID_PEER_REVIEWED.has(v))
          findings.push({
            csv: latest.file,
            row: i + 2,
            field: 'peer_reviewed',
            value: v,
            message: `peer_reviewed must be yes|no|partial|'' (got '${v}')`,
          })
      }
      if (cols.includes('source_url_quality')) {
        const v = (r.source_url_quality ?? '').trim()
        if (!VALID_URL_QUALITY.has(v))
          findings.push({
            csv: latest.file,
            row: i + 2,
            field: 'source_url_quality',
            value: v,
            message: `source_url_quality must be url_authoritative|url_needs_review|url_unverified|'' (got '${v}')`,
          })
      }
    })
  }
  return [
    check(
      'DS19-VOCAB',
      'Controlled vocabulary: peer_reviewed + source_url_quality canonical values',
      'dated CSV families',
      'ERROR',
      findings
    ),
  ]
}

export function runOrphanCheck(): CheckResult[] {
  const findings: Finding[] = []
  for (const fam of FAMILIES) {
    const gens = latestGenerations(fam.prefix, 2)
    if (gens.length < 2) continue
    const [latest, previous] = gens
    const prevStatus = new Map(
      previous.rows.map((r) => [rowKey(r, fam.key), (r.status ?? '').trim()])
    )
    latest.rows.forEach((r, i) => {
      const k = rowKey(r, fam.key)
      if ((r.status ?? '').trim() !== 'active') return
      if (prevStatus.get(k) !== 'deprecated') return
      const hasProof = (fam.proofColumns ?? []).some((c) => (r[c] ?? '').trim() !== '')
      if (!hasProof)
        findings.push({
          csv: latest.file,
          row: i + 2,
          field: 'status',
          value: k,
          message: `Row was deprecated in ${previous.file} and re-activated without proof (${(fam.proofColumns ?? []).join('/')} all empty) — re-activation requires real proof`,
        })
    })
  }
  return [
    check(
      'DS20',
      'Restore integrity: deprecated → active flips carry new proof',
      'dated CSV families',
      'WARNING',
      findings
    ),
  ]
}

export function runSupersededByChecks(): CheckResult[] {
  const findings: Finding[] = []
  for (const fam of FAMILIES) {
    const [latest] = latestGenerations(fam.prefix, 1)
    if (!latest || latest.rows.length === 0 || !('superseded_by' in latest.rows[0])) continue
    const idCol = fam.key[0]
    const byId = new Map(latest.rows.map((r) => [(r[idCol] ?? '').trim(), r]))
    latest.rows.forEach((r, i) => {
      const target = (r.superseded_by ?? '').trim()
      if (!target) return
      const targetRow = byId.get(target)
      if (!targetRow) {
        findings.push({
          csv: latest.file,
          row: i + 2,
          field: 'superseded_by',
          value: target,
          message: `superseded_by references '${target}', which does not exist in ${latest.file}`,
        })
        return
      }
      if ((targetRow.status ?? '').trim() !== 'active') {
        findings.push({
          csv: latest.file,
          row: i + 2,
          field: 'superseded_by',
          value: target,
          message: `superseded_by points at '${target}', which is itself status='${(targetRow.status ?? '').trim()}' — the UI only resolves one hop against an active row, so this revision will never attach to a tile. Point superseded_by directly at the current active row.`,
        })
      }
    })
  }
  return [
    check(
      'DS21',
      'Revision-chain integrity: superseded_by resolves directly to an active row (single-hop)',
      'dated CSV families',
      'ERROR',
      findings
    ),
  ]
}

export function runSupersededByCandidateChecks(): CheckResult[] {
  const findings: Finding[] = []
  for (const fam of FAMILIES) {
    const [latest] = latestGenerations(fam.prefix, 1)
    if (!latest || latest.rows.length === 0 || !('superseded_by' in latest.rows[0])) continue
    const idCol = fam.key[0]
    const allIds = latest.rows
      .map((r) => (r[idCol] ?? '').trim())
      .filter((id) => id.length >= 4)
      .sort((a, b) => b.length - a.length) // longest first — avoid substring false-positives
    latest.rows.forEach((r, i) => {
      const status = (r.status ?? '').trim()
      const supersededBy = (r.superseded_by ?? '').trim()
      const reason = (r.deprecated_reason ?? '').trim()
      if (status !== 'deprecated' || supersededBy || !reason) return
      const rowId = (r[idCol] ?? '').trim()
      const mentioned = allIds.find((id) => id !== rowId && reason.includes(id))
      if (mentioned) {
        findings.push({
          csv: latest.file,
          row: i + 2,
          field: 'deprecated_reason',
          value: mentioned,
          message: `deprecated_reason mentions '${mentioned}' but superseded_by is empty — verify whether this is a real successor (then link it) or just a contextual mention (then leave as-is)`,
        })
      }
    })
  }
  return [
    check(
      'DS21-CANDIDATES',
      'Unlinked revision-chain candidates — deprecated_reason names a sibling row not reflected in superseded_by (human triage)',
      'dated CSV families',
      'INFO',
      findings
    ),
  ]
}

/**
 * DS22-DOCTYPE — library `document_type` against its agreed vocabulary.
 *
 * ADDED 2026-08-10. The column had grown to 92 distinct values across 804
 * active rows, 38 of them used exactly once, with `Specification` and
 * `specification` both present and Internet-Draft spelled three ways. That
 * happens one row at a time: someone adds an entry, types a plausible label,
 * and nothing objects. This objects.
 *
 * Scoped to ACTIVE rows on purpose — deprecated rows are carried forward
 * verbatim for self-containment, and five of them predate the column being
 * curated at all. Making them pass would mean inventing a type for a row
 * nobody reviewed.
 *
 * The same ten strings are the keys of `DOCUMENT_TYPE_DESCRIPTIONS` in
 * `src/components/Library/LibraryDetailPopover.tsx`; `documentTypeVocab.test.ts`
 * asserts the two lists stay identical, so a value can never be storable but
 * unexplained, or explained but unstorable.
 */
export const DOCUMENT_TYPE_VOCAB = [
  'Standard',
  'RFC',
  'Internet-Draft',
  'Regulation',
  'Government Guidance',
  'Compliance Framework',
  'Research Paper',
  'Industry Report',
  'Article',
  'Reference',
] as const

export function runDocumentTypeVocabChecks(): CheckResult[] {
  const allowed = new Set<string>(DOCUMENT_TYPE_VOCAB)
  const findings: Finding[] = []
  const [latest] = latestGenerations('library_', 1)
  if (latest && latest.rows.length > 0) {
    latest.rows.forEach((r, i) => {
      const status = (r.status ?? 'active').trim().toLowerCase()
      if (status === 'deprecated') return
      const v = (r.document_type ?? '').trim()
      if (!allowed.has(v)) {
        findings.push({
          csv: latest.file,
          row: i + 2,
          field: 'document_type',
          value: v,
          message: `document_type must be one of ${DOCUMENT_TYPE_VOCAB.join(' | ')} (got '${v}')`,
        })
      }
    })
  }
  return [
    check(
      'DS22-DOCTYPE',
      'Controlled vocabulary: library document_type',
      'src/data/library_*.csv',
      'ERROR',
      findings
    ),
  ]
}
