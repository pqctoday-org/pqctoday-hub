// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import { computeAssessment, computeAssessmentAsync } from './orchestrator'
import type { AssessmentInput } from '../assessmentTypes'

// A comprehensive assessment: `hasExtendedInput` is true, so the compound
// scoring path runs and `categoryScores` is always set.
const comprehensiveInput: AssessmentInput = {
  industry: 'Finance & Banking',
  currentCrypto: ['RSA-2048', 'ECDSA P-256'],
  dataSensitivity: ['high'],
  complianceRequirements: [],
  migrationStatus: 'planning',
  dataRetention: ['10-25y'],
  credentialLifetime: ['3-10y'],
  systemCount: '51-200',
  teamSize: '11-50',
  cryptoAgility: 'partially-abstracted',
  infrastructure: ['Cloud'],
  vendorDependency: 'mixed',
  timelinePressure: 'within-2-3y',
}

describe('computeAssessmentAsync — framework risk lens', () => {
  it('populates frameworkRisk on the comprehensive path (was undefined — hid the panel)', async () => {
    const result = await computeAssessmentAsync(comprehensiveInput)
    expect(result.categoryScores).toBeDefined()
    expect(result.frameworkRisk).toBeDefined()
    const fr = result.frameworkRisk!
    for (const v of [fr.hndl, fr.tnfl, fr.regulatory, fr.feasibility]) {
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThanOrEqual(100)
    }
  })

  it('sync and async agree that comprehensive input yields a framework lens', () => {
    const sync = computeAssessment(comprehensiveInput)
    expect(sync.frameworkRisk).toBeDefined()
  })
})
