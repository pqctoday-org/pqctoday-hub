// SPDX-License-Identifier: GPL-3.0-only
/**
 * threats-proof-rule.ts — TP-1 + TP-2 + TP-3
 *
 * TP-1  Every active row in the latest quantum_threats_hsm_industries_*.csv
 *       MUST carry a downloadable, on-disk proof file (`local_file`) whose
 *       size is at least MIN_PROOF_BYTES. Rule established 2026-05-21 after
 *       the threats accuracy + proof audit found that ~28% of active rows
 *       had no working proof.
 *
 * TP-2  Every active row's `local_file` MUST point at a path under
 *       public/threats/. (No cross-source contamination.)
 *
 * TP-3  Every non-empty `trusted_source_id` on an active row MUST resolve
 *       to an `id` in the latest pqc_authoritative_sources_reference_*.csv
 *       catalog. Closes the floating-reference gap identified in the
 *       2026-05-21 audit: the catalog now keys on a kebab-case `id`
 *       column (Phase 9), so a programmatic join is finally possible.
 *
 * TP-4  (2026-09-24, ruling R1) Every PUBLISHED row (not deprecated,
 *       obsolete or draft) carries a reviewed `threat_class` of hndl, hnfl
 *       or both — the page no longer guesses the class from keywords.
 *
 * TP-5  (2026-09-24) Every `secondary_source_ref` on a published row names a
 *       library reference_id, and every `column@ref` in `secondary_claims`
 *       names one of the row's own refs — a second source the reader cannot
 *       open, or a claim credited to a document the row does not list, is
 *       a broken lineage link.
 *
 * Severity: ERROR. The cost of letting an unproved threat ship is reader
 * trust — there is no "warning" tier that captures that. Any row that fails
 * either rule should either be re-sourced or marked status='deprecated' per
 * the DS-series rule before the CSV is shipped.
 *
 * Wiring: invoked from scripts/validate-data-integrity.ts alongside the
 * other validator families.
 */

import fs from 'fs'
import path from 'path'
import Papa from 'papaparse'

import type { CheckResult, Finding } from './types.js'
import { datedCsvCompare } from '../lib/latestDatedCsv'

const MIN_PROOF_BYTES = 5_000
// Resolved lazily so callers (and unit tests) can change cwd before invoking.
const dataDir = (): string => path.join(process.cwd(), 'src/data')
// RELOCATED 2026-07-12 (see maintenance/LOCAL-FILES-REMEDIATION-PLAN-07122026.md
// in the private repo) — raw proof documents now live in
// pqctoday-priv/local-evidence-cache/threats/, not public/threats/, and
// local_file values are stored as "threats/X.pdf" (no "public/" prefix).
const localCacheRoot = (): string =>
  path.resolve(process.cwd(), '..', 'pqctoday-priv', 'local-evidence-cache')

interface ThreatRow {
  threat_id?: string
  status?: string
  threat_class?: string
  secondary_source_ref?: string
  secondary_claims?: string
  local_file?: string
  source_url?: string
  deprecated_reason?: string
  industry?: string
  main_source?: string
}

function findLatestThreatsCsv(): string | null {
  if (!fs.existsSync(dataDir())) return null
  const files = fs
    .readdirSync(dataDir())
    .filter((f) => /^quantum_threats_hsm_industries_\d{8}(?:_r\d+)?\.csv$/.test(f))
  if (files.length === 0) return null
  files.sort((a, b) => {
    const parse = (name: string): number => {
      const m = name.match(/quantum_threats_hsm_industries_(\d{2})(\d{2})(\d{4})(?:_r(\d+))?\.csv$/)
      if (!m) return 0
      const [, mm, dd, yyyy, r] = m
      return Number(`${yyyy}${mm}${dd}${(r || '0').padStart(2, '0')}`)
    }
    return parse(b) - parse(a)
  })
  return path.join(dataDir(), files[0])
}

function findLatestSourcesCsv(): string | null {
  if (!fs.existsSync(dataDir())) return null
  const files = fs
    .readdirSync(dataDir())
    .filter((f) => /^pqc_authoritative_sources_reference_\d{8}(?:_r\d+)?\.csv$/.test(f))
  if (files.length === 0) return null
  files.sort((a, b) => {
    const parse = (name: string): number => {
      const m = name.match(
        /pqc_authoritative_sources_reference_(\d{2})(\d{2})(\d{4})(?:_r(\d+))?\.csv$/
      )
      if (!m) return 0
      const [, mm, dd, yyyy, r] = m
      return Number(`${yyyy}${mm}${dd}${(r || '0').padStart(2, '0')}`)
    }
    return parse(b) - parse(a)
  })
  return path.join(dataDir(), files[0])
}

const THREAT_CLASSES = new Set(['hndl', 'hnfl', 'both'])

/** reference_ids of the latest library CSV (empty when none is found). */
function loadLibraryIds(): Set<string> {
  if (!fs.existsSync(dataDir())) return new Set()
  const files = fs.readdirSync(dataDir()).filter((f) => /^library_\d{8}(?:_r\d+)?\.csv$/.test(f))
  if (files.length === 0) return new Set()
  files.sort(datedCsvCompare)
  const rows = Papa.parse<{ reference_id?: string }>(
    fs.readFileSync(path.join(dataDir(), files[files.length - 1]), 'utf-8'),
    { header: true, skipEmptyLines: true }
  ).data
  return new Set(rows.map((r) => (r.reference_id || '').trim()).filter(Boolean))
}

function loadCatalogIds(): Set<string> | null {
  const p = findLatestSourcesCsv()
  if (!p) return null
  const rows = Papa.parse<{ id?: string }>(fs.readFileSync(p, 'utf-8'), {
    header: true,
    skipEmptyLines: true,
  }).data
  // Tolerant: if the latest catalog hasn't had `id` backfilled yet, return
  // null and TP-3 will skip (rather than fail the build during the
  // migration window).
  if (!rows.length || !('id' in rows[0]) || !rows[0].id) return null
  const ids = new Set(rows.map((r) => (r.id || '').trim()).filter(Boolean))
  // UNION with trusted_sources_*.csv (2026-09-23). A trusted_source_id may name
  // either registry — the app resolves getTrustedSource first, then
  // getAuthoritativeSource, and trust-engine-checks.ts loadKnownSourceIds()
  // already checks the union for compliance/timeline. TP-3 read the
  // authoritative file alone, so a row citing a trusted-sources-only id
  // (CROS-008 -> incd-israel, a registered tier-2 government source) failed
  // an ERROR check the page itself resolves without trouble.
  for (const id of loadTrustedSourceIds()) ids.add(id)
  return ids
}

function loadTrustedSourceIds(): string[] {
  if (!fs.existsSync(dataDir())) return []
  const files = fs
    .readdirSync(dataDir())
    .filter((f) => /^trusted_sources_\d{8}(?:_r\d+)?\.csv$/.test(f))
    .sort(datedCsvCompare)
  const latest = files.at(-1)
  if (!latest) return []
  const rows = Papa.parse<{ source_id?: string }>(
    fs.readFileSync(path.join(dataDir(), latest), 'utf-8'),
    { header: true, skipEmptyLines: true }
  ).data
  return rows.map((r) => (r.source_id || '').trim()).filter(Boolean)
}

export function runThreatsProofRule(): CheckResult[] {
  const csvPath = findLatestThreatsCsv()
  if (!csvPath) {
    return [
      {
        id: 'TP-1',
        category: 'local-resource',
        description: 'Every active threat row carries a downloadable, ≥5 KB proof file',
        sourceA: 'quantum_threats_hsm_industries_*.csv',
        sourceB: 'pqctoday-priv/local-evidence-cache/threats/',
        severity: 'ERROR',
        status: 'SKIP',
        findings: [
          {
            csv: '',
            row: null,
            field: '',
            value: '',
            message: 'No quantum_threats_hsm_industries_*.csv found in src/data/',
          },
        ],
      },
    ]
  }

  const raw = fs.readFileSync(csvPath, 'utf-8')
  const rows = Papa.parse<ThreatRow>(raw, { header: true, skipEmptyLines: true }).data
  const csvName = path.basename(csvPath)
  const catalogIds = loadCatalogIds()
  const catalogPath = findLatestSourcesCsv()
  const catalogName = catalogPath ? path.basename(catalogPath) : ''

  const tp1Findings: Finding[] = []
  const tp2Findings: Finding[] = []
  const tp3Findings: Finding[] = []
  const tp4Findings: Finding[] = []
  const tp5Findings: Finding[] = []
  const hasClassColumn = rows.length > 0 && 'threat_class' in rows[0]
  const libraryIds = loadLibraryIds()

  rows.forEach((r, idx) => {
    const status = (r.status || '').trim().toLowerCase()
    if (status === 'deprecated' || status === 'obsolete') return

    const id = (r.threat_id || '').trim()
    const lf = (r.local_file || '').trim()

    // TP-1: validated downloadable proof
    const proofPath = lf ? path.join(localCacheRoot(), lf.replace(/^public\//, '')) : ''
    if (!lf) {
      tp1Findings.push({
        csv: csvName,
        row: idx + 2,
        field: 'local_file',
        value: '',
        message: `Active threat ${id} has no local_file — re-source or mark status='deprecated'`,
      })
    } else if (!fs.existsSync(proofPath)) {
      tp1Findings.push({
        csv: csvName,
        row: idx + 2,
        field: 'local_file',
        value: lf,
        message: `Active threat ${id} references missing file ${lf} (looked in pqctoday-priv/local-evidence-cache/threats/)`,
      })
    } else {
      const size = fs.statSync(proofPath).size
      if (size < MIN_PROOF_BYTES) {
        tp1Findings.push({
          csv: csvName,
          row: idx + 2,
          field: 'local_file',
          value: lf,
          message: `Active threat ${id} proof is ${size}B (< ${MIN_PROOF_BYTES}B floor) — likely a 404/landing stub`,
        })
      }
    }

    // TP-2: proof must live under the threats/ subtree of the local evidence
    // cache (RELOCATED 2026-07-12 — was "public/threats/", no more "public/"
    // prefix since raw documents moved to pqctoday-priv/local-evidence-cache/).
    if (lf && !lf.replace(/^\.\//, '').startsWith('threats/')) {
      tp2Findings.push({
        csv: csvName,
        row: idx + 2,
        field: 'local_file',
        value: lf,
        message: `Active threat ${id} local_file is outside the threats/ evidence-cache subtree`,
      })
    }

    if (status !== 'draft') {
      // TP-4: a reviewed class on every published row
      const cls = (r.threat_class || '').trim().toLowerCase()
      if (hasClassColumn && !THREAT_CLASSES.has(cls)) {
        tp4Findings.push({
          csv: csvName,
          row: idx + 2,
          field: 'threat_class',
          value: r.threat_class || '',
          message: `Published threat ${id} has no reviewed threat_class (hndl | hnfl | both)`,
        })
      }
      // TP-5: second sources resolve to library rows; claims credit listed refs
      const refs = (r.secondary_source_ref || '')
        .split(';')
        .map((x) => x.trim())
        .filter(Boolean)
      for (const ref of refs) {
        if (!libraryIds.has(ref)) {
          tp5Findings.push({
            csv: csvName,
            row: idx + 2,
            field: 'secondary_source_ref',
            value: ref,
            message: `Threat ${id} second source "${ref}" is not a library reference_id`,
          })
        }
      }
      for (const part of (r.secondary_claims || '').split(';').map((x) => x.trim())) {
        const at = part.indexOf('@')
        if (at >= 0 && !refs.includes(part.slice(at + 1).trim())) {
          tp5Findings.push({
            csv: csvName,
            row: idx + 2,
            field: 'secondary_claims',
            value: part,
            message: `Threat ${id} credits a claim to "${part.slice(at + 1).trim()}", which is not in its secondary_source_ref`,
          })
        }
      }
      if ((r.secondary_claims || '').trim() && refs.length === 0) {
        tp5Findings.push({
          csv: csvName,
          row: idx + 2,
          field: 'secondary_claims',
          value: r.secondary_claims || '',
          message: `Threat ${id} lists second-source claims but no secondary_source_ref`,
        })
      }
    }

    // TP-3: trusted_source_id must resolve to the catalog (when catalog
    // is keyed on `id`; otherwise the check is skipped, see below).
    if (catalogIds) {
      const tsid = (r.trusted_source_id || '').trim()
      if (tsid && !catalogIds.has(tsid)) {
        tp3Findings.push({
          csv: csvName,
          row: idx + 2,
          field: 'trusted_source_id',
          value: tsid,
          message: `Active threat ${id} trusted_source_id="${tsid}" does not resolve to any id in ${catalogName}`,
        })
      }
    }
  })

  const results: CheckResult[] = [
    {
      id: 'TP-1',
      category: 'local-resource',
      description: `Every active threat carries a downloadable proof ≥ ${MIN_PROOF_BYTES} bytes`,
      sourceA: csvName,
      sourceB: 'pqctoday-priv/local-evidence-cache/threats/',
      severity: 'ERROR',
      status: tp1Findings.length === 0 ? 'PASS' : 'FAIL',
      findings: tp1Findings,
    },
    {
      id: 'TP-2',
      category: 'local-resource',
      description: 'Threat local_file paths must live under public/threats/',
      sourceA: csvName,
      sourceB: 'pqctoday-priv/local-evidence-cache/threats/',
      severity: 'ERROR',
      status: tp2Findings.length === 0 ? 'PASS' : 'FAIL',
      findings: tp2Findings,
    },
  ]

  results.push(
    {
      id: 'TP-4',
      category: 'structure',
      description: 'Every published threat carries a reviewed threat_class (hndl | hnfl | both)',
      sourceA: csvName,
      sourceB: csvName,
      severity: 'ERROR',
      status: !hasClassColumn ? 'SKIP' : tp4Findings.length === 0 ? 'PASS' : 'FAIL',
      findings: tp4Findings,
    },
    {
      id: 'TP-5',
      category: 'cross-reference',
      description:
        'Every second source a threat names is a library row, and credits only its own refs',
      sourceA: csvName,
      sourceB: 'library_*.csv',
      severity: 'ERROR',
      status: tp5Findings.length === 0 ? 'PASS' : 'FAIL',
      findings: tp5Findings,
    }
  )

  // TP-3 only runs when the catalog has been migrated to the `id`
  // primary key (Phase 9, 2026-05-21). During the migration window the
  // check skips with status SKIP so it neither falsely passes nor
  // blocks the build before the schema fix lands in other CSVs.
  if (catalogIds) {
    results.push({
      id: 'TP-3',
      category: 'cross-reference',
      description:
        'Every active threat trusted_source_id resolves to a trusted-sources or authoritative-sources id',
      sourceA: csvName,
      sourceB: catalogName,
      severity: 'ERROR',
      status: tp3Findings.length === 0 ? 'PASS' : 'FAIL',
      findings: tp3Findings,
    })
  } else {
    results.push({
      id: 'TP-3',
      category: 'cross-reference',
      description:
        'Every active threat trusted_source_id resolves to a trusted-sources or authoritative-sources id',
      sourceA: csvName,
      sourceB: 'pqc_authoritative_sources_reference_*.csv',
      severity: 'ERROR',
      status: 'SKIP',
      findings: [
        {
          csv: catalogName || '',
          row: null,
          field: '',
          value: '',
          message:
            'Catalog has not yet been migrated to the `id` primary key (Phase 9); TP-3 will fail closed once it is.',
        },
      ],
    })
  }

  return results
}
