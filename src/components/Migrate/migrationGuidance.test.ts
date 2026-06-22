// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import { classifyFootprint, getPerfGuidance, sizeClassLabel } from './migrationGuidance'
import type { SoftwareItem } from '../../types/MigrateTypes'

const baseItem: SoftwareItem = {
  productId: 'p',
  softwareName: 'P',
  categoryId: 'c',
  categoryName: 'Cat',
  infrastructureLayer: 'Libraries',
  cisaCategory: 'Other / Unclassified',
  pqcSupport: '',
  pqcCapabilityDescription: '',
  licenseType: 'Open Source',
  license: 'MIT',
  latestVersion: '1',
  releaseDate: '2026',
  fipsValidated: '',
  pqcMigrationPriority: 'Low',
  primaryPlatforms: '',
  targetIndustries: '',
  authoritativeSource: '',
  repositoryUrl: '',
  productBrief: '',
  sourceType: '',
  verificationStatus: '',
  lastVerifiedDate: '',
  migrationPhases: '',
  learningModules: '',
}

describe('classifyFootprint', () => {
  it('maps byte ranges to coarse size classes', () => {
    expect(classifyFootprint(0)).toBe('unknown')
    expect(classifyFootprint(1000)).toBe('compact')
    expect(classifyFootprint(2200)).toBe('moderate')
    expect(classifyFootprint(5300)).toBe('large')
    expect(classifyFootprint(12000)).toBe('very-large')
  })
})

describe('getPerfGuidance', () => {
  it('classifies an ML-KEM-768 product as moderate', () => {
    const item = { ...baseItem, pqcSupport: 'Yes (ML-KEM-768)' }
    const g = getPerfGuidance(item)
    expect(g.sizeClass).toBe('moderate')
    expect(g.drivingAlgorithm).toBe('ML-KEM-768')
    expect(g.maxFootprintBytes).toBeGreaterThan(0)
  })

  it('flags perf-tested when FIPS-validated', () => {
    const item = {
      ...baseItem,
      pqcSupport: 'Yes (ML-DSA-65)',
      fipsValidated: 'Yes (FIPS 140-3)',
    }
    expect(getPerfGuidance(item).perfTested).toBe(true)
  })

  it('returns unknown when no algorithm parameters are detectable', () => {
    const g = getPerfGuidance({ ...baseItem, pqcSupport: 'Planned' })
    expect(g.sizeClass).toBe('unknown')
    expect(g.drivingAlgorithm).toBeNull()
  })
})

describe('sizeClassLabel', () => {
  it('returns human labels', () => {
    expect(sizeClassLabel('very-large')).toBe('Very large')
    expect(sizeClassLabel('compact')).toBe('Compact')
  })
})
