// SPDX-License-Identifier: GPL-3.0-only
/**
 * `algorithm_id` — the stable key `?algo=` deep links use (added 09292026).
 * Guards the wired CSV's column against the slug scheme the loader, the
 * mobile sheet and AlgoCtaStrip compute from a name, so the two can never
 * disagree, and checks the resolver's id-then-name fallback.
 */
import { describe, it, expect } from 'vitest'
import { readdirSync, readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import Papa from 'papaparse'
import { algorithmIdFromName, findAlgorithmByRef, loadPQCAlgorithmsData } from './pqcAlgorithmsData'

const dataDir = dirname(fileURLToPath(import.meta.url))

/** The snapshot the loader picks: latest date, then highest _rN. */
function wiredCsvRows(): Record<string, string>[] {
  const [latest] = readdirSync(dataDir)
    .map((f) => ({ f, m: f.match(/^pqc_complete_algorithm_reference_(\d{8})(?:_r(\d+))?\.csv$/) }))
    .filter((x): x is { f: string; m: RegExpMatchArray } => !!x.m)
    .map(({ f, m }) => ({
      f,
      key: `${m[1].slice(4)}${m[1].slice(0, 4)}${(m[2] ?? '0').padStart(3, '0')}`,
    }))
    .sort((a, b) => b.key.localeCompare(a.key))
  const { data } = Papa.parse<Record<string, string>>(
    readFileSync(join(dataDir, latest.f), 'utf-8').trim(),
    { header: true, skipEmptyLines: true }
  )
  return data
}

describe('algorithmIdFromName', () => {
  it.each([
    ['ML-KEM-768', 'ml-kem-768'],
    ['FN-DSA-512', 'fn-dsa-512'],
    ['LMS-SHA256 (H20/W8)', 'lms-sha256-h20-w8'],
    ['ECDSA P-256', 'ecdsa-p-256'],
    ['NTRU+-768', 'ntru-plus-768'],
    ['XMSS-SHA2_20', 'xmss-sha2-20'],
  ])('%s → %s', (name, id) => {
    expect(algorithmIdFromName(name)).toBe(id)
  })
})

describe('wired reference CSV — algorithm_id column', () => {
  const rows = wiredCsvRows()

  it('every row carries the slug of its own algorithm name', () => {
    expect(rows.length).toBeGreaterThan(100)
    for (const r of rows) expect(r.algorithm_id, r.algorithm).toBe(algorithmIdFromName(r.algorithm))
  })

  it('ids are unique', () => {
    const ids = rows.map((r) => r.algorithm_id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('the loader exposes it as AlgorithmDetail.id', async () => {
    const data = await loadPQCAlgorithmsData()
    expect(findAlgorithmByRef(data, 'ml-kem-768')?.name).toBe('ML-KEM-768')
    expect(data.every((a) => a.id === algorithmIdFromName(a.name))).toBe(true)
  })
})

describe('findAlgorithmByRef', () => {
  const list = [
    { id: 'ml-kem-768', name: 'ML-KEM-768' },
    { id: 'ml-kem-768-ecdh-p256', name: 'ML-KEM-768-ECDH-P256' },
  ]
  it('resolves the stable id', () => {
    expect(findAlgorithmByRef(list, 'ml-kem-768')?.name).toBe('ML-KEM-768')
  })
  it('falls back to an exact, case-insensitive name (never a substring)', () => {
    expect(findAlgorithmByRef(list, 'ml-KEM-768')?.name).toBe('ML-KEM-768')
    expect(findAlgorithmByRef(list, 'ML-KEM')).toBeUndefined()
  })
  it('returns undefined for empty or unknown refs', () => {
    expect(findAlgorithmByRef(list, null)).toBeUndefined()
    expect(findAlgorithmByRef(list, 'falcon-512')).toBeUndefined()
  })
})
