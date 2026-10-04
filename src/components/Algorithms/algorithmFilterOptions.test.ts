// SPDX-License-Identifier: GPL-3.0-only
/**
 * The filter values the Algorithms page offers are also the values the PQC
 * Assistant puts in its links (promptBuilder.ts reads them from
 * algorithmFilterOptions.ts). The page compares them with exact strings, so a
 * value that is only nearly right — `fn=kem` for the function `KEM`, or a level
 * that is not offered — selects nothing and the reader sees an empty table.
 * These tests run the page's own filter predicates over the real data.
 */
import { describe, it, expect, beforeAll } from 'vitest'
import {
  CRYPTO_FAMILY_ITEMS,
  FUNCTION_ITEMS,
  LEVEL_ITEMS,
  REGION_ITEMS,
  STATUS_ITEMS,
} from './algorithmFilterOptions'
import {
  passesAlgoFilterState,
  passesTransitionFilterState,
  WIDE_OPEN_FILTERS,
  type ExplorerFilterState,
} from './useAlgorithmExplorer'
import { loadPQCAlgorithmsData, type AlgorithmDetail } from '@/data/pqcAlgorithmsData'
import { algorithmsData } from '@/data/algorithmsData'
import * as AlgorithmFilters from './AlgorithmFilters'

const ids = (items: ReadonlyArray<{ id: string }>) =>
  items.map((item) => item.id).filter((id) => id !== 'All')

let algorithms: AlgorithmDetail[] = []
beforeAll(async () => {
  algorithms = await loadPQCAlgorithmsData()
})

const detailedMatches = (patch: Partial<ExplorerFilterState>) =>
  algorithms.filter((a) => passesAlgoFilterState(a, { ...WIDE_OPEN_FILTERS, ...patch }, null))
const transitionMatches = (patch: Partial<ExplorerFilterState>) =>
  algorithmsData.filter((t) =>
    passesTransitionFilterState(t, { ...WIDE_OPEN_FILTERS, ...patch }, null)
  )

describe('Algorithms filter values — function', () => {
  it('are exactly KEM and Signature', () => {
    expect(ids(FUNCTION_ITEMS)).toEqual(['KEM', 'Signature'])
  })

  it('each one selects algorithms and transition rows', () => {
    for (const fn of ids(FUNCTION_ITEMS)) {
      expect(detailedMatches({ fn }).length, `fn=${fn} in the detailed table`).toBeGreaterThan(0)
      expect(transitionMatches({ fn }).length, `fn=${fn} in the transition guide`).toBeGreaterThan(
        0
      )
    }
  })

  it('lower-case spellings select nothing (the comparison is exact)', () => {
    for (const fn of ['kem', 'sig', 'signature', 'KEM / Encryption']) {
      expect(detailedMatches({ fn }), `fn=${fn}`).toEqual([])
      expect(transitionMatches({ fn }), `fn=${fn}`).toEqual([])
    }
  })
})

describe('Algorithms filter values — level', () => {
  it('are the NIST security levels 1 to 5', () => {
    expect(ids(LEVEL_ITEMS)).toEqual(['1', '2', '3', '4', '5'])
  })

  it('offer every level the data carries, and each of those selects algorithms', () => {
    const present = [
      ...new Set(algorithms.map((a) => a.securityLevel).filter((l): l is number => l !== null)),
    ].map(String)
    expect(present.filter((level) => !ids(LEVEL_ITEMS).includes(level))).toEqual([])
    for (const level of present) {
      expect(detailedMatches({ level }).length, `level=${level}`).toBeGreaterThan(0)
    }
  })
})

describe('Algorithms filter values — status', () => {
  it('are Certified, Candidate and To Be Checked', () => {
    expect(ids(STATUS_ITEMS)).toEqual(['Certified', 'Candidate', 'To Be Checked'])
  })

  it('each one selects algorithms', () => {
    for (const status of ids(STATUS_ITEMS)) {
      expect(detailedMatches({ status }).length, `status=${status}`).toBeGreaterThan(0)
    }
  })
})

describe('Algorithms filter values — family', () => {
  it('are the seven families the page lists', () => {
    expect(ids(CRYPTO_FAMILY_ITEMS)).toEqual([
      'Lattice',
      'Code-based',
      'Hash-based',
      'Composite',
      'Multivariate',
      'Isogeny',
      'Classical',
    ])
  })

  it('each one selects algorithms or transition rows', () => {
    for (const family of ids(CRYPTO_FAMILY_ITEMS)) {
      const hits = detailedMatches({ family }).length + transitionMatches({ family }).length
      expect(hits, `family=${family}`).toBeGreaterThan(0)
    }
  })
})

describe('AlgorithmFilters re-exports the same lists', () => {
  it('so importers of the old location see the same values', () => {
    expect(AlgorithmFilters.FUNCTION_ITEMS).toBe(FUNCTION_ITEMS)
    expect(AlgorithmFilters.LEVEL_ITEMS).toBe(LEVEL_ITEMS)
    expect(AlgorithmFilters.STATUS_ITEMS).toBe(STATUS_ITEMS)
    expect(AlgorithmFilters.REGION_ITEMS).toBe(REGION_ITEMS)
    expect(AlgorithmFilters.CRYPTO_FAMILY_ITEMS).toBe(CRYPTO_FAMILY_ITEMS)
  })
})
