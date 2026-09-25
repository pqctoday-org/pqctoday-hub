// SPDX-License-Identifier: GPL-3.0-only
// @vitest-environment node
/**
 * CM-G checks applicable_industries_normalized against the slug vocabulary the
 * threats data uses. Before 2026-09-23 it only accepted NAICS / PQC-* codes, so
 * it flagged every value the column actually holds and carried no signal.
 * In-memory fixtures only — the real CSV is never edited.
 */
import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import Papa from 'papaparse'
import { glob } from 'glob'
import { cmgFindings } from '../trust-engine-checks.js'
import { datedCsvCompare } from '../../lib/latestDatedCsv'

const row = (id: string, slugs: string) => ({
  threat_id: id,
  applicable_industries_normalized: slugs,
})

describe('CM-G: threats industry-slug vocabulary', () => {
  it('accepts the slugs the data uses, NAICS codes, PQC-* overlays and empty cells', () => {
    const findings = cmgFindings(
      [
        row('T-1', 'financial-services;banking'),
        row('T-2', 'cross-industry'),
        row('T-3', '52;PQC-FIN-CORE'),
        row('T-4', ''),
      ],
      'fixture.csv'
    )
    expect(findings).toEqual([])
  })

  it('flags an injected unknown slug, naming the row and the slug', () => {
    const findings = cmgFindings(
      [row('T-1', 'healthcare;pharmaceuticals'), row('T-2', 'water-wastewater')],
      'fixture.csv'
    )
    expect(findings.map((f) => [f.value, f.message.match(/slug '([^']+)'/)?.[1]])).toEqual([
      ['T-1', 'pharmaceuticals'],
      ['T-2', 'water-wastewater'],
    ])
  })

  it('on the real latest CSV, flags nothing but slugs outside the vocabulary (no blanket findings)', async () => {
    const files = (await glob('src/data/quantum_threats_hsm_industries_*.csv')).sort(
      datedCsvCompare
    )
    const latest = files.at(-1)!
    const rows = Papa.parse<Record<string, string>>(fs.readFileSync(latest, 'utf-8'), {
      header: true,
      skipEmptyLines: true,
    }).data
    const tagged = rows.filter((r) => (r.applicable_industries_normalized ?? '').trim())
    const findings = cmgFindings(rows, latest)
    // The old regex flagged every tagged row; the vocabulary check must not.
    expect(findings.length).toBeLessThan(tagged.length / 10)
  })
})
