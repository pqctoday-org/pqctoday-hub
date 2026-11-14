// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Freshness of the shipped coverage projections. The page reads
 * public/data/validation/coverage-matrix.json; the generated copy in src must
 * agree with it and with the model and curated register it was built from.
 * These fail on a stale projection and pass once the outputs are regenerated.
 */
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { MATRIX_RULES, buildCoverageMatrix, unsupportedCellsGapTitle } from './coverageModel'
import { fixtureInputs } from './coverageFixture'
import openGaps from './open-gaps.json'

type Gap = { id: string; title: string; detail: string }
type Projection = {
  rules: Record<string, string>
  totals: {
    rows: number
    byEngine: Record<string, { advertisedCells: number; unsupportedCells: number }>
  }
  openGaps: Gap[]
}

// Fixed repository paths only, relative to this file.
const readRepoJson = <T>(rel: string): T =>
  // eslint-disable-next-line security/detect-non-literal-fs-filename
  JSON.parse(readFileSync(fileURLToPath(new URL(rel, import.meta.url)), 'utf8')) as T
const load = (rel: string): Projection => readRepoJson<Projection>(rel)

const projections = {
  'public/data/validation/coverage-matrix.json': load(
    '../../../public/data/validation/coverage-matrix.json'
  ),
  'src/data/validation/coverage-matrix.generated.json': load('./coverage-matrix.generated.json'),
}

const curated = (openGaps.gaps as Gap[]).find((g) => g.id === 'run-results-partial')!

describe.each(Object.entries(projections))('coverage projection %s is fresh', (_name, file) => {
  it('carries the rules the model prints', () => {
    expect(file.rules).toEqual({ ...MATRIX_RULES })
  })

  it('titles the unsupported-cells gap as the model does, from the same count', () => {
    const { byEngine } = file.totals
    const unsupported = Object.values(byEngine).reduce((n, e) => n + e.unsupportedCells, 0)
    const gap = file.openGaps.find((g) => g.id === 'unsupported-cells')
    expect(gap?.title).toBe(unsupportedCellsGapTitle(unsupported))
    // ...and the model itself produces that title for its own unsupported count
    const built = buildCoverageMatrix(fixtureInputs()).matrix.openGaps.find(
      (g) => g.id === 'unsupported-cells'
    )
    expect(built?.title).toBe(unsupportedCellsGapTitle(6))
  })

  it('carries the run-results entry exactly as the curated register states it', () => {
    const entry = file.openGaps.find((g) => g.id === 'run-results-partial')
    expect(entry?.detail).toBe(curated.detail)
    expect(entry?.title).toBe(curated.title)
  })

  it('counts every row once per engine: advertised plus unsupported equals the row count, and the unsupported gap is 40', () => {
    const { rows, byEngine } = file.totals
    expect(rows).toBe(2243)
    expect(byEngine.cpp.advertisedCells + byEngine.cpp.unsupportedCells).toBe(rows)
    expect(byEngine.rust.advertisedCells + byEngine.rust.unsupportedCells).toBe(rows)
    expect([byEngine.cpp.advertisedCells, byEngine.rust.advertisedCells]).toEqual([2211, 2235])
    expect([byEngine.cpp.unsupportedCells, byEngine.rust.unsupportedCells]).toEqual([32, 8])
    const gap = file.openGaps.find((g) => g.id === 'unsupported-cells')
    expect(gap?.title.startsWith('40 unsupported')).toBe(true)
  })
})

// The run totals the curated register quotes must be the tally of the recorded run files.
describe('recorded run totals agree with the register', () => {
  const runFiles = [
    '../../../src/data/validation/run-results/wasm-node-errorPathProbes.json',
    '../../../src/data/validation/run-results/wasm-node-katRunner.json',
    '../../../src/data/validation/run-results/wasm-node-useAcvpSuite.json',
  ]
  const tally = runFiles.reduce(
    (t, rel) => {
      const doc = readRepoJson<{ results: { status: string }[] }>(rel)
      t.results += doc.results.length
      for (const r of doc.results) {
        if (r.status === 'pass') t.pass += 1
        else if (r.status === 'fail') t.fail += 1
        else if (r.status === 'skip') t.skip += 1
      }
      return t
    },
    { results: 0, pass: 0, fail: 0, skip: 0 }
  )

  it('tallies 19,176 results: 19,043 pass, 44 fail, 89 skip', () => {
    expect(tally).toEqual({ results: 19176, pass: 19043, fail: 44, skip: 89 })
  })

  it('states the same four numbers in the curated run-results detail', () => {
    const quoted = curated.detail.match(/(\d+) results, (\d+) pass, (\d+) fail, (\d+) skip/)
    expect(quoted).not.toBeNull()
    expect(quoted!.slice(1).map(Number)).toEqual([
      tally.results,
      tally.pass,
      tally.fail,
      tally.skip,
    ])
  })
})
