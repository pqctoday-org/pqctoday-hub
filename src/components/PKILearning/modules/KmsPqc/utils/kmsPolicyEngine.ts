// SPDX-License-Identifier: GPL-3.0-only

export interface PolicyValidationResult {
  isValidJson: boolean
  hasDenyStatement: boolean
  enforcesPqcCipherSuite: boolean
  protectsDecryptAction: boolean
  isFullySecure: boolean
  errorMessage?: string
}

/**
 * Validates an AWS KMS Key Policy JSON to ensure it strictly enforces
 * Post-Quantum Cryptography (PQC) hybrid TLS connections for decryption operations.
 *
 * @param jsonString The raw JSON policy string submitted by the user
 */
export function validateKmsPqcPolicy(jsonString: string): PolicyValidationResult {
  const result: PolicyValidationResult = {
    isValidJson: false,
    hasDenyStatement: false,
    enforcesPqcCipherSuite: false,
    protectsDecryptAction: false,
    isFullySecure: false,
  }

  let policy: Record<string, unknown>
  try {
    policy = JSON.parse(jsonString) as Record<string, unknown>
    result.isValidJson = true
  } catch {
    result.errorMessage = 'Invalid JSON syntax.'
    return result
  }

  if (!policy.Statement || !Array.isArray(policy.Statement)) {
    result.errorMessage = 'Policy must contain a "Statement" array.'
    return result
  }

  for (const statement of policy.Statement as Array<Record<string, unknown>>) {
    // Look for a Deny statement
    if (statement.Effect === 'Deny') {
      result.hasDenyStatement = true

      // Check if it protects kms:Decrypt or kms:*
      const actions = Array.isArray(statement.Action) ? statement.Action : [statement.Action]
      if (actions.some((a) => a === 'kms:Decrypt' || a === 'kms:*')) {
        result.protectsDecryptAction = true
      }

      // Check if the condition enforces PQC TLS
      if (statement.Condition && typeof statement.Condition === 'object') {
        const condObj = statement.Condition as Record<string, unknown>
        // Typically, you deny if StringNotEquals is missing a PQ cipher suite
        const stringNotEquals = condObj.StringNotEquals || condObj.StringNotLike
        if (stringNotEquals && typeof stringNotEquals === 'object') {
          const cipherSuite = (stringNotEquals as Record<string, unknown>)['aws:tlsCipherSuites']
          const suites = Array.isArray(cipherSuite) ? cipherSuite : [cipherSuite]
          if (suites.some((s) => typeof s === 'string' && s.includes('_PQ'))) {
            result.enforcesPqcCipherSuite = true
          }
        }
      }
    }
  }

  result.isFullySecure =
    result.isValidJson &&
    result.hasDenyStatement &&
    result.protectsDecryptAction &&
    result.enforcesPqcCipherSuite

  if (!result.isFullySecure && !result.errorMessage) {
    if (!result.hasDenyStatement) result.errorMessage = 'Missing an explicit "Deny" statement.'
    else if (!result.protectsDecryptAction)
      result.errorMessage = 'The Deny statement must target "kms:Decrypt".'
    else if (!result.enforcesPqcCipherSuite)
      result.errorMessage =
        'The Condition must enforce "aws:tlsCipherSuites" containing a "_PQ" cipher suite (e.g., using StringNotEquals).'
  }

  return result
}
