// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import { validateKmsPqcPolicy } from './kmsPolicyEngine'

const policy = (statements: unknown[]) =>
  JSON.stringify({ Version: '2012-10-17', Statement: statements })

const createKey = (condition: unknown) => ({
  Sid: 'CreateMlDsaSigningKeysOnly',
  Effect: 'Allow',
  Action: 'kms:CreateKey',
  Resource: '*',
  Condition: condition,
})

describe('validateKmsPqcPolicy', () => {
  it('passes the supported sample fragment with restricted CreateKey Allow paths', () => {
    const r = validateKmsPqcPolicy(
      policy([
        createKey({
          StringEquals: {
            'kms:KeySpec': ['ML_DSA_65', 'ML_DSA_87'],
            'kms:KeyUsage': 'SIGN_VERIFY',
          },
        }),
      ])
    )
    expect(r.isComplete).toBe(true)
    expect(r.errorMessage).toBeUndefined()
  })

  it('rejects the invented TLS cipher-suite condition the lab used to teach', () => {
    const r = validateKmsPqcPolicy(
      policy([
        {
          Effect: 'Deny',
          Principal: '*',
          Action: 'kms:Decrypt',
          Resource: '*',
          Condition: { StringNotEquals: { 'aws:tlsCipherSuites': 'TLS_AES_256_GCM_SHA384_PQ' } },
        },
        createKey({
          StringEquals: { 'kms:KeySpec': 'ML_DSA_65', 'kms:KeyUsage': 'SIGN_VERIFY' },
        }),
      ])
    )
    expect(r.usesOnlyRealConditionKeys).toBe(false)
    expect(r.inventedKeys).toEqual(['aws:tlsCipherSuites'])
    expect(r.isComplete).toBe(false)
    expect(r.errorMessage).toMatch(/no condition key for TLS/)
  })

  it('requires the key spec to be ML-DSA only', () => {
    const r = validateKmsPqcPolicy(
      policy([
        createKey({
          StringEquals: { 'kms:KeySpec': ['ML_DSA_65', 'RSA_3072'], 'kms:KeyUsage': 'SIGN_VERIFY' },
        }),
      ])
    )
    expect(r.restrictsKeySpecToMlDsa).toBe(false)
    expect(r.errorMessage).toMatch(/ML_DSA_44, ML_DSA_65 or ML_DSA_87/)
  })

  it('requires SIGN_VERIFY key usage', () => {
    const r = validateKmsPqcPolicy(
      policy([
        createKey({
          StringEquals: { 'kms:KeySpec': 'ML_DSA_44', 'kms:KeyUsage': 'ENCRYPT_DECRYPT' },
        }),
      ])
    )
    expect(r.restrictsKeySpecToMlDsa).toBe(true)
    expect(r.requiresSignVerify).toBe(false)
  })

  it('needs an Allow on kms:CreateKey', () => {
    const r = validateKmsPqcPolicy(
      policy([{ Effect: 'Allow', Action: 'kms:DescribeKey', Resource: '*' }])
    )
    expect(r.allowsCreateKey).toBe(false)
    expect(r.errorMessage).toMatch(/kms:CreateKey/)
  })

  it('reports invalid JSON', () => {
    const r = validateKmsPqcPolicy('{ not json')
    expect(r.isValidJson).toBe(false)
    expect(r.errorMessage).toBe('Invalid JSON syntax.')
  })
})

describe('ML-KEM key establishment pattern', () => {
  it('finds ML-KEM key specs limited to ENCAPSULATE_DECAPSULATE, separately from the ML-DSA task', () => {
    const r = validateKmsPqcPolicy(
      policy([
        createKey({
          StringEquals: {
            'kms:KeySpec': ['ML_KEM_768', 'ML_KEM_1024'],
            'kms:KeyUsage': 'ENCAPSULATE_DECAPSULATE',
          },
        }),
      ])
    )
    expect(r.allowsMlKemKeyEstablishment).toBe(true)
    expect(r.restrictsKeySpecToMlDsa).toBe(false)
    expect(r.isComplete).toBe(false)
  })

  it('does not accept an ML-KEM spec with signing usage, or a mixed spec list', () => {
    const wrongUsage = validateKmsPqcPolicy(
      policy([
        createKey({ StringEquals: { 'kms:KeySpec': 'ML_KEM_768', 'kms:KeyUsage': 'SIGN_VERIFY' } }),
      ])
    )
    expect(wrongUsage.allowsMlKemKeyEstablishment).toBe(false)
    const mixed = validateKmsPqcPolicy(
      policy([
        createKey({
          StringEquals: {
            'kms:KeySpec': ['ML_KEM_768', 'ML_DSA_65'],
            'kms:KeyUsage': 'ENCAPSULATE_DECAPSULATE',
          },
        }),
      ])
    )
    expect(mixed.allowsMlKemKeyEstablishment).toBe(false)
  })
})

describe('malformed policy structures', () => {
  it.each(['null', '[]', '"text"', '{"Statement":[null]}', '{"Statement":[4]}'])(
    'handles %s without throwing',
    (input) => {
      const result = validateKmsPqcPolicy(input)
      expect(result.isComplete).toBe(false)
      expect(result.errorMessage).toBeTruthy()
    }
  )
})
