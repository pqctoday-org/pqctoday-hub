// SPDX-License-Identifier: AGPL-3.0-only
import { afterEach, describe, expect, it, vi } from 'vitest'
import { PERSONA_STEP_HINTS } from './personaWizardHints'
import { computeMigrationComplexity, computeOrganizationalReadiness, computeQuantumExposure, computeRegulatoryPressure, getIndustryRetentionDefault } from '../hooks/assessment/scoring'
import type { AssessmentInput, ComplianceImpact } from '../hooks/assessmentTypes'

const base: AssessmentInput = {
  industry: 'Unspecified sample industry', country: 'Unspecified sample jurisdiction',
  currentCrypto: [], dataSensitivity: ['low'], complianceRequirements: [],
  migrationStatus: 'started', persona: 'researcher', cryptoAgility: 'fully-abstracted',
  systemCount: '1-10', teamSize: '200-plus', vendorDependency: 'in-house',
  infrastructure: ['Cloud'], timelinePressure: 'no-deadline',
}
const hints = PERSONA_STEP_HINTS.researcher
const framework = (deadline: string, requiresPQC = true): ComplianceImpact => ({
  framework: 'Fictional applicable framework', deadline, requiresPQC,
} as ComplianceImpact)

afterEach(() => vi.useRealTimers())
describe('Researcher teaching agrees with independently worked scoring cases', () => {
  it('uses discrete deadline bands, and excludes a non-PQC framework rather than doubling its name', () => {
    vi.useFakeTimers(); vi.setSystemTime(new Date('2026-11-11T12:00:00Z'))
    // Unspecified industry contributes 10 × .85 = 8.5; unknown jurisdiction adds zero.
    for (const [deadline, points] of [['2026', 15], ['2028', 14], ['2031', 12], ['2032', 8], ['Unknown', 10]] as const) {
      expect(computeRegulatoryPressure(base, [framework(deadline)])).toBe(Math.round(8.5 + points))
    }
    expect(computeRegulatoryPressure(base, [framework('2026', false)])).toBe(9)
    expect(hints.compliance.hintExpert).toContain('sum is capped at 45')
    expect(hints.country.hintExpert).toContain('piecewise, not exponential')
  })
  it('keeps unknown status worse than not-started, with a readiness score that is higher-is-better', () => {
    // Capacity round(1/1 × 8)=8; agility round(.2 × 20)=4; vendor round(3 × .75)=2.
    expect(computeOrganizationalReadiness(base)).toBe(81) // 100−(5+8+4+2)
    expect(computeOrganizationalReadiness({ ...base, migrationStatus: 'not-started' })).toBe(51)
    expect(computeOrganizationalReadiness({ ...base, migrationStatus: 'unknown' })).toBe(46)
    expect(hints.migration.hintExpert).toContain('unknown = 40')
    expect(hints.migration.hint).toContain('higher means more ready')
  })
  it('computes actual sensitivity contributions, not invented Top Secret/Public point scales', () => {
    expect(computeQuantumExposure({ ...base, dataSensitivity: ['high'] }, 0)).toBe(19) // 9 sensitivity+10 legacy retention
    expect(computeQuantumExposure({ ...base, dataSensitivity: ['critical'] }, 0)).toBe(31) // 15+16
    // Explicit equal retention removes the separate retention fallback, isolating sensitivity.
    const fixed = { ...base, dataRetention: ['under-1y'] }
    const high = computeQuantumExposure({ ...fixed, dataSensitivity: ['high'] }, 0)
    const critical = computeQuantumExposure({ ...fixed, dataSensitivity: ['critical'] }, 0)
    expect(critical - high).toBe(6)
    expect(hints.sensitivity.hintExpert).toContain('critical = 15')
    expect(hints.sensitivity.hint).toContain('window itself uses retention years')
  })
  it('keeps both unknown-cryptography counterexamples instead of promising one sensitivity default', () => {
    const unknown = { ...base, currentCryptoUnknown: true, sensitivityUnknown: true }
    expect(computeQuantumExposure({ ...unknown, dataSensitivity: ['critical', 'high'] }, 0)).toBe(45)
    expect(computeQuantumExposure({ ...unknown, dataSensitivity: ['medium'] }, 0)).toBe(33)
    const retainedHigh = { ...unknown, dataSensitivity: ['high'] }
    expect(computeQuantumExposure({ ...retainedHigh, dataRetention: ['under-1y'] }, 0)).toBe(39)
    expect(computeQuantumExposure({ ...retainedHigh, dataRetention: ['indefinite'] }, 0)).toBe(39)
    expect(hints.sensitivity.hintExpert).toContain('unknown-cryptography branch instead reads the retained sensitivity selection')
    expect(hints.retention.hintExpert).toContain('unknown-cryptography branch omits that term')
  })
  it('reproduces editable agility and layer contributions with the actual scorer', () => {
    // Cloud6 + scale7.5 + vendor2.25 =15.75, then agility8/36/30.
    expect(computeMigrationComplexity(base)).toBe(24)
    expect(computeMigrationComplexity({ ...base, cryptoAgility: 'hardcoded' })).toBe(52)
    expect(computeMigrationComplexity({ ...base, cryptoAgility: 'unknown' })).toBe(46)
    expect(computeMigrationComplexity({ ...base, infrastructure: ['Hardware', 'Security Stack', 'OS'] })).toBe(48) // infrastructure capped30
    expect(hints.agility.hintExpert).toContain('8, 20, 36 and 30')
    expect(hints.infra.hintExpert).toContain('Cloud = 6')
  })
  it('uses band factors rather than a raw systems-per-staff threshold', () => {
    expect(computeOrganizationalReadiness({ ...base, systemCount: '200-plus', teamSize: '1-10' })).toBe(64) // capped25 capacity
    expect(hints.scale.hintExpert).toContain('min(25, round(8 × system-scale factor / team-capacity factor))')
    expect(hints.scale.hintExpert).toContain('1–10, 11–50, 51–200 and 200-plus')
  })
  it('uses the unknown timeline coefficient and industry-based retention floor without inventing universal lifetimes', () => {
    vi.useFakeTimers(); vi.setSystemTime(new Date('2026-11-11T12:00:00Z'))
    expect(computeRegulatoryPressure({ ...base, timelinePressure: 'unknown' }, [framework('2028')])).toBe(27) // (8.5+14)×1.2
    expect(getIndustryRetentionDefault(base.industry)).toBe(15)
    expect(hints.timeline.hintExpert).toContain('unknown = 1.2')
    expect(hints.retention.hintExpert).toContain('minimum of 15 years')
  })
})
