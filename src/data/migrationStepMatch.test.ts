import { describe, it, expect } from 'vitest'
import { matchesMigrationStep } from './migrateData'

// Regression coverage for the three migration-phase step-filter bugs:
//   1) untagged (~41%) products were silently dropped from every step
//   2) semicolon-delimited rows never matched (filter split on comma only)
//   3) catalog token `prepare` never matched the `preparation` step id
describe('matchesMigrationStep', () => {
  it('untagged products are phase-agnostic and match every step', () => {
    expect(matchesMigrationStep('', 'assess')).toBe(true)
    expect(matchesMigrationStep(undefined, 'rampup')).toBe(true)
    expect(matchesMigrationStep('   ', 'migrate')).toBe(true)
  })

  it('matches comma- and semicolon-delimited tokens', () => {
    expect(matchesMigrationStep('assess,plan', 'plan')).toBe(true)
    expect(matchesMigrationStep('plan;prepare;test', 'test')).toBe(true)
  })

  it('aliases the legacy "prepare" token to the "preparation" step id', () => {
    expect(matchesMigrationStep('prepare', 'preparation')).toBe(true)
    expect(matchesMigrationStep('assess;prepare', 'preparation')).toBe(true)
  })

  it('is case-insensitive and excludes genuinely non-matching steps', () => {
    expect(matchesMigrationStep('ASSESS', 'assess')).toBe(true)
    expect(matchesMigrationStep('assess,plan', 'migrate')).toBe(false)
  })
})
