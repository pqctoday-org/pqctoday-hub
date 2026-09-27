// SPDX-License-Identifier: GPL-3.0-only
// F-1 (pinned schema, precise rejection) + F-2 (IR preserves every identity
// field and group property; round-trips back to the prompt) + the portable IR
// goldens a non-JS runner is checked against.
import { describe, it, expect } from 'vitest'
import { parsePromptText, parsePromptValue } from './parser'
import { canonicalJson, irToPrompt, sha256Hex } from './ir'
import { planVectorSet } from './dispatch'
import { FIXTURE_NAMES, readFixture, type FixtureName } from './node/fixtures'
import goldens from './__fixtures__/goldens/goldens.json'

const repo = process.cwd()
const promptText = (n: FixtureName) => readFixture(repo, n, 'prompt.json')

const parseOk = (text: string) => {
  const r = parsePromptText(text)
  if (!r.ok) throw new Error(JSON.stringify(r.diagnostics))
  return r
}

describe.each(FIXTURE_NAMES)('fixture %s', (name) => {
  const golden = goldens.fixtures[name]

  it('parses against its pinned schema', () => {
    const r = parseOk(promptText(name))
    expect(r.ir.schemaId).toBe(golden.schemaId)
    expect(r.ir.framing).toBe('bare')
    expect(r.ir.acvVersion).toBeNull()
    expect(r.ir.vsId).toBe(golden.vsId)
    expect(r.ir.testGroups).toHaveLength(golden.counts.testGroups)
  })

  it('F-2: IR → prompt round-trips to the original document (nothing dropped)', () => {
    const original = JSON.parse(promptText(name))
    const r = parseOk(promptText(name))
    expect(irToPrompt(r.ir)).toEqual(original)
    expect(canonicalJson(irToPrompt(r.ir))).toBe(canonicalJson(original))
  })

  it('F-2: vsId, tgId, tcId, testType and every group property survive verbatim', () => {
    const original = JSON.parse(promptText(name)) as {
      vsId: number
      testGroups: Array<Record<string, unknown> & { tests: Array<{ tcId: number }> }>
    }
    const r = parseOk(promptText(name))
    expect(r.ir.vectorSet.vsId).toBe(original.vsId)
    original.testGroups.forEach((g, gi) => {
      const irg = r.ir.testGroups[gi]
      const { tests, ...props } = g
      expect(irg.properties).toEqual(props)
      expect(irg.tgId).toBe(g.tgId)
      expect(irg.testType).toBe(g.testType)
      expect(irg.tests.map((t) => t.tcId)).toEqual(tests.map((t) => t.tcId))
      tests.forEach((t, ti) => expect(irg.tests[ti].fields).toEqual(t))
    })
  })

  it('IR and plan match the portable goldens (canonical-JSON SHA-256)', async () => {
    const r = parseOk(promptText(name))
    expect(await sha256Hex(canonicalJson(r.ir))).toBe(golden.irCanonicalSha256)
    const plan = planVectorSet(r.ir)
    expect(plan.items).toHaveLength(golden.counts.testCases)
    expect(plan.items.filter((i) => i.kind === 'execute')).toHaveLength(golden.counts.planExecute)
    expect(await sha256Hex(canonicalJson(plan))).toBe(golden.planCanonicalSha256)
  })

  it('accepts the ACVTS envelope form and keeps acvVersion verbatim', () => {
    const env = [{ acvVersion: '1.0' }, JSON.parse(promptText(name))]
    const r = parsePromptValue(env)
    expect(r.ok).toBe(true)
    if (r.ok) {
      expect(r.ir.framing).toBe('envelope')
      expect(r.ir.acvVersion).toBe('1.0')
      expect(irToPrompt(r.ir)).toEqual(env)
    }
  })
})

describe('rejections carry a precise path + reason', () => {
  const kem = () => JSON.parse(promptText('ML-KEM-encapDecap-FIPS203'))
  const expectReject = (doc: unknown, path: string, keyword: string, reason?: RegExp) => {
    const r = parsePromptValue(doc)
    expect(r.ok).toBe(false)
    if (r.ok) return
    const hit = r.diagnostics.find((d) => d.path === path && d.keyword === keyword)
    expect(hit, JSON.stringify(r.diagnostics)).toBeDefined()
    if (reason) expect(hit!.reason).toMatch(reason)
  }

  it('invalid JSON', () => {
    const r = parsePromptText('{"vsId": ')
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.diagnostics[0]).toMatchObject({ path: '$', keyword: 'parse' })
  })

  it('a revision that is not pinned is refused, never coerced', () => {
    const d = kem()
    d.revision = 'FIPS203-tr1'
    expectReject(d, '$.revision', 'unsupported-revision', /not pinned.*FIPS203/)
  })

  it('an algorithm/mode outside the bounded prototype', () => {
    const d = kem()
    d.mode = 'keyGen'
    expectReject(d, '$.mode', 'unsupported-vector-set', /ML-KEM\/keyGen/)
    const s = kem()
    s.algorithm = 'SLH-DSA'
    s.mode = 'sigVer'
    expectReject(s, '$.mode', 'unsupported-vector-set')
  })

  it('schema violations inside an envelope are reported at $[1]…', () => {
    const d = kem()
    delete d.testGroups[3].tests[2].dk
    expectReject([{ acvVersion: '1.0' }, d], '$[1].testGroups[3].tests[2].dk', 'required')
  })

  it('malformed envelopes', () => {
    expectReject([{ acvVersion: '1.0' }], '$', 'envelope')
    expectReject([{ version: '1.0' }, kem()], '$[0].acvVersion', 'envelope')
    expectReject([{ acvVersion: '1.0', jwt: 'x' }, kem()], '$[0].jwt', 'envelope')
    expectReject('text', '$', 'type')
  })

  it('duplicate tgId / tcId (the spec says unique across the vector set)', () => {
    const d = kem()
    d.testGroups[1].tgId = d.testGroups[0].tgId
    expectReject(d, '$.testGroups[1].tgId', 'unique', /duplicates testGroups\[0\]/)
    const t = kem()
    t.testGroups[4].tests[0].tcId = t.testGroups[3].tests[0].tcId
    expectReject(t, '$.testGroups[4].tests[0].tcId', 'unique')
  })
})
