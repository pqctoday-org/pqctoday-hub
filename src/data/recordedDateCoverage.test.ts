// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vitest'
import { recordedDateCoverage, recordedDateCoveragePhrase } from './recordedDateCoverage'
import { expandTokens } from '../../scripts/lib/roleBoardTokens'
import {
  REGULATORY_SOURCE_DATE_COVERAGE,
  REGULATORY_SOURCE_COVERAGE_PHRASE,
} from './personaBoardLiveMetrics'
import { EXEC_MOSCA_FOOTNOTE, EXEC_EXPOSURE, EXEC_MOSCA_START_BY_YEAR } from './personaConfig'
import { getCrqcForecast } from '../components/PKILearning/modules/QuantumThreats/data/quantumConstants'

describe('recorded checking-date coverage', () => {
  it('keeps a newest date separate from old, missing and invalid records', () => {
    const c = recordedDateCoverage([
      '2021-01-01',
      '2026-11-12',
      undefined,
      '',
      '2026-02-30',
      'tomorrow',
    ])
    expect(c).toEqual({
      totalRows: 6,
      datedRows: 2,
      missingRows: 2,
      invalidRows: 2,
      oldestDate: '2021-01-01',
      newestDate: '2026-11-12',
    })
    expect(recordedDateCoveragePhrase('Timeline', c)).toBe(
      'Timeline: 2/6 dated rows (2021-01-01–2026-11-12); 2 missing, 2 invalid'
    )
  })
  it('does not turn an empty or wholly undated population into complete review', () => {
    expect(recordedDateCoveragePhrase('Compliance', recordedDateCoverage([]))).toContain(
      '0/0 dated rows'
    )
    expect(
      recordedDateCoveragePhrase('Compliance', recordedDateCoverage([null, undefined]))
    ).toContain('no date range available')
    expect(recordedDateCoverage([null, undefined]).missingRows).toBe(2)
  })
  it('counts valid leap dates and recomputes the denominator when a row is added', () => {
    const c = recordedDateCoverage(['2024-02-29', '2024-02-30', '2026-11-12', undefined])
    expect([c.datedRows, c.totalRows, c.invalidRows, c.missingRows]).toEqual([2, 4, 1, 1])
    expect(recordedDateCoverage(['2024-02-29', '2026-11-12']).datedRows).toBe(2)
  })
  it('expands the existing canonical token with separate live populations and no fabricated fallback', () => {
    const { compliance, timeline } = REGULATORY_SOURCE_DATE_COVERAGE
    for (const c of [compliance, timeline])
      expect(c.datedRows + c.missingRows + c.invalidRows).toBe(c.totalRows)
    expect(REGULATORY_SOURCE_COVERAGE_PHRASE).toContain(
      `Compliance: ${compliance.datedRows}/${compliance.totalRows}`
    )
    expect(REGULATORY_SOURCE_COVERAGE_PHRASE).toContain(
      `Timeline: ${timeline.datedRows}/${timeline.totalRows}`
    )
    expect(
      expandTokens('{regulatory_verified_phrase}', { REGULATORY_SOURCE_COVERAGE_PHRASE })
    ).toBe(REGULATORY_SOURCE_COVERAGE_PHRASE)
    expect(expandTokens('{regulatory_verified_phrase}', {})).toContain('coverage is unavailable')
    expect(expandTokens('{regulatory_verified_phrase}', {})).not.toContain(
      'verified against source'
    )
  })
  it('preserves the existing Mosca calculation while distinguishing its scenario from survey probabilities', () => {
    const before = getCrqcForecast()
    expect(before.planningYear).toBe(2035)
    expect(EXEC_MOSCA_START_BY_YEAR).toBe(
      before.planningYear - EXEC_EXPOSURE.secrecyYears - EXEC_EXPOSURE.migrationYears
    )
    expect(EXEC_MOSCA_FOOTNOTE).toContain('Hub-selected planning year')
    expect(EXEC_MOSCA_FOOTNOTE).toContain('reports probabilities by horizon, not this midpoint')
    expect(EXEC_MOSCA_FOOTNOTE).not.toContain('midpoint, rounded down, of the published')
    expect(getCrqcForecast()).toEqual(before)
    expect(expandTokens('{exec_mosca_footnote}', { EXEC_MOSCA_FOOTNOTE })).toBe(EXEC_MOSCA_FOOTNOTE)
  })
})
