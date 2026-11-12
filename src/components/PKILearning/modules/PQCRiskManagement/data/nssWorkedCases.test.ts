// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vitest'
import { evaluateNssRequirement, type NssSelection } from './nssWorkedCases'

// Independent expected inputs: CNSA FAQ v2.2 p7; signing pp15–16; arrangements pp28–29.
const keyCase: NssSelection = {
  scope: 'NSS',
  operation: 'key establishment',
  algorithm: 'ML-KEM',
  parameter: '1024',
  variant: null,
  composition: 'standalone',
}
const signingCase: NssSelection = {
  scope: 'NSS',
  operation: 'software signing',
  algorithm: 'ML-DSA',
  parameter: '87',
  variant: 'pure',
  composition: 'standalone',
}

describe('two explicitly declared NSS algorithm requirements', () => {
  it.each([
    ['nss-key-establishment', keyCase, 'FIPS 203 ML-KEM-1024'],
    ['nss-software-signing', signingCase, 'FIPS 204 ML-DSA-87'],
  ] as const)(
    'positively matches %s without awarding implementation or deployment validation',
    (id, input, name) => {
      const result = evaluateNssRequirement(id, input)
      expect(result.status).toBe('match')
      expect(result.reason).toContain(name)
      expect(result.reason).toContain('algorithm requirement only')
      expect(result.reason).toContain(
        'implementation validation, protocol approval and deployed-system compliance are separate'
      )
    }
  )

  it.each(['768', '512'])('rejects ML-KEM-%s for the selected1024 requirement', (parameter) => {
    expect(evaluateNssRequirement('nss-key-establishment', { ...keyCase, parameter }).status).toBe(
      'does-not-match'
    )
  })
  it.each(['44', '65'])('rejects ML-DSA-%s for the selected87 requirement', (parameter) => {
    expect(
      evaluateNssRequirement('nss-software-signing', { ...signingCase, parameter }).status
    ).toBe('does-not-match')
  })
  it.each([
    ['nss-key-establishment', keyCase],
    ['nss-software-signing', signingCase],
  ] as const)('does not infer a parameter from the family for %s', (id, input) => {
    const result = evaluateNssRequirement(id, { ...input, parameter: null })
    expect(result.status).toBe('needs-input')
    expect(result.reason).toContain('family name alone is insufficient')
  })
  it.each(['FrodoKEM', 'Kyber', 'ML-DSA'])('cannot substitute %s for final ML-KEM', (algorithm) => {
    expect(evaluateNssRequirement('nss-key-establishment', { ...keyCase, algorithm }).status).toBe(
      'does-not-match'
    )
  })
  it.each(['SLH-DSA', 'Dilithium', 'ML-KEM'])(
    'cannot substitute %s for final ML-DSA signing',
    (algorithm) => {
      expect(
        evaluateNssRequirement('nss-software-signing', { ...signingCase, algorithm }).status
      ).toBe('does-not-match')
    }
  )
  it.each(['PQC family', 'unknown', null])(
    'does not approve a generic or unknown algorithm %s',
    (algorithm) => {
      expect(
        evaluateNssRequirement('nss-key-establishment', { ...keyCase, algorithm }).status
      ).toBe('needs-input')
    }
  )
  it('distinguishes missing applicability, explicit non-NSS and a wrong operation', () => {
    expect(
      evaluateNssRequirement('nss-key-establishment', { ...keyCase, scope: null }).status
    ).toBe('needs-input')
    expect(
      evaluateNssRequirement('nss-key-establishment', { ...keyCase, scope: 'non-NSS' }).status
    ).toBe('not-applicable')
    expect(
      evaluateNssRequirement('nss-key-establishment', { ...keyCase, operation: null }).status
    ).toBe('needs-input')
    expect(
      evaluateNssRequirement('nss-key-establishment', { ...keyCase, operation: 'software signing' })
        .status
    ).toBe('does-not-match')
  })
  it('requires a named arrangement instead of inheriting a component result for a generic hybrid', () => {
    const result = evaluateNssRequirement('nss-key-establishment', {
      ...keyCase,
      composition: 'hybrid',
    })
    expect(result.status).toBe('needs-input')
    expect(result.reason).toContain('does not say all hybrids are forbidden')
    expect(
      evaluateNssRequirement('nss-key-establishment', { ...keyCase, composition: null }).status
    ).toBe('needs-input')
  })
  it('keeps pure ML-DSA distinct from missing or HashML-DSA variants', () => {
    expect(
      evaluateNssRequirement('nss-software-signing', { ...signingCase, variant: null }).status
    ).toBe('needs-input')
    expect(
      evaluateNssRequirement('nss-software-signing', { ...signingCase, variant: 'HashML-DSA' })
        .status
    ).toBe('does-not-match')
  })
  it.each(['87 and 65', ' 87', '87-extra', ''])(
    'does not pick a passing substring from %s',
    (parameter) => {
      expect(
        evaluateNssRequirement('nss-software-signing', { ...signingCase, parameter }).status
      ).toBe('needs-input')
    }
  )
  it.each(['unknown-profile', 'NIST-transition-milestone'])(
    'does not apply these parameter rules to %s',
    (id) => {
      expect(evaluateNssRequirement(id, keyCase).status).toBe('not-evaluated')
    }
  )
  it('does not mutate caller inputs or let a result for one row complete another', () => {
    const missing = { ...keyCase, parameter: null }
    const before = structuredClone([keyCase, missing, signingCase])
    expect([
      evaluateNssRequirement('nss-key-establishment', keyCase).status,
      evaluateNssRequirement('nss-key-establishment', missing).status,
      evaluateNssRequirement('nss-software-signing', signingCase).status,
    ]).toEqual(['match', 'needs-input', 'match'])
    expect([keyCase, missing, signingCase]).toEqual(before)
  })
})
