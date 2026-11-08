// SPDX-License-Identifier: AGPL-3.0-only
// Local constraint evaluation of a declared Allow-only sample fragment. This
// does not evaluate effective AWS/account permissions or attached policy context.

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
  inventedKeys: string[]
  /** All input features are within this lab's explicitly declared subset. */
  isSupportedSubset: boolean
  /** Every CreateKey Allow path in the supported fragment meets both constraints. */
  isComplete: boolean
  errorMessage?: string
}

type JsonObject = Record<string, unknown>
type Conditions = { specs?: string[]; usage?: string[]; ignoreCase: boolean }
type CheckedStatement = { index: number; actions: string[]; condition?: Conditions }

const SAMPLE_ACTIONS = new Set([
  'kms:DescribeKey',
  'kms:ListKeys',
  'kms:TagResource',
  'kms:CreateKey',
])
const isObject = (value: unknown): value is JsonObject =>
  value !== null && typeof value === 'object' && !Array.isArray(value)
const strings = (value: unknown): string[] | null => {
  const values = typeof value === 'string' ? [value] : value
  return Array.isArray(values) &&
    values.length > 0 &&
    values.every((v) => typeof v === 'string' && v.length > 0)
    ? values
    : null
}
const extraKeys = (value: JsonObject, supported: string[]) =>
  Object.keys(value).filter((key) => !supported.includes(key))
const looksLikeTlsKey = (key: string) => /tls|cipher|keyexchange|key_exchange/i.test(key)

function conditionKeys(statement: JsonObject): string[] {
  if (!isObject(statement.Condition)) return []
  return Object.values(statement.Condition).flatMap((block) =>
    isObject(block) ? Object.keys(block) : []
  )
}

/** JSON.parse already accepted syntax. This scan only rejects duplicate decoded
 * member names per object; it never parses values or changes accepted syntax. */
function duplicateMember(raw: string): string | null {
  const frames: { object: boolean; expectingKey: boolean; keys: Set<string> }[] = []
  for (let cursor = 0; cursor < raw.length; cursor++) {
    const char = raw.charAt(cursor)
    if (char === '"') {
      let end = cursor + 1
      while (end < raw.length) {
        if (raw.charAt(end) === '\\') end += 2
        else if (raw.charAt(end) === '"') break
        else end++
      }
      const frame = frames.at(-1)
      if (frame?.object && frame.expectingKey) {
        const key = JSON.parse(raw.slice(cursor, end + 1)) as string
        if (frame.keys.has(key)) return key
        frame.keys.add(key)
        frame.expectingKey = false
      }
      cursor = end
    } else if (char === '{' || char === '[') {
      frames.push({ object: char === '{', expectingKey: char === '{', keys: new Set() })
    } else if (char === '}' || char === ']') frames.pop()
    else if (char === ',' && frames.at(-1)?.object) frames.at(-1)!.expectingKey = true
  }
  return null
}

/** No unknown feature is silently ignored and no value is coerced to a string. */
export function validateKmsPqcPolicy(jsonString: string): PolicyValidationResult {
  const result: PolicyValidationResult = {
    isValidJson: false,
    allowsCreateKey: false,
    restrictsKeySpecToMlDsa: false,
    requiresSignVerify: false,
    allowsMlKemKeyEstablishment: false,
    usesOnlyRealConditionKeys: true,
    inventedKeys: [],
    isSupportedSubset: false,
    isComplete: false,
  }
  let policy: unknown
  try {
    policy = JSON.parse(jsonString)
    result.isValidJson = true
  } catch {
    result.errorMessage = 'Invalid JSON syntax.'
    return result
  }
  const duplicate = duplicateMember(jsonString)
  if (duplicate !== null) {
    result.errorMessage = `Unsupported in this sample check: duplicate JSON member ${JSON.stringify(duplicate)}. Earlier input cannot be assessed; this is not an AWS deny verdict.`
    return result
  }
  if (!isObject(policy)) {
    result.errorMessage = 'Expected a JSON policy object.'
    return result
  }
  if (!Array.isArray(policy.Statement) || policy.Statement.length === 0) {
    result.errorMessage = 'The policy must contain a nonempty "Statement" array.'
    return result
  }
  if (!policy.Statement.every(isObject)) {
    result.errorMessage = 'Each Statement must be a JSON object.'
    return result
  }
  const statements = policy.Statement as JsonObject[]
  result.inventedKeys = [...new Set(statements.flatMap(conditionKeys).filter(looksLikeTlsKey))]
  result.usesOnlyRealConditionKeys = result.inventedKeys.length === 0
  if (!result.usesOnlyRealConditionKeys) {
    result.errorMessage = `AWS has no condition key for TLS cipher suites or key exchange (${result.inventedKeys.join(', ')}). Post-quantum TLS is a client setting; a policy cannot require it.`
    return result
  }
  const unsupported = (reason: string): PolicyValidationResult => {
    result.errorMessage = `Unsupported or malformed in this sample check: ${reason} No completed subset result is available; this is not an AWS deny verdict.`
    return result
  }
  if (policy.Version !== '2012-10-17') return unsupported('Version must be "2012-10-17".')
  if (extraKeys(policy, ['Version', 'Statement', 'Id']).length)
    return unsupported('Unrecognized policy member.')
  if (policy.Id !== undefined && typeof policy.Id !== 'string')
    return unsupported('Id must be a string.')

  const checked: CheckedStatement[] = []
  for (const [position, statement] of statements.entries()) {
    const at = `Statement ${position + 1}`
    if (extraKeys(statement, ['Sid', 'Effect', 'Action', 'Resource', 'Condition']).length)
      return unsupported(`${at} has an unrecognized member.`)
    if (statement.Sid !== undefined && typeof statement.Sid !== 'string')
      return unsupported(`${at} Sid must be a string.`)
    if (statement.Effect !== 'Allow')
      return unsupported(`${at} only Effect "Allow" is supported; Deny is not evaluated.`)
    const actions = strings(statement.Action)
    if (!actions || actions.some((action) => !SAMPLE_ACTIONS.has(action)))
      return unsupported(
        `${at} Action must name only the four declared sample actions; wildcards and other actions are not evaluated.`
      )
    if (!(
      statement.Resource === '*' ||
      (Array.isArray(statement.Resource) &&
        statement.Resource.length === 1 &&
        statement.Resource[0] === '*')
    ))
      return unsupported(`${at} Resource must be "*" or ["*"].`)
    let condition: Conditions | undefined
    if (Object.hasOwn(statement, 'Condition')) {
      if (!isObject(statement.Condition)) return unsupported(`${at} Condition must be an object.`)
      const operators = Object.entries(statement.Condition)
      if (operators.length !== 1)
        return unsupported(`${at} Condition must contain exactly one supported equality operator.`)
      const [operator, block] = operators[0]
      if (
        !['StringEquals', 'StringEqualsIgnoreCase'].includes(operator) ||
        !isObject(block) ||
        Object.keys(block).length === 0
      )
        return unsupported(`${at} supports one StringEquals or StringEqualsIgnoreCase object only.`)
      const keys = Object.keys(block).map((key) => key.toLowerCase())
      if (new Set(keys).size !== keys.length)
        return unsupported(`${at} contains duplicate case variants of a condition key.`)
      condition = { ignoreCase: operator === 'StringEqualsIgnoreCase' }
      for (const [key, value] of Object.entries(block)) {
        const canonical = key.toLowerCase()
        if (!['kms:keyspec', 'kms:keyusage'].includes(canonical))
          return unsupported(`${at} condition key "${key}" is outside the declared sample subset.`)
        const values = strings(value)
        if (!values)
          return unsupported(
            `${at} ${key} must be a nonempty string or nonempty array of nonempty strings.`
          )
        if (canonical === 'kms:keyspec') condition.specs = values
        else condition.usage = values
      }
    }
    checked.push({ index: position + 1, actions, condition })
  }
  result.isSupportedSubset = true
  const creating = checked.filter((s) => s.actions.includes('kms:CreateKey'))
  result.allowsCreateKey = creating.length > 0
  const matches = (value: string, expected: string, ignoreCase: boolean) =>
    ignoreCase ? value.toLowerCase() === expected.toLowerCase() : value === expected
  const specIsRestricted = (s: CheckedStatement) =>
    !!s.condition?.specs?.length &&
    s.condition.specs.every((value) =>
      ML_DSA_KEY_SPECS.some((spec) => matches(value, spec, s.condition!.ignoreCase))
    )
  const usageIsRestricted = (s: CheckedStatement) =>
    !!s.condition?.usage?.length &&
    s.condition.usage.every((value) => matches(value, 'SIGN_VERIFY', s.condition!.ignoreCase))
  result.allowsMlKemKeyEstablishment = creating.some(
    (statement) =>
      !!statement.condition?.specs?.length &&
      statement.condition.specs.every((value) =>
        ML_KEM_KEY_SPECS.some((spec) => matches(value, spec, statement.condition!.ignoreCase))
      ) &&
      !!statement.condition.usage?.length &&
      statement.condition.usage.every((value) =>
        matches(value, 'ENCAPSULATE_DECAPSULATE', statement.condition!.ignoreCase)
      )
  )
  result.restrictsKeySpecToMlDsa = creating.length > 0 && creating.every(specIsRestricted)
  result.requiresSignVerify = creating.length > 0 && creating.every(usageIsRestricted)
  result.isComplete =
    result.allowsCreateKey && result.restrictsKeySpecToMlDsa && result.requiresSignVerify
  if (!result.allowsCreateKey)
    result.errorMessage = 'Add an "Allow" statement for the "kms:CreateKey" action.'
  else {
    const failures = creating.flatMap((s) => [
      ...(!specIsRestricted(s)
        ? [
            `Statement ${s.index}: restrict "kms:KeySpec" in this same Allow to ML_DSA_44, ML_DSA_65 or ML_DSA_87.`,
          ]
        : []),
      ...(!usageIsRestricted(s)
        ? [`Statement ${s.index}: require "kms:KeyUsage" to be "SIGN_VERIFY" in this same Allow.`]
        : []),
    ])
    if (failures.length) result.errorMessage = failures.join(' ')
  }
  return result
}
