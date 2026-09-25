// SPDX-License-Identifier: GPL-3.0-only
// The runtime schema-subset interpreter must agree with a full JSON Schema
// 2020-12 implementation (ajv, dev-only) on every pinned schema — on the real
// fixtures AND on malformed mutations — so the CSP-safe interpreter cannot
// silently accept what the schema file rejects (or vice versa).
import { describe, it, expect } from 'vitest'
import Ajv2020 from 'ajv/dist/2020'
import { validateAgainstSchema } from './schemaValidator'
import { PINNED_SCHEMAS } from './schemas/registry'
import evidenceSchema from './schemas/evidence.schema.json'
import { readFixture, type FixtureName } from './node/fixtures'

const ajv = new Ajv2020({
  strict: true,
  allErrors: true,
  allowUnionTypes: true,
  strictRequired: false,
})
const repo = process.cwd()

const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v)) as T

type Doc = Record<string, unknown> & { testGroups: Array<Record<string, unknown>> }

const promptOf = (name: FixtureName): Doc => JSON.parse(readFixture(repo, name, 'prompt.json'))

/** Mutations that must be rejected, each tagged with the path the interpreter must blame. */
const mutations: Record<FixtureName, Array<[string, (d: Doc) => void, string]>> = {
  'ML-KEM-encapDecap-FIPS203': [
    ['wrong revision', (d) => (d.revision = 'FIPS203-tr1'), '$.revision'],
    [
      'tr1 keyFormat group property',
      (d) => (d.testGroups[3].keyFormat = 'seed'),
      '$.testGroups[3].keyFormat',
    ],
    [
      'missing c',
      (d) => delete (d.testGroups[3].tests as Doc[])[0].c,
      '$.testGroups[3].tests[0].c',
    ],
    [
      'odd-length hex',
      (d) => ((d.testGroups[3].tests as Doc[])[1].dk = 'ABC'),
      '$.testGroups[3].tests[1].dk',
    ],
    [
      'non-hex',
      (d) => ((d.testGroups[0].tests as Doc[])[0].m = 'ZZ'),
      '$.testGroups[0].tests[0].m',
    ],
    [
      'decapsulation typed AFT',
      (d) => (d.testGroups[3].testType = 'AFT'),
      '$.testGroups[3].testType',
    ],
    ['unknown function', (d) => (d.testGroups[0].function = 'encaps'), '$.testGroups[0].function'],
    [
      'string tcId',
      (d) => ((d.testGroups[0].tests as Doc[])[0].tcId = '1'),
      '$.testGroups[0].tests[0].tcId',
    ],
    [
      'm on a decapsulation test',
      (d) => ((d.testGroups[4].tests as Doc[])[0].m = '00'),
      '$.testGroups[4].tests[0].m',
    ],
    [
      'unknown parameter set',
      (d) => (d.testGroups[1].parameterSet = 'ML-KEM-2048'),
      '$.testGroups[1].parameterSet',
    ],
    ['empty testGroups', (d) => (d.testGroups = []), '$.testGroups'],
    ['top-level extra', (d) => (d.url = 'x'), '$.url'],
  ],
  'ML-DSA-sigVer-FIPS204': [
    ['wrong revision', (d) => (d.revision = 'FIPS204-tr1'), '$.revision'],
    [
      'external group without preHash',
      (d) => delete d.testGroups[0].preHash,
      '$.testGroups[0].preHash',
    ],
    [
      'externalMu on external group',
      (d) => (d.testGroups[0].externalMu = true),
      '$.testGroups[0].externalMu',
    ],
    [
      'preHash on internal group',
      (d) => (d.testGroups[6].preHash = 'pure'),
      '$.testGroups[6].preHash',
    ],
    [
      'hashAlg on pure test',
      (d) => ((d.testGroups[0].tests as Doc[])[0].hashAlg = 'SHA2-256'),
      '$.testGroups[0].tests[0].hashAlg',
    ],
    [
      'unknown hashAlg',
      (d) => ((d.testGroups[1].tests as Doc[])[0].hashAlg = 'MD5'),
      '$.testGroups[1].tests[0].hashAlg',
    ],
    [
      'message on externalMu test',
      (d) => ((d.testGroups[6].tests as Doc[])[0].message = '00'),
      '$.testGroups[6].tests[0].message',
    ],
    [
      'context over 255 bytes',
      (d) => ((d.testGroups[0].tests as Doc[])[0].context = '00'.repeat(256)),
      '$.testGroups[0].tests[0].context',
    ],
    [
      'sigGen-style testType',
      (d) => (d.testGroups[0].testType = 'GDT'),
      '$.testGroups[0].testType',
    ],
    [
      'missing signature',
      (d) => delete (d.testGroups[2].tests as Doc[])[3].signature,
      '$.testGroups[2].tests[3].signature',
    ],
  ],
}

describe.each(PINNED_SCHEMAS.map((s) => [s.id, s] as const))('pinned schema %s', (id, schema) => {
  const fixture = (
    id === 'ML-KEM/encapDecap/FIPS203' ? 'ML-KEM-encapDecap-FIPS203' : 'ML-DSA-sigVer-FIPS204'
  ) as FixtureName
  const validatePrompt = ajv.compile(schema.promptSchema)
  const validateResponse = ajv.compile(schema.responseSchema)

  it('both validators accept the real NIST fixture prompt', () => {
    const doc = promptOf(fixture)
    expect(validatePrompt(doc)).toBe(true)
    expect(validateAgainstSchema(schema.promptSchema, doc)).toEqual([])
  })

  it.each(mutations[fixture])('both reject: %s (blamed at %s)', (_label, mutate, blamedPath) => {
    const doc = clone(promptOf(fixture))
    mutate(doc)
    expect(validatePrompt(doc)).toBe(false)
    const diags = validateAgainstSchema(schema.promptSchema, doc)
    expect(diags.length).toBeGreaterThan(0)
    expect(diags.map((d) => d.path)).toContain(blamedPath)
    for (const d of diags) expect(d.reason.length).toBeGreaterThan(0)
  })

  it('both accept the NIST expectedResults reshaped to the protocol response object', () => {
    const exp = JSON.parse(readFixture(repo, fixture, 'expectedResults.json')) as Doc
    const resp = { vsId: exp.vsId, testGroups: exp.testGroups }
    expect(validateResponse(resp)).toBe(true)
    expect(validateAgainstSchema(schema.responseSchema, resp)).toEqual([])
    // …and both reject PQC Today metadata smuggled into the protocol response.
    const polluted = clone(resp) as Doc
    ;(polluted.testGroups[0].tests as Doc[])[0].engine = 'rust'
    expect(validateResponse(polluted)).toBe(false)
    expect(validateAgainstSchema(schema.responseSchema, polluted).map((d) => d.path)).toContain(
      '$.testGroups[0].tests[0].engine'
    )
  })
})

describe('evidence schema', () => {
  it('compiles under ajv strict mode (only standard keywords)', () => {
    expect(() => ajv.compile(evidenceSchema)).not.toThrow()
  })
})

describe('interpreter guard rails', () => {
  it('throws on a keyword it does not implement instead of ignoring it', () => {
    expect(() => validateAgainstSchema({ type: 'string', format: 'date-time' }, 'x')).toThrow(
      /unsupported keyword "format"/
    )
  })
  it('throws on a non-whitelisted pattern', () => {
    expect(() => validateAgainstSchema({ type: 'string', pattern: '^a+$' }, 'aa')).toThrow(
      /not whitelisted/
    )
  })
})
