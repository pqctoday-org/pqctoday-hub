import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { generationRank, maturityRequirements } from './maturityGovernanceData'

/**
 * WHY THIS EXISTS (2026-08-23).
 *
 * `maturityGovernanceData.ts` merges EVERY generation of
 * `pqc_maturity_governance_requirements_*.csv` (both `src/data/` and
 * `src/data/archive/`) and relies on basename-descending order so a newer
 * generation wins dedup-key collisions — that is how a row is corrected or
 * retired at all, since `ref_id` is PART of the dedup key and a repoint
 * therefore creates a parallel row rather than replacing one.
 *
 * The sort used `localeCompare`, which treats `_` as ignorable punctuation and
 * so collated `..._08232026_r1.csv` BELOW `..._08232026.csv` — exactly inverting
 * the `*_r1 > base file` rule the loader's own comment promises. Four eIDAS rows
 * deprecated in an `_r1` generation kept loading as active, because the file
 * they were written to correct outranked them.
 *
 * The bug is invisible in the merged output unless a collision exists, which is
 * why it survived: with no differing rows on shared keys, both orderings agree.
 */
const CONSOLIDATED = 'eIDAS-Regulation-EU-910-2014-consolidated-text-as-amended-by'

describe('merge-all generation ordering', () => {
  it('collates _r1 ABOVE its base file, which localeCompare does not', () => {
    const base = 'pqc_maturity_governance_requirements_08232026.csv'
    const r1 = 'pqc_maturity_governance_requirements_08232026_r1.csv'
    const codeUnit = (x: string, y: string) => (x < y ? 1 : x > y ? -1 : 0)

    // Descending: the _r1 revision must sort FIRST so it claims the dedup key.
    expect(codeUnit(r1, base)).toBeLessThan(0)
    // Pin the failure mode itself: localeCompare gets this backwards. If this
    // assertion ever flips, the platform's collation changed and the guard
    // below is what still holds the line.
    expect(r1.localeCompare(base)).toBeLessThan(0)
  })

  it('orders generations by date, then revision number (not by name)', () => {
    const names = [
      'pqc_maturity_governance_requirements_10222026_r9.csv',
      'pqc_maturity_governance_requirements_01152027.csv',
      'pqc_maturity_governance_requirements_10222026_r10.csv',
      'pqc_maturity_governance_requirements_10222026.csv',
      'pqc_maturity_governance_requirements_10222026_r1.csv',
    ]
    const desc = [...names].sort((a, b) => {
      const [da, ra] = generationRank(a)
      const [db, rb] = generationRank(b)
      return db - da || rb - ra
    })
    expect(desc).toEqual([
      'pqc_maturity_governance_requirements_01152027.csv',
      'pqc_maturity_governance_requirements_10222026_r10.csv',
      'pqc_maturity_governance_requirements_10222026_r9.csv',
      'pqc_maturity_governance_requirements_10222026_r1.csv',
      'pqc_maturity_governance_requirements_10222026.csv',
    ])
    // The _r1 > base rule from 2026-08-23 still holds.
    expect(generationRank('x_08232026_r1.csv')[1]).toBeGreaterThan(
      generationRank('x_08232026.csv')[1]
    )
  })

  it('carries the marker the maintenance flow checks before writing _r10+', () => {
    const src = readFileSync('src/data/maturityGovernanceData.ts', 'utf8')
    expect(src).toContain('// merge-all-order: date-revision')
  })

  it('does not sort generations with localeCompare', () => {
    const src = readFileSync('src/data/maturityGovernanceData.ts', 'utf8')
    const sortBlock = src.slice(src.indexOf('const orderedEntries'), src.indexOf('for (const ['))
    expect(sortBlock).not.toContain('localeCompare')
  })

  it('serves no recital-sourced row against the articles-only consolidated text', () => {
    // The consolidated eIDAS PDF is a documentation consolidation containing
    // the articles only — it has no recitals at all, so a Recital-sourced
    // quote can never verify against it.
    const bad = maturityRequirements.filter(
      (r) => r.refId === CONSOLIDATED && /recital/i.test(r.evidenceLocation ?? '')
    )
    expect(bad.map((r) => r.evidenceLocation)).toEqual([])
  })

  it('still serves the Article 46b row that replaced them', () => {
    const current = maturityRequirements.filter(
      (r) => r.refId === CONSOLIDATED && /46b/.test(r.evidenceLocation ?? '')
    )
    expect(current).toHaveLength(1)
  })
})
