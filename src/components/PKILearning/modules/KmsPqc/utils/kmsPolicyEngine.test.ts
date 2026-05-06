// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import { validateKmsPqcPolicy } from './kmsPolicyEngine'

describe('validateKmsPqcPolicy', () => {
  it('should pass a fully secure PQC-enforcing policy', () => {
    const validPolicy = `
    {
      "Version": "2012-10-17",
      "Statement": [
        {
          "Sid": "EnforceHybridPQCTLS",
          "Effect": "Deny",
          "Principal": "*",
          "Action": "kms:Decrypt",
          "Resource": "*",
          "Condition": {
            "StringNotEquals": {
              "aws:tlsCipherSuites": "TLS_AES_256_GCM_SHA384_PQ"
            }
          }
        }
      ]
    }
    `
    const result = validateKmsPqcPolicy(validPolicy)
    expect(result.isValidJson).toBe(true)
    expect(result.hasDenyStatement).toBe(true)
    expect(result.protectsDecryptAction).toBe(true)
    expect(result.enforcesPqcCipherSuite).toBe(true)
    expect(result.isFullySecure).toBe(true)
    expect(result.errorMessage).toBeUndefined()
  })

  it('should fail if JSON is malformed', () => {
    const invalidJson = `{ "Version": "2012-10-17", "Statement": [ { "Effect": "Deny", ] }`
    const result = validateKmsPqcPolicy(invalidJson)
    expect(result.isValidJson).toBe(false)
    expect(result.isFullySecure).toBe(false)
    expect(result.errorMessage).toBe('Invalid JSON syntax.')
  })

  it('should fail if the policy does not target kms:Decrypt', () => {
    const wrongActionPolicy = `
    {
      "Statement": [
        {
          "Effect": "Deny",
          "Action": "kms:Encrypt",
          "Condition": {
            "StringNotEquals": { "aws:tlsCipherSuites": "TLS_AES_256_GCM_SHA384_PQ" }
          }
        }
      ]
    }`
    const result = validateKmsPqcPolicy(wrongActionPolicy)
    expect(result.protectsDecryptAction).toBe(false)
    expect(result.isFullySecure).toBe(false)
    expect(result.errorMessage).toContain('kms:Decrypt')
  })

  it('should fail if a classical-only cipher suite is specified', () => {
    const classicalPolicy = `
    {
      "Statement": [
        {
          "Effect": "Deny",
          "Action": "kms:Decrypt",
          "Condition": {
            "StringNotEquals": { "aws:tlsCipherSuites": "TLS_AES_256_GCM_SHA384" }
          }
        }
      ]
    }`
    const result = validateKmsPqcPolicy(classicalPolicy)
    expect(result.enforcesPqcCipherSuite).toBe(false)
    expect(result.isFullySecure).toBe(false)
    expect(result.errorMessage).toContain('_PQ')
  })
})
