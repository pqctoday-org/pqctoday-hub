// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vitest'
import {
  ALGORITHM_DB,
  DATA_RETENTION_YEARS,
  INDUSTRY_THREAT,
  INDUSTRY_TO_THREATS_MAP,
  USE_CASE_WEIGHTS,
} from './assessmentReferenceData'
import {
  industryRetentionConfigs,
  industryUseCaseConfigs,
  universalRetentionConfigs,
} from './industryAssessConfig'
import { threatsData } from './threatsData'

describe('site sector to threat industries (pqcassessment industry rows)', () => {
  const sectors = Object.keys(INDUSTRY_TO_THREATS_MAP)

  it('lists the site sectors in the order the Threats page names them', () => {
    expect(sectors).toEqual([
      'Finance & Banking',
      'Government & Defense',
      'Healthcare',
      'Telecommunications',
      'Technology',
      'Energy & Utilities',
      'Automotive',
      'Aerospace',
      'Retail & E-Commerce',
      'Education',
      'Manufacturing',
      'Cross-cutting & Other',
      'Other',
    ])
  })

  it('gives every sector but Other at least one threat industry, and never a blank label', () => {
    for (const sector of sectors) {
      const labels = INDUSTRY_TO_THREATS_MAP[sector]
      if (sector === 'Other') expect(labels).toEqual([])
      else expect(labels.length, sector).toBeGreaterThan(0)
      for (const label of labels) expect(label.trim(), sector).not.toBe('')
    }
  })

  it('keeps the first label of a sector as its own Threats label', () => {
    expect(INDUSTRY_TO_THREATS_MAP['Finance & Banking'][0]).toBe('Finance & Banking')
    expect(INDUSTRY_TO_THREATS_MAP['Government & Defense'][0]).toBe('Government & Defense')
  })

  it('names Threats industries that exist, apart from labels still awaiting a published threat', () => {
    const published = new Set(threatsData.map((t) => t.industry))
    const awaiting = new Set(
      sectors.flatMap((s) => INDUSTRY_TO_THREATS_MAP[s]).filter((label) => !published.has(label))
    )
    // The Threats page already tolerates these (it filters a sector's labels to the published ones).
    expect([...awaiting].sort()).toEqual([
      'Aerospace / Aviation / Space',
      'Rail / Transit',
      'Retail & E-Commerce',
      'Supply Chain / Logistics',
      'Water / Wastewater',
    ])
  })
})

describe('assessment scoring tables (pqcassessment rows)', () => {
  it('gives every industry but the cross-cutting one a threat score, and that one none', () => {
    expect(Object.keys(INDUSTRY_THREAT)).toEqual([
      'Finance & Banking',
      'Government & Defense',
      'Healthcare',
      'Telecommunications',
      'Technology',
      'Energy & Utilities',
      'Automotive',
      'Aerospace',
      'Retail & E-Commerce',
      'Education',
      'Manufacturing',
      'Other',
    ])
    expect(INDUSTRY_THREAT['Cross-cutting & Other']).toBeUndefined()
    for (const score of Object.values(INDUSTRY_THREAT)) expect(score).toBeGreaterThan(0)
  })

  it('weights every use case the Assess step offers on all three axes', () => {
    expect(Object.keys(USE_CASE_WEIGHTS)).toHaveLength(industryUseCaseConfigs.length)
    for (const uc of industryUseCaseConfigs) {
      const w = USE_CASE_WEIGHTS[uc.label]
      expect(w, uc.label).toBeDefined()
      expect(w.hndlRelevance).toBe(uc.hndlRelevance)
      expect(w.migrationPriority).toBe(uc.migrationPriority)
      expect(w.tnflRelevance, uc.label).toBeGreaterThan(0)
    }
  })

  it('states the scoring years of every retention id explicitly, 0 included', () => {
    const ids = [...industryRetentionConfigs, ...universalRetentionConfigs].map((r) => r.id)
    for (const id of ids) expect(DATA_RETENTION_YEARS[id], id).toBeTypeOf('number')
    // The ten industry-specific ids the risk score has never counted stay explicit zeros.
    const zero = ids.filter((id) => DATA_RETENTION_YEARS[id] === 0)
    expect(zero.sort()).toEqual(
      [
        '1y-pci-logs',
        '2y-pci',
        '3y-nerc',
        '3y-soc2',
        '6y-ferpa',
        '7y-ferc',
        'aircraft-lifetime',
        'auto-1-3y',
        'auto-vehicle-lifetime',
        'permanent-transcripts',
      ].sort()
    )
  })

  it('describes each algorithm with a vulnerability flag and a replacement', () => {
    expect(Object.keys(ALGORITHM_DB).length).toBeGreaterThan(30)
    for (const [name, info] of Object.entries(ALGORITHM_DB)) {
      expect(info.replacement, name).not.toBe('')
      expect(typeof info.quantumVulnerable, name).toBe('boolean')
    }
    expect(ALGORITHM_DB['RSA-2048'].quantumVulnerable).toBe(true)
    expect(ALGORITHM_DB['ML-KEM-768'].quantumVulnerable).toBe(false)
  })
})
