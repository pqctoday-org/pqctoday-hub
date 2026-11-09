// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vitest'
import { validateKmsPqcPolicy, ML_DSA_KEY_SPECS } from './kmsPolicyEngine'

const both = {
  StringEquals: { 'kms:KeySpec': ['ML_DSA_65', 'ML_DSA_87'], 'kms:KeyUsage': 'SIGN_VERIFY' },
}
const create = (Condition: unknown = both) => ({
  Effect: 'Allow',
  Action: 'kms:CreateKey',
  Resource: '*',
  Condition,
})
const admin = {
  Effect: 'Allow',
  Action: ['kms:DescribeKey', 'kms:ListKeys', 'kms:TagResource'],
  Resource: '*',
}
const policy = (Statement: unknown[], extra = {}) =>
  JSON.stringify({ Version: '2012-10-17', Statement, ...extra })
const check = (Statement: unknown[]) => validateKmsPqcPolicy(policy(Statement))

describe('declared sample fragment — actual per-Allow constraints', () => {
  it('IAM-01 initial administration alone is supported but has no CreateKey grant', () => {
    expect(check([admin])).toMatchObject({
      isSupportedSubset: true,
      allowsCreateKey: false,
      isComplete: false,
    })
  })
  it.each(ML_DSA_KEY_SPECS)(
    'IAM-02/03 evaluates the same-statement selected profile %s',
    (spec) => {
      const result = check([
        admin,
        create({ StringEquals: { 'kms:KeySpec': spec, 'kms:KeyUsage': 'SIGN_VERIFY' } }),
      ])
      expect(result).toMatchObject({ isValidJson: true, isSupportedSubset: true, isComplete: true })
      expect(result.errorMessage).toBeUndefined()
    }
  )
  it('IAM-04 accepts multiple independently restricted paths; one path cannot donate a restriction', () => {
    expect(check([create(), create()]).isComplete).toBe(true)
    const split = check([
      create({ StringEquals: { 'kms:KeySpec': 'ML_DSA_65' } }),
      create({ StringEquals: { 'kms:KeyUsage': 'SIGN_VERIFY' } }),
    ])
    expect(split).toMatchObject({
      isSupportedSubset: true,
      allowsCreateKey: true,
      restrictsKeySpecToMlDsa: false,
      requiresSignVerify: false,
      isComplete: false,
    })
    expect(split.errorMessage).toContain('Statement 1')
    expect(split.errorMessage).toContain('Statement 2')
  })
  it('IAM-06 an extra unconditional grant prevents completion, including after a valid grant', () => {
    const extra = { Effect: 'Allow', Action: 'kms:CreateKey', Resource: '*' }
    for (const rows of [
      [create(), extra],
      [extra, create()],
    ])
      expect(check(rows)).toMatchObject({
        isSupportedSubset: true,
        isComplete: false,
        restrictsKeySpecToMlDsa: false,
        requiresSignVerify: false,
      })
  })
  it('IAM-07 rejects outside spec/usage alternatives, rather than matching one allowed item', () => {
    expect(
      check([
        create({
          StringEquals: { 'kms:KeySpec': ['ML_DSA_65', 'RSA_3072'], 'kms:KeyUsage': 'SIGN_VERIFY' },
        }),
      ])
    ).toMatchObject({ isSupportedSubset: true, restrictsKeySpecToMlDsa: false, isComplete: false })
    expect(
      check([
        create({
          StringEquals: {
            'kms:KeySpec': 'ML_DSA_65',
            'kms:KeyUsage': ['SIGN_VERIFY', 'ENCRYPT_DECRYPT'],
          },
        }),
      ])
    ).toMatchObject({ isSupportedSubset: true, requiresSignVerify: false, isComplete: false })
  })
  it('IAM-08/09 honors operator value case and case-insensitive condition-key names', () => {
    const values = { 'KMS:KEYSPEC': 'ml_dsa_65', 'KMS:KEYUSAGE': 'sign_verify' }
    expect(check([create({ StringEqualsIgnoreCase: values })]).isComplete).toBe(true)
    expect(check([create({ StringEquals: values })])).toMatchObject({
      isSupportedSubset: true,
      isComplete: false,
    })
  })
  it.each([null, undefined, [], ['*', '*'], 3, {}, 'arn:aws:kms:region:account:key/example'])(
    'IAM-10 does not ignore unsupported Resource %j',
    (Resource) => {
      expect(check([{ ...create(), Resource }])).toMatchObject({
        isSupportedSubset: false,
        isComplete: false,
        errorMessage: expect.stringContaining('Resource'),
      })
    }
  )
  it('IAM-10/17 accepts the one-element resource array and duplicate identical alternatives', () => {
    const result = check([
      {
        ...create({
          StringEquals: {
            'kms:KeySpec': ['ML_DSA_65', 'ML_DSA_65'],
            'kms:KeyUsage': ['SIGN_VERIFY', 'SIGN_VERIFY'],
          },
        }),
        Resource: ['*'],
      },
    ])
    expect(result.isComplete).toBe(true)
  })
  it.each([
    {
      StringEquals: {
        'kms:KeySpec': 'ML_DSA_65',
        'kms:KeyUsage': 'SIGN_VERIFY',
        'sample:Unknown': 'x',
      },
    },
    { ...both, Bool: { 'sample:Unknown': true } },
    { StringNotEquals: { 'kms:KeySpec': 'RSA_3072' } },
    { StringEquals: {} },
    null,
    [],
    3,
  ])('IAM-11 unsupported/malformed conditions cannot be ignored: %j', (condition) => {
    expect(check([create(condition)])).toMatchObject({
      isSupportedSubset: false,
      isComplete: false,
      errorMessage: expect.stringContaining('sample check'),
    })
  })
  it.each([
    { ...create(), Effect: 'Deny' },
    { ...create(), Principal: '*' },
    { ...create(), NotAction: 'kms:Sign' },
    { ...create(), NotResource: '*' },
    { ...create(), Action: 'kms:*' },
    { ...create(), Action: '*' },
    { ...create(), Action: ['kms:CreateKey', 'kms:*'] },
  ])('IAM-12 does not give a guessed verdict for unsupported statement %j', (statement) => {
    expect(check([create(), statement])).toMatchObject({
      isSupportedSubset: false,
      isComplete: false,
      errorMessage: expect.stringContaining('not an AWS deny verdict'),
    })
  })
  it('IAM-13 rejects multiple operators and case-duplicate keys instead of selecting the first', () => {
    for (const condition of [
      { ...both, StringEqualsIgnoreCase: { 'kms:KeySpec': 'ml_dsa_65' } },
      {
        StringEquals: {
          'kms:KeySpec': 'ML_DSA_65',
          'KMS:KEYSPEC': 'RSA_3072',
          'kms:KeyUsage': 'SIGN_VERIFY',
        },
      },
    ])
      expect(check([create(condition)])).toMatchObject({
        isSupportedSubset: false,
        isComplete: false,
      })
  })
  it.each([null, true, 65, {}, [], ['ML_DSA_65', null], ['ML_DSA_65', 1], ''])(
    'IAM-14 never coerces a malformed operand %j',
    (operand) => {
      expect(
        check([create({ StringEquals: { 'kms:KeySpec': operand, 'kms:KeyUsage': 'SIGN_VERIFY' } })])
      ).toMatchObject({ isSupportedSubset: false, isComplete: false })
      expect(
        check([create({ StringEquals: { 'kms:KeySpec': 'ML_DSA_65', 'kms:KeyUsage': operand } })])
      ).toMatchObject({ isSupportedSubset: false, isComplete: false })
    }
  )
  it.each([
    'null',
    '[]',
    'true',
    '{"Statement":[null]}',
    '{"Version":"2012-10-17","Statement":[]}',
  ])('IAM-15 rejects malformed structure without a crash: %s', (json) => {
    expect(validateKmsPqcPolicy(json)).toMatchObject({
      isComplete: false,
      isSupportedSubset: false,
      errorMessage: expect.any(String),
    })
  })
  it('IAM-16 unsupported input anywhere is not hidden by an otherwise valid path', () => {
    for (const input of [
      policy([create()], { Unknown: true }),
      policy([create()], { Version: null }),
      policy([create()], { Id: null }),
      policy([create(), { ...admin, Sid: null }]),
      policy([create(), { ...admin, Action: 'kms:Sign' }]),
      policy([create(), { ...admin, Unknown: true }]),
    ]) {
      expect(validateKmsPqcPolicy(input)).toMatchObject({
        isSupportedSubset: false,
        isComplete: false,
      })
    }
  })
  it('IAM-19 retains the narrow TLS diagnostic without calling it a real-key whitelist', () => {
    const result = check([
      create({ StringEquals: { ...both.StringEquals, 'aws:tlsCipherSuites': 'test' } }),
    ])
    expect(result).toMatchObject({
      isComplete: false,
      isSupportedSubset: false,
      usesOnlyRealConditionKeys: false,
      inventedKeys: ['aws:tlsCipherSuites'],
    })
    expect(result.errorMessage).toContain('Post-quantum TLS is a client setting')
  })
})

describe('duplicate-member ambiguity is rejected without a replacement JSON parser', () => {
  const goodStatement = JSON.stringify(create())
  it.each([
    `{"Version":"2012-10-17","Statement":[],"Statement":[${goodStatement}]}`,
    policy([create()]).replace('"Effect":"Allow"', '"Effect":"Deny","Effect":"Allow"'),
    policy([create()]).replace(
      '"Condition":',
      '"Condition":{"Bool":{"unknown":true}},"Condition":'
    ),
    policy([create()]).replace('"kms:KeySpec":', '"kms:KeySpec":"RSA_3072","kms:KeySpec":'),
    policy([create()]).replace('"Effect":"Allow"', '"Effect":"Deny","\\u0045ffect":"Allow"'),
  ])('cannot lose an earlier duplicate member before subset evaluation: %s', (raw) => {
    expect(validateKmsPqcPolicy(raw)).toMatchObject({
      isValidJson: true,
      isSupportedSubset: false,
      isComplete: false,
      errorMessage: expect.stringContaining('duplicate JSON member'),
    })
  })
  it('allows the same legitimate member name in separate nested objects and statement arrays', () => {
    expect(check([admin, create(), create()]).isComplete).toBe(true)
  })
  it('ignores braces, colons, quotes and escaped quotes inside actual string values', () => {
    const Id = 'value { : "Statement": [{"Effect":"Deny"}] } \\ " end'
    const Sid = 'more } ], : "Effect" \\"'
    expect(validateKmsPqcPolicy(policy([{ ...create(), Sid }], { Id }))).toMatchObject({
      isSupportedSubset: true,
      isComplete: true,
    })
  })
  it('still rejects native syntax errors rather than accepting them in the scanner', () => {
    expect(validateKmsPqcPolicy('{"Statement":')).toMatchObject({
      isValidJson: false,
      isSupportedSubset: false,
      isComplete: false,
      errorMessage: 'Invalid JSON syntax.',
    })
  })
})

describe('current optional ML-KEM pattern remains separate from signing completion', () => {
  const kem = create({
    StringEquals: {
      'kms:KeySpec': ['ML_KEM_768', 'ML_KEM_1024'],
      'kms:KeyUsage': 'ENCAPSULATE_DECAPSULATE',
    },
  })
  it('detects pure and mixed KEM paths without completing the signing-only task', () => {
    for (const statements of [[kem], [create(), kem]]) {
      expect(check(statements)).toMatchObject({
        isSupportedSubset: true,
        allowsMlKemKeyEstablishment: true,
        isComplete: false,
      })
    }
    expect(check([create()])).toMatchObject({
      allowsMlKemKeyEstablishment: false,
      isComplete: true,
    })
  })
  it('never accumulates KEM spec and usage across statements', () => {
    expect(
      check([
        create({ StringEquals: { 'kms:KeySpec': 'ML_KEM_768' } }),
        create({ StringEquals: { 'kms:KeyUsage': 'ENCAPSULATE_DECAPSULATE' } }),
      ])
    ).toMatchObject({ allowsMlKemKeyEstablishment: false, isComplete: false })
  })
  it('keeps optional detection false on unsupported input, even after a matching path', () => {
    expect(check([kem, { ...kem, Effect: 'Deny' }])).toMatchObject({
      isSupportedSubset: false,
      allowsMlKemKeyEstablishment: false,
      isComplete: false,
    })
  })
  it('respects equality operator case semantics for the optional pattern', () => {
    const values = { 'kms:KeySpec': 'ml_kem_768', 'kms:KeyUsage': 'encapsulate_decapsulate' }
    expect(check([create({ StringEquals: values })]).allowsMlKemKeyEstablishment).toBe(false)
    expect(check([create({ StringEqualsIgnoreCase: values })])).toMatchObject({
      allowsMlKemKeyEstablishment: true,
      isComplete: false,
    })
  })
})
