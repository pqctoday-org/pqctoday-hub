// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import { DEFAULT_SECTOR_OPTIONS, matchesSectorFilter } from './SectorFilter'
import { libraryData } from '../../data/libraryData'

/**
 * Drift guard (W5): every default sector option must match at least one library
 * document. Previously four options ('56' Administrative & Support Services and
 * the three PQC-SECTOR-* vendor codes) matched zero rows, so selecting one
 * stranded the user in the empty state. This test fails if a dead option is
 * re-introduced.
 */
describe('SectorFilter default options', () => {
  it('every default sector option matches at least one library document', () => {
    for (const opt of DEFAULT_SECTOR_OPTIONS) {
      const hits = libraryData.filter((item) =>
        matchesSectorFilter([opt.id], item.applicableIndustries ?? [])
      ).length
      expect(
        hits,
        `sector option "${opt.label}" (${opt.id}) matches 0 documents — remove it or fix the matcher`
      ).toBeGreaterThan(0)
    }
  })
})
