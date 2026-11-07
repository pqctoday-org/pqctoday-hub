// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import { generateNarrative } from './generators'
import { getMaxRetentionYears } from './scoring'
import type { AssessmentInput } from '../assessmentTypes'
const input: AssessmentInput = {
  industry: 'Technology',
  currentCrypto: [],
  dataSensitivity: ['medium'],
  complianceRequirements: [],
  migrationStatus: 'planning',
}
const narrative = (dataRetention: string[], retentionUnknown = false) =>
  generateNarrative({ ...input, dataRetention, retentionUnknown }, 40, 'medium', 0, 0)

describe('selected retention in the assessment narrative', () => {
  it('keeps a bounded10–25year selection separate from the25year planning upper bound', () => {
    expect(getMaxRetentionYears(['10-25y'])).toBe(25)
    const text = narrative(['10-25y'])
    expect(text).toContain('10–25 years (selected retention)')
    expect(text).not.toContain('25+ years')
  })
  it('preserves an actual open-ended selection and an indefinite selection without inventing finite minima', () => {
    expect(narrative(['25-plus'])).toContain('25+ years (selected retention)')
    expect(narrative(['25-plus'])).not.toContain('30+ years')
    expect(narrative(['indefinite'])).toContain('indefinite (selected retention)')
    expect(narrative(['indefinite'])).not.toContain('50+ years')
  })
  it('keeps multiple selected intervals instead of turning their highest bound into a minimum', () => {
    expect(narrative(['5-10y', '10-25y'])).toContain(
      '5–10 years / 10–25 years (selected retention)'
    )
    expect(getMaxRetentionYears(['5-10y', '10-25y'])).toBe(25)
  })
  it('does not describe unknown or unanswered retention as a selected known range', () => {
    expect(narrative(['10-25y'], true)).not.toContain('selected retention')
    expect(narrative([], true)).not.toContain('selected retention')
    expect(narrative([])).not.toContain('selected retention')
    // Existing short-lifetime inclusion threshold remains unchanged.
    expect(narrative(['5-10y'])).not.toContain('selected retention')
  })
})
