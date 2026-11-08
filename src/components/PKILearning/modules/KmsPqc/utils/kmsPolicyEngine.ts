// SPDX-License-Identifier: AGPL-3.0-only
//
// Limited pattern checks for a sample IAM policy fragment. This is not an IAM
// permission evaluator: other Allow/Deny statements, attached policies and
// principal/resource context can change effective permissions. Finding the
// patterns below does not prove ML-DSA-only key creation or validate all keys.

export const ML_DSA_KEY_SPECS = ['ML_DSA_44', 'ML_DSA_65', 'ML_DSA_87'] as const
/** AWS KMS ML-KEM key specs (key usage ENCAPSULATE_DECAPSULATE), available since 26 October 2026. */
export const ML_KEM_KEY_SPECS = ['ML_KEM_512', 'ML_KEM_768', 'ML_KEM_1024'] as const

export interface PolicyValidationResult {
  isValidJson: boolean
  allowsCreateKey: boolean
  restrictsKeySpecToMlDsa: boolean
  requiresSignVerify: boolean
  /**
   * Optional extra pattern, not part of the lab's required task: one Allow statement on
   * kms:CreateKey limits kms:KeySpec to ML-KEM specs and kms:KeyUsage to ENCAPSULATE_DECAPSULATE.
   */
  allowsMlKemKeyEstablishment: boolean
  /** Legacy field name: only means no TLS-like key names were detected. */
  usesOnlyRealConditionKeys: boolean
  /** Condition keys that look like TLS / cipher-suite controls AWS does not have. */
  inventedKeys: string[]
  /** Completion of the pattern-finding exercise, not effective-policy validation. */
  isComplete: boolean
  errorMessage?: string
}

type Statement = Record<string, unknown>

const asArray = (v: unknown): unknown[] => (Array.isArray(v) ? v : v === undefined ? [] : [v])

/** Every condition key used anywhere in a statement's Condition block. */
function conditionKeys(statement: Statement): string[] {
  const cond = statement.Condition
  if (!cond || typeof cond !== 'object') return []
  return Object.values(cond as Record<string, unknown>).flatMap((block) =>
    block && typeof block === 'object' ? Object.keys(block as Record<string, unknown>) : []
  )
}

/** Values given for `key` under a StringEquals (or StringEqualsIgnoreCase) operator. */
function equalsValues(statement: Statement, key: string): string[] | null {
  const cond = statement.Condition
  if (!cond || typeof cond !== 'object') return null
  for (const [op, block] of Object.entries(cond as Record<string, unknown>)) {
    if (!/^StringEquals(IgnoreCase)?$/.test(op) || !block || typeof block !== 'object') continue
    const v = (block as Record<string, unknown>)[key]
    if (v !== undefined) return asArray(v).map(String)
  }
  return null
}

/** A key that pretends to test TLS: no AWS global or KMS condition key does. */
const looksLikeTlsKey = (k: string) => /tls|cipher|keyexchange|key_exchange/i.test(k)

export function validateKmsPqcPolicy(jsonString: string): PolicyValidationResult {
  const result: PolicyValidationResult = {
    isValidJson: false,
    allowsCreateKey: false,
    restrictsKeySpecToMlDsa: false,
    requiresSignVerify: false,
    allowsMlKemKeyEstablishment: false,
    usesOnlyRealConditionKeys: true,
    inventedKeys: [],
    isComplete: false,
  }

  let policy: Record<string, unknown>
  try {
    policy = JSON.parse(jsonString) as Record<string, unknown>
    result.isValidJson = true
  } catch {
    result.errorMessage = 'Invalid JSON syntax.'
    return result
  }

  if (!policy || typeof policy !== 'object' || Array.isArray(policy)) {
    result.errorMessage = 'Expected a JSON policy object.'
    return result
  }

  if (!Array.isArray(policy.Statement)) {
    result.errorMessage = 'The policy must contain a "Statement" array.'
    return result
  }

  if (!policy.Statement.every((s) => s !== null && typeof s === 'object' && !Array.isArray(s))) {
    result.errorMessage = 'Each Statement must be a JSON object.'
    return result
  }

  for (const s of policy.Statement as Statement[]) {
    result.inventedKeys.push(...conditionKeys(s).filter(looksLikeTlsKey))
    if (s.Effect !== 'Allow') continue
    const actions = asArray(s.Action).map(String)
    if (!actions.includes('kms:CreateKey')) continue
    result.allowsCreateKey = true
    const specs = equalsValues(s, 'kms:KeySpec')
    if (
      specs &&
      specs.length > 0 &&
      specs.every((v) => (ML_DSA_KEY_SPECS as readonly string[]).includes(v))
    ) {
      result.restrictsKeySpecToMlDsa = true
    }
    const usage = equalsValues(s, 'kms:KeyUsage')
    if (usage && usage.length === 1 && usage[0] === 'SIGN_VERIFY') result.requiresSignVerify = true
    if (
      specs &&
      specs.length > 0 &&
      specs.every((v) => (ML_KEM_KEY_SPECS as readonly string[]).includes(v)) &&
      usage &&
      usage.length === 1 &&
      usage[0] === 'ENCAPSULATE_DECAPSULATE'
    ) {
      result.allowsMlKemKeyEstablishment = true
    }
  }

  result.usesOnlyRealConditionKeys = result.inventedKeys.length === 0
  result.isComplete =
    result.allowsCreateKey &&
    result.restrictsKeySpecToMlDsa &&
    result.requiresSignVerify &&
    result.usesOnlyRealConditionKeys

  if (!result.isComplete) {
    if (!result.usesOnlyRealConditionKeys)
      result.errorMessage = `AWS has no condition key for TLS cipher suites or key exchange (${result.inventedKeys.join(', ')}). Post-quantum TLS is a client setting; a policy cannot require it.`
    else if (!result.allowsCreateKey)
      result.errorMessage = 'Add an "Allow" statement for the "kms:CreateKey" action.'
    else if (!result.restrictsKeySpecToMlDsa)
      result.errorMessage =
        'Restrict "kms:KeySpec" (StringEquals) to ML-DSA key specs only: ML_DSA_44, ML_DSA_65 or ML_DSA_87.'
    else if (!result.requiresSignVerify)
      result.errorMessage = 'Require "kms:KeyUsage" to be "SIGN_VERIFY" (StringEquals).'
  }

  return result
}
