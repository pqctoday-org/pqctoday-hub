// SPDX-License-Identifier: AGPL-3.0-only
// The extended plan profile (dispatch.ts X1–X4): the whole pinned NIST samples
// become executable, every answer is labelled by how it was obtained, evidence
// is version 3, and the bounded profile (plan version 1, evidence version 2,
// mirrored by the cross-platform runner) is untouched. Driven through the
// TEST-ONLY fake engine (answers from expectedResults.json, no crypto); the
// real-engine proof is acvp.extended.local.test.ts.
import { describe, it, expect } from 'vitest'
import { executePrepared, preparePrompt } from './run'
import { PLAN_VERSION, PLAN_VERSION_EXTENDED, type InputKind } from './dispatch'
import { compareToExpected } from './compare'
import { createExpectedResultsFakeEngine } from './testing/expectedResultsFakeEngine'
import { FIXTURE_NAMES, readFixture, type FixtureName } from './node/fixtures'
import { validateEvidenceDocument } from './schemas/evidenceSchemas'
import { bytesToUpperHex, hexToBytes, type JsonObject } from './ir'
import { isSha512t, mlDsaMu, preHashSha512t } from './testInputs'
import goldens from './__fixtures__/goldens/goldens.json'

const repo = process.cwd()
const prompt = (n: FixtureName) => readFixture(repo, n, 'prompt.json')
const expected = (n: FixtureName) => readFixture(repo, n, 'expectedResults.json')

const prepare = async (n: FixtureName, profile: 'bounded' | 'extended') => {
  const p = await preparePrompt(prompt(n), profile)
  if (!p.ok) throw new Error(JSON.stringify(p.diagnostics))
  return p
}

const kinds = (items: Array<{ kind: string; inputKind?: InputKind }>) => {
  const out: Record<string, number> = {}
  for (const i of items) {
    if (i.kind !== 'execute') continue
    const k = i.inputKind ?? 'standard'
    out[k] = (out[k] ?? 0) + 1
  }
  return out
}

describe('bounded profile is unchanged (the cross-platform runner mirrors it)', () => {
  it.each(FIXTURE_NAMES)('%s: plan version 1 and the committed golden counts', async (name) => {
    const p = await prepare(name, 'bounded')
    const g = goldens.fixtures[name].counts
    expect(p.plan.planVersion).toBe(PLAN_VERSION)
    expect(p.plan.items.filter((i) => i.kind === 'execute')).toHaveLength(g.planExecute)
    expect(p.plan.items.filter((i) => i.kind === 'unsupported')).toHaveLength(g.planUnsupported)
    expect(p.plan.items.every((i) => i.kind === 'unsupported' || i.inputKind === undefined)).toBe(
      true
    )
  })

  it('preparePrompt without a profile is the bounded profile', async () => {
    const p = await preparePrompt(prompt('ML-KEM-encapDecap-FIPS203'))
    if (!p.ok) throw new Error('rejected')
    expect(p.plan.planVersion).toBe(PLAN_VERSION)
  })
})

describe('extended profile plan', () => {
  it('ML-KEM: all 165 execute — 30 standard, 75 with the test-only m, 60 key-import results', async () => {
    const p = await prepare('ML-KEM-encapDecap-FIPS203', 'extended')
    expect(p.plan.planVersion).toBe(PLAN_VERSION_EXTENDED)
    expect(p.plan.items).toHaveLength(165)
    expect(kinds(p.plan.items)).toEqual({
      standard: 30,
      'test-input-m': 75,
      'key-import-result': 60,
    })
  })

  it('ML-DSA: all 180 execute — 127 standard, 45 with μ computed here, 8 with PH(M) computed here', async () => {
    const p = await prepare('ML-DSA-sigVer-FIPS204', 'extended')
    expect(p.plan.items).toHaveLength(180)
    expect(kinds(p.plan.items)).toEqual({ standard: 127, 'computed-mu': 45, 'computed-ph': 8 })
    // The SHA-512/t cases use the generic mechanism and carry PH(M), not M.
    const ph = p.plan.items.filter((i) => i.kind === 'execute' && i.inputKind === 'computed-ph')
    for (const i of ph) {
      if (i.kind !== 'execute' || i.op.operation !== 'ml-dsa.verify') throw new Error('shape')
      expect(i.op.mechanism).toBe('CKM_HASH_ML_DSA')
      expect(['CKM_SHA512_224', 'CKM_SHA512_256']).toContain(i.op.hashMechanism)
      expect(i.op.message).toHaveLength(i.op.hashMechanism === 'CKM_SHA512_224' ? 56 : 64)
    }
  })
})

describe('extended run through the fake engine', () => {
  it.each(FIXTURE_NAMES)(
    '%s: every test answered, every answer is NIST’s, response and evidence validate',
    async (name) => {
      const p = await prepare(name, 'extended')
      const engine = createExpectedResultsFakeEngine(expected(name), prompt(name))
      const out = await executePrepared(p, {
        engine,
        codePath: 'cli',
        appVersion: null,
        expectedText: expected(name),
      })
      const total = goldens.fixtures[name].counts.testCases
      expect(out.evidence.summary).toMatchObject({
        testCases: total,
        answered: total,
        unsupported: 0,
        error: 0,
      })
      expect(out.golden).toMatchObject({
        matched: total,
        mismatched: [],
        unanswered: 0,
        unexpected: [],
      })
      expect(out.evidence.evidenceVersion).toBe('pqctoday.acvp-evidence/3')
      expect(validateEvidenceDocument(out.evidence)).toEqual([])
      const by = (out.evidence.summary as JsonObject).byInputKind as Record<string, number>
      expect(Object.values(by).reduce((a, b) => a + b, 0)).toBe(total)
      expect((out.evidence.disclaimers as string[]).length).toBe(3)
    }
  )

  it('an encapsulation test carries c and k, a key check only testPassed', async () => {
    const name = 'ML-KEM-encapDecap-FIPS203'
    const p = await prepare(name, 'extended')
    const out = await executePrepared(p, {
      engine: createExpectedResultsFakeEngine(expected(name), prompt(name)),
      codePath: 'cli',
      appVersion: null,
    })
    const groups = out.response.vectorSetResponse.testGroups as JsonObject[]
    const fn = new Map(p.ir.testGroups.map((g) => [g.tgId, g.properties.function as string]))
    for (const g of groups) {
      const keys = Object.keys((g.tests as JsonObject[])[0])
        .filter((k) => k !== 'tcId')
        .sort()
        .join('+')
      const f = fn.get(g.tgId as number)
      expect(keys).toBe(f === 'encapsulation' ? 'c+k' : f === 'decapsulation' ? 'k' : 'testPassed')
    }
  })

  it('the bounded run of the same sample still writes evidence version 2 with the old counts', async () => {
    const name = 'ML-KEM-encapDecap-FIPS203'
    const p = await prepare(name, 'bounded')
    const out = await executePrepared(p, {
      engine: createExpectedResultsFakeEngine(expected(name), prompt(name)),
      codePath: 'cli',
      appVersion: null,
      expectedText: expected(name),
    })
    expect(out.evidence.evidenceVersion).toBe('pqctoday.acvp-evidence/2')
    expect(out.evidence.summary).toEqual({
      testCases: 165,
      answered: 30,
      unsupported: 135,
      error: 0,
    })
    expect(validateEvidenceDocument(out.evidence)).toEqual([])
    expect(compareToExpected(out.response.document, JSON.parse(expected(name))).unanswered).toBe(
      135
    )
  })

  it('sabotage: a wrong value from the engine is reported as a mismatch, not hidden', async () => {
    const name = 'ML-KEM-encapDecap-FIPS203'
    const p = await prepare(name, 'extended')
    const enc = p.plan.items.find((i) => i.kind === 'execute' && i.inputKind === 'test-input-m')!
    const engine = createExpectedResultsFakeEngine(expected(name), prompt(name), {
      [`${enc.tgId}/${enc.tcId}`]: { status: 'ok', value: '00'.repeat(32), extra: { c: '00' } },
    })
    const out = await executePrepared(p, {
      engine,
      codePath: 'cli',
      appVersion: null,
      expectedText: expected(name),
    })
    expect(out.golden!.mismatched.map((m) => `${m.tgId}/${m.tcId}`)).toContain(
      `${enc.tgId}/${enc.tcId}`
    )
    expect(out.golden!.matched).toBe(164)
  })
})

describe('testInputs: values computed outside the engine', () => {
  // Known answers from an independent implementation (Python hashlib), not from these helpers.
  it('SHA-512/224 and SHA-512/256 of "abc" (FIPS 180-4 examples)', () => {
    const abc = new TextEncoder().encode('abc')
    expect(bytesToUpperHex(preHashSha512t('SHA2-512/224', abc))).toBe(
      '4634270F707B6A54DAAE7530460842E20E37ED265CEEE9A43E8924AA'
    )
    expect(bytesToUpperHex(preHashSha512t('SHA2-512/256', abc))).toBe(
      '53048E2681941EF99B2E29B76B4C7DABE4C2D0C634FC6D46E0E2F13107E7AF23'
    )
  })

  it('μ = SHAKE256(SHAKE256(pk, 64) ‖ M′, 64) (FIPS 204 Algorithm 7)', () => {
    const pk = Uint8Array.from({ length: 32 }, (_, i) => i)
    expect(bytesToUpperHex(mlDsaMu(pk, new TextEncoder().encode('abc')))).toBe(
      'D7DE9777559BD3BB98E5BA7F094CD342FEBA6A0C8EA8744E6EE4B8CA5478919CAADA8726C03D9EBDFAE96F367B7339332FB4BA263F6F14884B7A4E9BB4B45ABE'
    )
    expect(hexToBytes('00ff')).toEqual(Uint8Array.of(0, 255))
  })

  it('only the two SHA-512/t names take the generic route', () => {
    expect(isSha512t('SHA2-512/224')).toBe(true)
    expect(isSha512t('SHA2-512/256')).toBe(true)
    expect(isSha512t('SHA2-512')).toBe(false)
    expect(isSha512t('SHA3-512')).toBe(false)
  })
})
