// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vitest'
import {
  assessBuildBuy,
  emptyFacts,
  sampleCostTotals,
  workedComparison,
} from './buildBuyAssessment'

describe('Declared sample eligibility before unchanged preference weights', () => {
  it('does not interpret unanswered requirement questions as no requirements', () => {
    const result = assessBuildBuy({ expertise: 0, budget: 0, maintenance: 0 }, emptyFacts())
    expect(result.answered).toBe(3)
    expect(result.leaders).toEqual([])
    expect(result.eligibility.build.status).toBe('unassessed')
    expect(result.eligibility.build.unknown).toHaveLength(3)
  })
  it('independently reproduces 13/12/8 but excludes the higher failed candidate', () => {
    const example = workedComparison()
    const result = assessBuildBuy(example.answers, example.facts)
    expect(result.scores).toEqual({ build: 13, 'open-source': 12, commercial: 8 })
    expect(result.leaders).toEqual(['open-source'])
    expect(result.eligibility.build.failed).toEqual(['Required module validation'])
    expect(result.eligibility.commercial.failed).toEqual([
      'Required portability',
      'Full source access',
    ])
  })
  it('blocks the original higher-scoring opaque candidate only while source access is required', () => {
    const answers = {
      regulation: 2,
      expertise: 2,
      budget: 0,
      maintenance: 2,
      'pqc-urgency': 1,
      liability: 0,
      'vendor-lock-in': 2,
      'source-audit': 0,
    }
    const facts = emptyFacts()
    facts.build.sourceAccess = 'yes'
    facts['open-source'].sourceAccess = 'yes'
    facts.commercial.sourceAccess = 'no'
    const result = assessBuildBuy(answers, facts)
    expect(result.scores).toEqual({ build: 4, 'open-source': 10, commercial: 12 })
    expect(result.leaders).toEqual(['open-source'])
    facts.commercial.sourceAccess = 'yes'
    expect(assessBuildBuy(answers, facts).leaders).toEqual(['commercial'])
  })
  it('allows the in-house candidate to lead once its entered validation assumption changes', () => {
    const example = workedComparison()
    example.facts.build.validation = 'yes'
    expect(assessBuildBuy(example.answers, example.facts).leaders).toEqual(['build'])
  })
  it.each(['validation', 'portability', 'sourceAccess'] as const)(
    'a selected %s requirement cannot be compensated by score',
    (field) => {
      const example = workedComparison()
      example.facts.build = { validation: 'yes', portability: 'yes', sourceAccess: 'yes' }
      example.facts.build = { ...example.facts.build, [field]: 'no' }
      expect(assessBuildBuy(example.answers, example.facts).eligibility.build.status).toBe(
        'ineligible'
      )
      example.facts.build = { ...example.facts.build, [field]: 'unknown' }
      const unknown = assessBuildBuy(example.answers, example.facts)
      expect(unknown.eligibility.build.status).toBe('unassessed')
      expect(unknown.leaders).toEqual(['open-source'])
    }
  )
  it('has no leader when every selected candidate is unassessed or failed', () => {
    const example = workedComparison()
    expect(assessBuildBuy(example.answers, emptyFacts()).leaders).toEqual([])
    example.facts['open-source'].validation = 'no'
    expect(assessBuildBuy(example.answers, example.facts).leaders).toEqual([])
  })
  it('nonmandatory selections do not impose capability gates and ties remain joint', () => {
    const result = assessBuildBuy(
      { regulation: 2, 'vendor-lock-in': 2, 'source-audit': 2 },
      emptyFacts()
    )
    expect(result.scores).toEqual({ build: 6, 'open-source': 7, commercial: 7 })
    expect(result.leaders).toEqual(['open-source', 'commercial'])
  })
  it('ignores unknown questions and invalid option indexes when counting contributions', () => {
    const result = assessBuildBuy(
      { regulation: 999, expertise: -1, budget: 0.5, invented: 0 },
      emptyFacts()
    )
    expect(result.answered).toBe(0)
    expect(result.scores).toEqual({ build: 5, 'open-source': 5, commercial: 5 })
    expect(result.leaders).toEqual([])
  })
})

describe('Inspectable undiscounted setup plus annual sample costs', () => {
  it('independently computes the worked one-, three- and five-year totals', () => {
    const { costs } = workedComparison()
    expect(sampleCostTotals(costs.build)).toEqual([1000000, 2000000, 3000000])
    expect(sampleCostTotals(costs['open-source'])).toEqual([100000, 200000, 300000])
    expect(sampleCostTotals(costs.commercial)).toEqual([150000, 350000, 550000])
  })
  it('annual sensitivity changes each horizon by its actual year count', () => {
    expect(sampleCostTotals({ setup: '500000', annual: '510000' })).toEqual([
      1010000, 2030000, 3050000,
    ])
    expect(sampleCostTotals({ setup: '0', annual: '0' })).toEqual([0, 0, 0])
    expect(sampleCostTotals({ setup: '-0', annual: '-0' })).toEqual([0, 0, 0])
  })
  it.each(['', ' ', '-1', 'not a number', 'Infinity'])(
    'keeps missing/invalid cost %j unassessed without converting it to zero',
    (value) => {
      expect(sampleCostTotals({ setup: value, annual: '50' })).toBeNull()
      expect(sampleCostTotals({ setup: '50', annual: value })).toBeNull()
    }
  )
  it('does not emit nonfinite totals on arithmetic overflow', () => {
    expect(sampleCostTotals({ setup: '1e308', annual: '1e308' })).toBeNull()
  })
})
