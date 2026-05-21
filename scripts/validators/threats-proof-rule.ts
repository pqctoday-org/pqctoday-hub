// SPDX-License-Identifier: GPL-3.0-only
/**
 * threats-proof-rule.ts — TP-1 + TP-2
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

  const tp1Findings: Finding[] = []
  const tp2Findings: Finding[] = []

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
  })

  return [
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
}
