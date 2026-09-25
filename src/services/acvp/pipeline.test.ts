// SPDX-License-Identifier: GPL-3.0-only
// F-3 dispatch bookkeeping, F-4 response shape + golden comparison, F-6
// evidence sidecar — driven through a TEST-ONLY fake engine that answers from
// NIST expectedResults.json (no crypto; see testing/expectedResultsFakeEngine.ts).
// Real-engine correctness is proven in acvp.engines.local.test.ts.
import { describe, it, expect } from 'vitest'
import { executePrepared, preparePrompt, type PreparedPrompt } from './run'
import { canonicalJson, sha256Hex, type JsonObject } from './ir'
import { UNSUPPORTED_REASONS } from './dispatch'
import { buildResponse, validateResponse } from './response'
import { compareToExpected } from './compare'
import { DISCLAIMER_GENERAL, DISCLAIMER_IMPORT } from './evidence'
import { validateAgainstSchema } from './schemaValidator'
import evidenceSchema from './schemas/evidence.schema.json'
import { createExpectedResultsFakeEngine } from './testing/expectedResultsFakeEngine'
import { FIXTURE_NAMES, readFixture, type FixtureName } from './node/fixtures'
import goldens from './__fixtures__/goldens/goldens.json'
import { readFileSync } from 'node:fs'
import path from 'node:path'

const repo = process.cwd()
const prompt = (n: FixtureName) => readFixture(repo, n, 'prompt.json')
const expected = (n: FixtureName) => readFixture(repo, n, 'expectedResults.json')
const FIXED = () => new Date('2026-09-24T12:00:00.000Z')

const prepare = async (text: string): Promise<PreparedPrompt> => {
  const p = await preparePrompt(text)
  if (!p.ok) throw new Error(JSON.stringify(p.diagnostics))
  return p
}

describe('dispatch plan (F-3)', () => {
  it('ML-KEM: only decapsulation executes; encapsulation + key checks are unsupported by group', async () => {
    const p = await prepare(prompt('ML-KEM-encapDecap-FIPS203'))
    const byFn = (fn: string) =>
      p.plan.items.filter(
        (i) => p.ir.testGroups.find((g) => g.tgId === i.tgId)!.properties.function === fn
      )
    expect(byFn('decapsulation').every((i) => i.kind === 'execute')).toBe(true)
    expect(byFn('decapsulation')).toHaveLength(30)
    for (const i of byFn('encapsulation')) {
      expect(i).toMatchObject({ kind: 'unsupported', scope: 'group' })
      if (i.kind === 'unsupported') expect(i.reason).toBe(UNSUPPORTED_REASONS.mlKemEncapsulation)
    }
    expect(byFn('encapsulation')).toHaveLength(75)
    expect([...byFn('encapsulationKeyCheck'), ...byFn('decapsulationKeyCheck')]).toHaveLength(60)
  })

  it('ML-DSA: internal+externalMu runs on the vendor mechanism; internal raw M′ and SHA2-512/t unsupported; no coercion', async () => {
    const p = await prepare(prompt('ML-DSA-sigVer-FIPS204'))
    const groupOf = (tgId: number) => p.ir.testGroups.find((g) => g.tgId === tgId)!.properties
    const internal = p.plan.items.filter((i) => groupOf(i.tgId).signatureInterface === 'internal')
    const rawMessage = internal.filter((i) => groupOf(i.tgId).externalMu === false)
    const externalMu = internal.filter((i) => groupOf(i.tgId).externalMu === true)
    expect(rawMessage).toHaveLength(45)
    for (const i of rawMessage) {
      expect(i).toMatchObject({ kind: 'unsupported', scope: 'group' })
      if (i.kind === 'unsupported') expect(i.reason).toBe(UNSUPPORTED_REASONS.mlDsaInternal)
    }
    expect(externalMu).toHaveLength(45)
    for (const i of externalMu) {
      expect(i.kind).toBe('execute')
      if (i.kind === 'execute') {
        expect(i.op).toMatchObject({
          operation: 'ml-dsa.verify-external-mu',
          mechanism: 'CKM_ML_DSA_EXTERNAL_MU',
          vendorDefined: true,
        })
      }
    }
    const perTest = p.plan.items.filter((i) => i.kind === 'unsupported' && i.scope === 'test')
    expect(perTest).toHaveLength(8)
    for (const i of perTest)
      if (i.kind === 'unsupported') expect(i.reason).toMatch(/SHA2-512\/2(24|56)/)
    // Every executed pre-hash item carries exactly the mechanism its hashAlg names.
    for (const i of p.plan.items) {
      if (i.kind !== 'execute' || i.op.operation !== 'ml-dsa.verify') continue
      if (i.op.hashAlg === null) expect(i.op.mechanism).toBe('CKM_ML_DSA')
      else
        expect(i.op.mechanism).toBe(
          `CKM_HASH_ML_DSA_${i.op.hashAlg.replace('SHA2-', 'SHA').replace('SHA3-', 'SHA3_').replace('SHAKE-', 'SHAKE')}`
        )
    }
  })
})

describe.each(FIXTURE_NAMES)('pipeline on %s with the TEST-ONLY fake engine', (name) => {
  it('never calls the engine for an unsupported item and emits only answered tests', async () => {
    const p = await prepare(prompt(name))
    const engine = createExpectedResultsFakeEngine(expected(name), prompt(name))
    const run = await executePrepared(p, { engine, codePath: 'cli', appVersion: null, now: FIXED })
    const executable = p.plan.items.filter((i) => i.kind === 'execute')
    expect(engine.calls).toHaveLength(executable.length)
    const unsupportedKeys = new Set(
      p.plan.items.filter((i) => i.kind === 'unsupported').map((i) => `${i.tgId}/${i.tcId}`)
    )
    for (const g of run.response.vectorSetResponse.testGroups as JsonObject[]) {
      for (const t of g.tests as JsonObject[]) {
        expect(unsupportedKeys.has(`${g.tgId}/${t.tcId}`)).toBe(false)
      }
    }
    expect(run.response.answeredCount).toBe(executable.length)
  })

  it('F-4: response has only spec fields, validates, and equals the golden response', async () => {
    const p = await prepare(prompt(name))
    const engine = createExpectedResultsFakeEngine(expected(name), prompt(name))
    const run = await executePrepared(p, {
      engine,
      codePath: 'cli',
      appVersion: null,
      expectedText: expected(name),
      now: FIXED,
    })
    const doc = run.response.document as JsonObject
    expect(Object.keys(doc)).toEqual(['vsId', 'testGroups'])
    for (const g of doc.testGroups as JsonObject[]) {
      expect(Object.keys(g)).toEqual(['tgId', 'tests'])
      for (const t of g.tests as JsonObject[]) {
        expect(Object.keys(t)).toEqual(
          name.startsWith('ML-KEM') ? ['tcId', 'k'] : ['tcId', 'testPassed']
        )
      }
    }
    expect(validateResponse(p.ir, run.response.vectorSetResponse)).toEqual([])
    const golden = goldens.fixtures[name]
    expect(await sha256Hex(canonicalJson(doc))).toBe(golden.responseCanonicalSha256)
    const goldenFile = JSON.parse(
      readFileSync(
        path.join(repo, 'src/services/acvp/__fixtures__/goldens', golden.responseFile),
        'utf8'
      )
    )
    expect(doc).toEqual(goldenFile)
    expect(run.golden).toMatchObject({
      matched: golden.counts.planExecute,
      mismatched: [],
      unexpected: [],
      unanswered: golden.counts.planUnsupported,
    })
  })

  it('golden comparison can FAIL: a wrong engine answer is reported as a mismatch', async () => {
    const p = await prepare(prompt(name))
    const first = p.plan.items.find((i) => i.kind === 'execute')!
    const wrong = name.startsWith('ML-KEM') ? '00'.repeat(32) : true
    const engine = createExpectedResultsFakeEngine(expected(name), prompt(name), {
      [`${first.tgId}/${first.tcId}`]: { status: 'ok', value: wrong },
    })
    const run = await executePrepared(p, {
      engine,
      codePath: 'cli',
      appVersion: null,
      expectedText: expected(name),
      now: FIXED,
    })
    // (for ML-DSA the first executable case is an expected-false one in this fixture)
    expect(run.golden!.mismatched).toHaveLength(1)
    expect(run.golden!.mismatched[0]).toMatchObject({ tgId: first.tgId, tcId: first.tcId })
  })

  it('engine-level unsupported/error outcomes yield no response entry and are itemised in evidence', async () => {
    const p = await prepare(prompt(name))
    const [a, b] = p.plan.items.filter((i) => i.kind === 'execute')
    const engine = createExpectedResultsFakeEngine(expected(name), prompt(name), {
      [`${a.tgId}/${a.tcId}`]: { status: 'unsupported', reason: 'not advertised' },
      [`${b.tgId}/${b.tcId}`]: { status: 'error', reason: 'CKR_GENERAL_ERROR' },
    })
    const run = await executePrepared(p, { engine, codePath: 'cli', appVersion: null, now: FIXED })
    const answered = new Set(
      (run.response.vectorSetResponse.testGroups as JsonObject[]).flatMap((g) =>
        (g.tests as JsonObject[]).map((t) => `${g.tgId}/${t.tcId}`)
      )
    )
    expect(answered.has(`${a.tgId}/${a.tcId}`)).toBe(false)
    expect(answered.has(`${b.tgId}/${b.tcId}`)).toBe(false)
    const cases = run.evidence.cases as JsonObject[]
    expect(cases.find((c) => c.tcId === a.tcId)).toMatchObject({ disposition: 'unsupported' })
    expect(cases.find((c) => c.tcId === b.tcId)).toMatchObject({
      disposition: 'error',
      reason: 'CKR_GENERAL_ERROR',
    })
    expect((run.evidence.summary as JsonObject).error).toBe(1)
  })

  it('F-6: evidence validates against its own schema, carries both disclaimers, and no vector payload', async () => {
    const text = prompt(name)
    const p = await prepare(text)
    const engine = createExpectedResultsFakeEngine(expected(name), text)
    const run = await executePrepared(p, {
      engine,
      codePath: 'browser',
      appVersion: '9.9.9',
      now: FIXED,
    })
    expect(validateAgainstSchema(evidenceSchema as Record<string, unknown>, run.evidence)).toEqual(
      []
    )
    expect(run.evidence.disclaimers).toEqual([DISCLAIMER_GENERAL, DISCLAIMER_IMPORT])
    expect(run.evidence.evidenceClass).toBe('nist-acvp-reference-sample')
    const cases = run.evidence.cases as JsonObject[]
    const vendor = run.evidence.vendorDefinedMechanisms as JsonObject[]
    if (name.startsWith('ML-DSA')) {
      expect(vendor).toEqual([
        expect.objectContaining({
          name: 'CKM_ML_DSA_EXTERNAL_MU',
          value: '0x0000403c',
          answered: 45,
        }),
      ])
      const muCases = cases.filter((c) => c.mechanism === 'CKM_ML_DSA_EXTERNAL_MU')
      expect(muCases).toHaveLength(45)
      expect(muCases.every((c) => c.mechanismKind === 'vendor-defined')).toBe(true)
      expect(
        cases
          .filter((c) => c.mechanism === 'CKM_ML_DSA')
          .every((c) => c.mechanismKind === 'pkcs11-v3.2')
      ).toBe(true)
    } else {
      expect(vendor).toEqual([])
    }
    expect((run.evidence.prompt as JsonObject).sha256).toBe(await sha256Hex(text))
    expect((run.evidence.response as JsonObject).sha256).toBe(await sha256Hex(run.response.text))
    // No hex payload (keys, ciphertexts, signatures, shared secrets) leaks into the sidecar.
    const firstGroup = (JSON.parse(text) as JsonObject).testGroups as JsonObject[]
    const someTest = ((firstGroup[firstGroup.length - 1].tests as JsonObject[])[0] ??
      {}) as JsonObject
    for (const v of Object.values(someTest)) {
      if (typeof v === 'string' && v.length > 16) expect(run.evidenceText).not.toContain(v)
    }
    for (const g of run.response.vectorSetResponse.testGroups as JsonObject[]) {
      for (const t of g.tests as JsonObject[]) {
        if (typeof t.k === 'string') expect(run.evidenceText).not.toContain(t.k)
      }
    }
    // …and the protocol response carries no PQC Today metadata.
    expect(run.response.text).not.toMatch(/engine|disclaimer|pqctoday|sha256/i)
  })

  it('F-7 (serialization level): same prompt + same answers → byte-identical response.json', async () => {
    const text = prompt(name)
    const runOnce = async () =>
      (
        await executePrepared(await prepare(text), {
          engine: createExpectedResultsFakeEngine(expected(name), text),
          codePath: 'cli',
          appVersion: null,
        })
      ).response.text
    expect(await runOnce()).toBe(await runOnce())
  })
})

describe('response framing mirrors the prompt (R1)', () => {
  it('envelope in → envelope out with the same acvVersion; nothing invented for bare', async () => {
    const name: FixtureName = 'ML-DSA-sigVer-FIPS204'
    const env = JSON.stringify([{ acvVersion: '1.0' }, JSON.parse(prompt(name))])
    const p = await prepare(env)
    const engine = createExpectedResultsFakeEngine(expected(name), prompt(name))
    const run = await executePrepared(p, { engine, codePath: 'cli', appVersion: null })
    const doc = run.response.document as unknown[]
    expect(Array.isArray(doc)).toBe(true)
    expect(doc[0]).toEqual({ acvVersion: '1.0' })
    expect(run.evidence.evidenceClass).toBe('unverified-imported-vector-set')
  })

  it('a group with no answered test is omitted rather than emitted empty', async () => {
    const p = await prepare(prompt('ML-KEM-encapDecap-FIPS203'))
    const built = buildResponse(p.ir, [])
    expect(built.vectorSetResponse).toEqual({ vsId: 42, testGroups: [] })
    expect(built.answeredCount).toBe(0)
  })

  it('compareToExpected flags a response test that has no expected counterpart', () => {
    const exp = { vsId: 1, testGroups: [{ tgId: 1, tests: [{ tcId: 1, testPassed: true }] }] }
    const resp = {
      vsId: 1,
      testGroups: [
        {
          tgId: 1,
          tests: [
            { tcId: 1, testPassed: true },
            { tcId: 2, testPassed: false },
          ],
        },
      ],
    }
    expect(compareToExpected(resp, exp)).toMatchObject({
      matched: 1,
      unexpected: [{ tgId: 1, tcId: 2 }],
    })
  })
})
