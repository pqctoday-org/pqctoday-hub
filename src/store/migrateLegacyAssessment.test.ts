// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect, beforeEach } from 'vitest'
import { migrateLegacyAssessmentOnce } from './migrateLegacyAssessment'

const LEGACY_KEY = 'pqc-assessment'
const FORM_KEY = 'pqc-assessment-form'
const RESULT_KEY = 'pqc-assessment-result'
const SENTINEL_KEY = 'pqc-assessment-migrated'

function legacyBlob(state: Record<string, unknown>, version = 0) {
  return JSON.stringify({ state, version })
}

describe('migrateLegacyAssessmentOnce', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('imports legacy combined blob into the two split stores', () => {
    localStorage.setItem(
      LEGACY_KEY,
      legacyBlob(
        {
          industry: 'finance',
          currentStep: 3,
          currentCrypto: ['RSA-2048'],
          hiddenThreats: ['shor'],
          lastResult: { riskScore: 42 },
          completedAt: '2026-01-01T00:00:00.000Z',
          previousRiskScore: 40,
          assessmentHistory: [{ completedAt: '2026-01-01T00:00:00.000Z', riskScore: 42 }],
        },
        9
      )
    )

    migrateLegacyAssessmentOnce()

    const form = JSON.parse(localStorage.getItem(FORM_KEY)!)
    const result = JSON.parse(localStorage.getItem(RESULT_KEY)!)

    // Envelope versions must match the target stores' `version` option.
    expect(form.version).toBe(2)
    expect(result.version).toBe(0)

    // Form fields land in the form store…
    expect(form.state.industry).toBe('finance')
    expect(form.state.currentStep).toBe(3)
    // …and result-only fields land in the result store, not the form store.
    expect(result.state.hiddenThreats).toEqual(['shor'])
    expect(result.state.lastResult).toEqual({ riskScore: 42 })
    expect(result.state.previousRiskScore).toBe(40)
    expect(form.state.hiddenThreats).toBeUndefined()
    expect(form.state.lastResult).toBeUndefined()

    // Sentinel set so it never runs twice.
    expect(localStorage.getItem(SENTINEL_KEY)).toBe('1')
  })

  it('is a no-op when the sentinel is already set', () => {
    localStorage.setItem(SENTINEL_KEY, '1')
    localStorage.setItem(LEGACY_KEY, legacyBlob({ industry: 'finance' }))

    migrateLegacyAssessmentOnce()

    expect(localStorage.getItem(FORM_KEY)).toBeNull()
    expect(localStorage.getItem(RESULT_KEY)).toBeNull()
  })

  it('does not clobber data already present under the new keys', () => {
    const existingForm = legacyBlob({ industry: 'healthcare' }, 2)
    localStorage.setItem(FORM_KEY, existingForm)
    localStorage.setItem(LEGACY_KEY, legacyBlob({ industry: 'finance' }))

    migrateLegacyAssessmentOnce()

    expect(localStorage.getItem(FORM_KEY)).toBe(existingForm)
    expect(localStorage.getItem(SENTINEL_KEY)).toBe('1')
  })

  it('sets the sentinel and writes nothing when there is no legacy data', () => {
    migrateLegacyAssessmentOnce()

    expect(localStorage.getItem(FORM_KEY)).toBeNull()
    expect(localStorage.getItem(RESULT_KEY)).toBeNull()
    expect(localStorage.getItem(SENTINEL_KEY)).toBe('1')
  })
})
