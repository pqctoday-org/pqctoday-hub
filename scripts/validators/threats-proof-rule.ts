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

const MIN_PROOF_BYTES = 5_000
const DATA_DIR = path.join(process.cwd(), 'src/data')

interface ThreatRow {
  threat_id?: string
  status?: string
  local_file?: string
  source_url?: string
  deprecated_reason?: string
  industry?: string
  main_source?: string
}

function findLatestThreatsCsv(): string | null {
  if (!fs.existsSync(DATA_DIR)) return null
  const files = fs
    .readdirSync(DATA_DIR)
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
  return path.join(DATA_DIR, files[0])
}

function findLatestSourcesCsv(): string | null {
  if (!fs.existsSync(DATA_DIR)) return null
  const files = fs
    .readdirSync(DATA_DIR)
    .filter((f) => /^pqc_authoritative_sources_reference_\d{8}(?:_r\d+)?\.csv$/.test(f))
  if (files.length === 0) return null
  files.sort((a, b) => {
    const parse = (name: string): number => {
      const m = name.match(
        /pqc_authoritative_sources_reference_(\d{2})(\d{2})(\d{4})(?:_r(\d+))?\.csv$/,
      )
      if (!m) return 0
      const [, mm, dd, yyyy, r] = m
      return Number(`${yyyy}${mm}${dd}${(r || '0').padStart(2, '0')}`)
    }
    return parse(b) - parse(a)
  })
  return path.join(DATA_DIR, files[0])
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
  return new Set(rows.map((r) => (r.id || '').trim()).filter(Boolean))
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
        sourceB: 'public/threats/',
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

  rows.forEach((r, idx) => {
    const status = (r.status || '').trim().toLowerCase()
    if (status === 'deprecated' || status === 'obsolete') return

    const id = (r.threat_id || '').trim()
    const lf = (r.local_file || '').trim()

    // TP-1: validated downloadable proof
    if (!lf) {
      tp1Findings.push({
        csv: csvName,
        row: idx + 2,
        field: 'local_file',
        value: '',
        message: `Active threat ${id} has no local_file — re-source or mark status='deprecated'`,
      })
    } else if (!fs.existsSync(lf)) {
      tp1Findings.push({
        csv: csvName,
        row: idx + 2,
        field: 'local_file',
        value: lf,
        message: `Active threat ${id} references missing file ${lf}`,
      })
    } else {
      const size = fs.statSync(lf).size
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

    // TP-2: proof must live under public/threats/
    if (lf && !lf.replace(/^\.\//, '').startsWith('public/threats/')) {
      tp2Findings.push({
        csv: csvName,
        row: idx + 2,
        field: 'local_file',
        value: lf,
        message: `Active threat ${id} local_file is outside public/threats/`,
      })
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
      sourceB: 'public/threats/',
      severity: 'ERROR',
      status: tp1Findings.length === 0 ? 'PASS' : 'FAIL',
      findings: tp1Findings,
    },
    {
      id: 'TP-2',
      category: 'local-resource',
      description: 'Threat local_file paths must live under public/threats/',
      sourceA: csvName,
      sourceB: 'public/threats/',
      severity: 'ERROR',
      status: tp2Findings.length === 0 ? 'PASS' : 'FAIL',
      findings: tp2Findings,
    },
  ]

  // TP-3 only runs when the catalog has been migrated to the `id`
  // primary key (Phase 9, 2026-05-21). During the migration window the
  // check skips with status SKIP so it neither falsely passes nor
  // blocks the build before the schema fix lands in other CSVs.
  if (catalogIds) {
    results.push({
      id: 'TP-3',
      category: 'cross-reference',
      description: 'Every active threat trusted_source_id resolves to the authoritative-sources catalog id',
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
      description: 'Every active threat trusted_source_id resolves to the authoritative-sources catalog id',
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
