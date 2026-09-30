// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import { generatePersonaNarrative } from './personas'
import type { AssessmentInput } from '../assessmentTypes'

const input = {
  industry: 'Finance & Banking',
  country: 'United States',
  currentCrypto: ['RSA-2048', 'ECDSA P-256'],
  dataSensitivity: ['high'],
  complianceRequirements: ['FIPS 140-3'],
  migrationStatus: 'not-started',
  infrastructure: ['PKCS#11 (HSM)'],
  cryptoAgility: 'hardcoded',
} as unknown as AssessmentInput

describe('cert-engineer assessment narrative', () => {
  const text = generatePersonaNarrative(
    'cert-engineer',
    input,
    72,
    'high',
    2,
    undefined,
    undefined,
    undefined,
    undefined,
    1
  )

  it('is persona-specific rather than the neutral fallback', () => {
    expect(text).toBeDefined()
    expect(text).toMatch(/CAVP validation before it can appear on a module certificate/)
  })

  it('keeps the FIPS 140-3 stages apart — CAVP is never called a certificate', () => {
    expect(text).not.toMatch(/CAVP[- ](certified|certificate)\b/i)
  })

  it('reads the HSM, hard-coded agility and framework inputs', () => {
    expect(text).toMatch(/self-tests and the entropy source/)
    expect(text).toMatch(/change process/)
    expect(text).toMatch(/1 of the frameworks you selected/)
  })
})
