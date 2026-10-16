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
  it('passes an IAM policy that allows only ML-DSA signing keys', () => {
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
    const r = validateKmsPqcPolicy(policy([{ Effect: 'Allow', Action: 'kms:Sign', Resource: '*' }]))
    expect(r.allowsCreateKey).toBe(false)
    expect(r.errorMessage).toMatch(/kms:CreateKey/)
  })

  it('reports invalid JSON', () => {
    const r = validateKmsPqcPolicy('{ not json')
    expect(r.isValidJson).toBe(false)
    expect(r.errorMessage).toBe('Invalid JSON syntax.')
  })
})
