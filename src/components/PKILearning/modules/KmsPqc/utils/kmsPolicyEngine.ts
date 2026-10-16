// SPDX-License-Identifier: GPL-3.0-only
//
// Grader for the AWS KMS policy lab. The lab's task is an IAM policy for the
// people who create KMS keys: they may create ML-DSA signing keys only. Every
// check below uses a control AWS documents:
//   - kms:CreateKey is authorised by IAM policy (a key policy cannot govern
//     the creation of a key that does not exist yet);
//   - kms:KeySpec and kms:KeyUsage are KMS condition keys evaluated on
//     CreateKey; ML-DSA keys use the specs ML_DSA_44/65/87 and SIGN_VERIFY.
// Post-quantum TLS to the KMS endpoint is NOT something a policy can require:
// it is a client setting, verified afterwards in CloudTrail. The grader
// therefore rejects any condition key that claims to test a TLS cipher suite
// or key exchange — no such AWS key exists.

export const ML_DSA_KEY_SPECS = ['ML_DSA_44', 'ML_DSA_65', 'ML_DSA_87'] as const

export interface PolicyValidationResult {
  isValidJson: boolean
  allowsCreateKey: boolean
  restrictsKeySpecToMlDsa: boolean
  requiresSignVerify: boolean
  usesOnlyRealConditionKeys: boolean
  /** Condition keys that look like TLS / cipher-suite controls AWS does not have. */
  inventedKeys: string[]
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

  if (!Array.isArray(policy.Statement)) {
    result.errorMessage = 'The policy must contain a "Statement" array.'
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
