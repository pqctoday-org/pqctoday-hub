// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import {
  runLegacyAssessmentMigrations,
  migrateResultStoreReadinessSign,
} from './assessmentMigration'

describe('migrateResultStoreReadinessSign (result store v0→v1)', () => {
  it('flips organizationalReadiness gap → readiness in lastResult and history', () => {
    const state = {
      lastResult: { categoryScores: { organizationalReadiness: 30, quantumExposure: 80 } },
      assessmentHistory: [
        { categoryScores: { organizationalReadiness: 10 } },
        { categoryScores: { organizationalReadiness: 90 } },
      ],
    }
    const out = migrateResultStoreReadinessSign(state)
    expect(out.lastResult.categoryScores.organizationalReadiness).toBe(70)
    expect(out.lastResult.categoryScores.quantumExposure).toBe(80) // untouched
    expect(out.assessmentHistory[0].categoryScores.organizationalReadiness).toBe(90)
    expect(out.assessmentHistory[1].categoryScores.organizationalReadiness).toBe(10)
  })

  it('is a no-op when there is nothing to migrate', () => {
    expect(() => migrateResultStoreReadinessSign({})).not.toThrow()
    expect(migrateResultStoreReadinessSign({ assessmentHistory: [] }).assessmentHistory).toEqual([])
  })
})

describe('assessmentMigration', () => {
  it('migrate v1→v2: converts string dataSensitivity to array', () => {
    const result = runLegacyAssessmentMigrations(
      { dataSensitivity: 'high', dataRetention: '5-10y' },
      1
    )
    expect(Array.isArray(result.dataSensitivity)).toBe(true)
    expect(result.dataSensitivity).toContain('high')
    expect(Array.isArray(result.dataRetention)).toBe(true)
    expect(result.dataRetention).toContain('5-10y')
  })

  it('migrate v2→v3: converts isComplete=true to assessmentStatus=complete', () => {
    const result = runLegacyAssessmentMigrations(
      { isComplete: true, dataSensitivity: [], dataRetention: [] },
      2
    )
    expect(result.assessmentStatus).toBe('complete')
  })

  it('migrate v9→v10: migrationStatus "unknown" → migrationUnknown=true', () => {
    const result = runLegacyAssessmentMigrations(
      { migrationStatus: 'unknown', cryptoAgility: 'unknown', timelinePressure: 'unknown' },
      9
    )
    expect(result.migrationUnknown).toBe(true)
    expect(result.migrationStatus).toBe('not-started')
    expect(result.agilityUnknown).toBe(true)
    expect(result.cryptoAgility).toBe('partially-abstracted')
    expect(result.timelineUnknown).toBe(true)
    expect(result.timelinePressure).toBe('no-deadline')
  })
})
