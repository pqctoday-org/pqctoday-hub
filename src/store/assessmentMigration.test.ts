// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import { runLegacyAssessmentMigrations } from './assessmentMigration'

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
