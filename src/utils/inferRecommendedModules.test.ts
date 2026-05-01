import { describe, it, expect } from 'vitest'
import { inferRecommendedModules } from './inferRecommendedModules'
import type { CategoryScores } from '@/hooks/assessmentTypes'

const scores = (
  quantumExposure: number,
  migrationComplexity: number,
  organizationalReadiness: number
): CategoryScores => ({
  quantumExposure,
  migrationComplexity,
  organizationalReadiness,
  // other fields not used by the function
  technicalDebt: 0,
  dataExposure: 0,
  regulatoryImpact: 0,
})

describe('inferRecommendedModules', () => {
  it('returns quantum-threats when exposure is high', () => {
    const ids = inferRecommendedModules(scores(80, 20, 70), 'architect')
    expect(ids).toContain('quantum-threats')
  })

  it('returns pqc-101 when organizational readiness is low', () => {
    const ids = inferRecommendedModules(scores(20, 20, 20), 'curious')
    expect(ids).toContain('pqc-101')
  })

  it('returns migration-program when migration complexity is high', () => {
    const ids = inferRecommendedModules(scores(20, 80, 70), 'ops')
    expect(ids).toContain('migration-program')
  })

  it('returns at most 3 items', () => {
    const ids = inferRecommendedModules(scores(80, 80, 10), 'developer')
    expect(ids.length).toBeLessThanOrEqual(3)
  })

  it('returns no duplicates', () => {
    const ids = inferRecommendedModules(scores(80, 80, 10), 'executive')
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('falls back to pqc-101 when no thresholds are crossed', () => {
    const ids = inferRecommendedModules(scores(50, 50, 50), 'curious')
    expect(ids.length).toBeGreaterThan(0)
  })
})
