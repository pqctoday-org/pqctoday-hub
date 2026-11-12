// SPDX-License-Identifier: AGPL-3.0-only
/**
 * The NIST ACVP-Server ML-KEM-768 encapDecap sample shown in the Hybrid Key
 * Generation workshop panel.
 *
 *  1. Every case the panel shows is byte-identical to the same case in the
 *     byte-exact copy of NIST's prompt.json / expectedResults.json kept as a
 *     fixture (src/services/acvp/__fixtures__/nist-acvp-server), including the
 *     expected ciphertext, shared secret and key-check verdicts.
 *  2. The sample holds both polarities, so a pass proves something: valid and
 *     modified-ciphertext decapsulation, and an accepted and a rejected key
 *     for each key check.
 *  3. The runner compares the engine's answer with NIST's expected result: a
 *     disagreement is a fail, an engine error is an error, never a pass. (The
 *     real-engine replay is mlkemAcvpEncapDecap.local.test.ts.)
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { SoftHSMModule } from '@/wasm/softhsm'
import prompt from '@/services/acvp/__fixtures__/nist-acvp-server/ML-KEM-encapDecap-FIPS203/prompt.json'
import expected from '@/services/acvp/__fixtures__/nist-acvp-server/ML-KEM-encapDecap-FIPS203/expectedResults.json'
import aftFile from '@/data/acvp/mlkem_encap_aft_test.json'
import valFile from '@/data/acvp/mlkem_encapdecap_val_test.json'
import { hsm_extractKeyValue } from '@/wasm/softhsm'

const runEncapCase = vi.fn()
const importPrivate = vi.fn()
const importPublic = vi.fn()
const decapsulateRv = vi.fn()
const encapsulateRv = vi.fn()
vi.mock('@/components/Playground/hsm/acvp/sections/optionalInputAcvp', () => ({
  runEncapCase: (...a: unknown[]) => runEncapCase(...a),
}))
vi.mock('@/components/Playground/hsm/acvp/sections/mlkemAcvp', () => ({
  importPrivate: (...a: unknown[]) => importPrivate(...a),
  importPublic: (...a: unknown[]) => importPublic(...a),
  decapsulateRv: (...a: unknown[]) => decapsulateRv(...a),
  encapsulateRv: (...a: unknown[]) => encapsulateRv(...a),
}))
vi.mock('@/components/Playground/hsm/acvp/sections/mldsaAcvp', () => ({
  firstDiff: (a: Uint8Array, b: Uint8Array) =>
    a.length === b.length && a.every((x, i) => x === b[i]) // eslint-disable-line security/detect-object-injection
      ? 'identical'
      : 'first difference',
  destroy: vi.fn(),
}))
vi.mock('@/wasm/softhsm', async (original) => ({
  ...(await original<typeof import('@/wasm/softhsm')>()),
  hsm_extractKeyValue: vi.fn(),
}))

import { loadEncapDecapCases, runEncapDecapSample } from './mlkemAcvpEncapDecap'

type PromptTest = { tcId: number; ek?: string; m?: string; dk?: string; c?: string }
type ExpectedTest = { tcId: number; c?: string; k?: string; testPassed?: boolean }
const promptCase = (tgId: number, tcId: number) =>
  prompt.testGroups.find((g) => g.tgId === tgId)!.tests.find((t) => t.tcId === tcId) as PromptTest
const expectedCase = (tgId: number, tcId: number) =>
  expected.testGroups
    .find((g) => g.tgId === tgId)!
    .tests.find((t) => t.tcId === tcId) as ExpectedTest

describe('the ML-KEM-768 sample', () => {
  it('uses only ML-KEM-768 groups of the pinned commit', () => {
    expect(aftFile._provenance.source_commit).toBe('975de31eb83d87039ec88934fdc47d8c312b892d')
    expect(valFile._provenance.source_commit).toBe('975de31eb83d87039ec88934fdc47d8c312b892d')
  })

  it('has 3 encapsulation, 4 decapsulation and 2 + 2 key-check cases, with both polarities', async () => {
    const cases = await loadEncapDecapCases()
    const by = (f: string) => cases.filter((c) => c.function === f)
    expect(by('encapsulation')).toHaveLength(3)
    expect(by('decapsulation')).toHaveLength(4)
    expect(by('encapsulationKeyCheck')).toHaveLength(2)
    expect(by('decapsulationKeyCheck')).toHaveLength(2)
    expect(
      by('decapsulation')
        .map((c) => c.label)
        .sort()
    ).toEqual([
      'modified ciphertext',
      'modified ciphertext',
      'valid decapsulation',
      'valid decapsulation',
    ])
    for (const f of ['encapsulationKeyCheck', 'decapsulationKeyCheck']) {
      expect(by(f).some((c) => c.testPassed === true)).toBe(true)
      expect(by(f).some((c) => c.testPassed === false)).toBe(true)
    }
  })

  it('agrees byte for byte with NIST’s prompt and expected-result files', async () => {
    const cases = await loadEncapDecapCases()
    for (const c of cases) {
      const where = `tg${c.tgId}/tc${c.tcId} (${c.function})`
      const p = promptCase(c.tgId, c.tcId)
      const e = expectedCase(c.tgId, c.tcId)
      if (c.function === 'encapsulation') {
        expect(c.ek, where).toBe(p.ek)
        expect(c.m, where).toBe(p.m)
        expect(c.c, where).toBe(e.c)
        expect(c.k, where).toBe(e.k)
      } else if (c.function === 'decapsulation') {
        expect(c.dk, where).toBe(p.dk)
        expect(c.c, where).toBe(p.c)
        expect(c.k, where).toBe(e.k)
      } else if (c.function === 'encapsulationKeyCheck') {
        expect(c.ek, where).toBe(p.ek)
        expect(c.testPassed, where).toBe(e.testPassed)
      } else {
        expect(c.dk, where).toBe(p.dk)
        expect(c.testPassed, where).toBe(e.testPassed)
      }
    }
  })

  it('has the sizes FIPS 203 Table 3 gives for ML-KEM-768', async () => {
    const cases = await loadEncapDecapCases()
    for (const c of cases) {
      if (c.ek) expect(c.ek.length / 2, `tc${c.tcId} ek`).toBe(1184)
      if (c.dk) expect(c.dk.length / 2, `tc${c.tcId} dk`).toBe(2400)
      if (c.c) expect(c.c.length / 2, `tc${c.tcId} c`).toBe(1088)
      if (c.k) expect(c.k.length / 2, `tc${c.tcId} k`).toBe(32)
    }
  })
})

describe('runEncapDecapSample', () => {
  const M = {} as SoftHSMModule
  const extract = vi.mocked(hsm_extractKeyValue)

  const CKR_ATTRIBUTE_VALUE_INVALID = 0x13
  const hexOf = (b: Uint8Array) =>
    Array.from(b, (x) => x.toString(16).padStart(2, '0'))
      .join('')
      .toUpperCase()
  /** Keys the simulated engine refuses at C_CreateObject, as both real engines do (FIPS 203 input check). */
  let refused = new Set<string>()
  /** Per-key overrides of the C_CreateObject return value (injected faults). */
  let importRv = new Map<string, number>()
  /** Return value of the operation that follows a key-check import (CKR_OK unless injected). */
  let keyCheckOpRv = 0

  beforeEach(() => {
    for (const f of [runEncapCase, importPrivate, importPublic, decapsulateRv, encapsulateRv])
      f.mockReset()
    extract.mockReset()
    refused = new Set()
    importRv = new Map()
    keyCheckOpRv = 0
  })

  const importer = (_m: unknown, _h: unknown, _v: unknown, bytes: Uint8Array) => {
    const key = hexOf(bytes)
    const rv = importRv.get(key) ?? (refused.has(key) ? CKR_ATTRIBUTE_VALUE_INVALID : 0)
    return { rv, handle: rv === 0 ? 6 : 0 }
  }

  /** An engine that agrees with NIST everywhere: invalid keys are refused at import. */
  const agreeingEngine = async () => {
    const cases = await loadEncapDecapCases()
    runEncapCase.mockImplementation(() => ({
      ok: true,
      observed: 'c and k byte-equal',
      details: 'ok',
    }))
    for (const c of cases) {
      if (c.function.endsWith('KeyCheck') && c.testPassed === false)
        refused.add((c.ek ?? c.dk)!.toUpperCase())
    }
    importPrivate.mockImplementation(importer)
    importPublic.mockImplementation(importer)
    // Decapsulation hands back the expected k of the case being run, in order.
    const ks = cases.filter((c) => c.function === 'decapsulation').map((c) => c.k!)
    let d = 0
    decapsulateRv.mockImplementation((_m, _h, _p, ct: Uint8Array) => ({
      rv: ct.length === 1088 && ct.every((b) => b === 0) ? keyCheckOpRv : 0,
      handle: 9,
    }))
    extract.mockImplementation(() => {
      const hex = ks[d++]
      return Uint8Array.from(hex.match(/../g)!.map((b) => parseInt(b, 16)))
    })
    encapsulateRv.mockImplementation(() => ({ rv: keyCheckOpRv, handle: 0, ctLen: 1088 }))
    return cases
  }

  const keyCase = (
    cases: Awaited<ReturnType<typeof loadEncapDecapCases>>,
    fn: string,
    valid: boolean
  ) => cases.find((c) => c.function === fn && c.testPassed === valid)!
  const resultFor = (
    out: Awaited<ReturnType<typeof runEncapDecapSample>>,
    c: { tgId: number; tcId: number }
  ) => out.find((r) => r.tgId === c.tgId && r.tcId === c.tcId)!

  it('passes every case when the engine answers as NIST expects', async () => {
    await agreeingEngine()
    const out = await runEncapDecapSample(M, 1)
    expect(out).toHaveLength(11)
    expect(
      out.filter((r) => r.status !== 'pass').map((r) => `${r.tgId}/${r.tcId}: ${r.observed}`)
    ).toEqual([])
    // The documented refusal is what passes an invalid-key case.
    for (const r of out.filter((x) => x.testPassed === false))
      expect(r.observed).toBe('key rejected')
  })

  it('fails a decapsulation whose shared secret differs from NIST’s', async () => {
    await agreeingEngine()
    let n = 0
    const original = extract.getMockImplementation() as unknown as () => Uint8Array
    extract.mockImplementation(() => {
      const k = original()
      return n++ === 2 ? new Uint8Array(32) : k
    })
    const out = await runEncapDecapSample(M, 1)
    const red = out.filter((r) => r.status !== 'pass')
    expect(red).toHaveLength(1)
    expect(red[0].function).toBe('decapsulation')
    expect(red[0].status).toBe('fail')
    expect(red[0].observed).toMatch(/shared secret differs/)
  })

  it('fails a key check that accepts a key NIST marks invalid', async () => {
    const cases = await agreeingEngine()
    refused.delete(keyCase(cases, 'encapsulationKeyCheck', false).ek!.toUpperCase())
    const out = await runEncapDecapSample(M, 1)
    const red = out.filter((r) => r.status !== 'pass')
    expect(red).toHaveLength(1)
    expect(red[0].function).toBe('encapsulationKeyCheck')
    expect(red[0].testPassed).toBe(false)
    expect(red[0].observed).toMatch(/accepted, but NIST marks it invalid/)
  })

  it('fails a key check that refuses, with the documented code, a key NIST marks valid', async () => {
    const cases = await agreeingEngine()
    const valid = keyCase(cases, 'decapsulationKeyCheck', true)
    refused.add(valid.dk!.toUpperCase())
    const r = resultFor(await runEncapDecapSample(M, 1), valid)
    expect(r.status).toBe('fail')
    expect(r.observed).toMatch(/rejected, but NIST marks it valid/)
  })

  // Faults that say nothing about the key. Before, any non-zero return value counted as
  // "key rejected", so each of these passed a case that expects an invalid key to be refused.
  const UNRELATED: Array<[string, number]> = [
    ['CKR_SESSION_HANDLE_INVALID', 0xb3],
    ['CKR_DEVICE_ERROR', 0x30],
    ['CKR_TOKEN_RESOURCE_EXCEEDED', 0x201],
    ['CKR_GENERAL_ERROR', 0x05],
  ]
  describe.each(['encapsulationKeyCheck', 'decapsulationKeyCheck'])('%s', (fn) => {
    it.each(UNRELATED)(
      'an invalid key whose import fails with %s is an error, not a rejection',
      async (name, rv) => {
        const cases = await agreeingEngine()
        const bad = keyCase(cases, fn, false)
        importRv.set((bad.ek ?? bad.dk)!.toUpperCase(), rv)
        const out = await runEncapDecapSample(M, 1)
        const r = resultFor(out, bad)
        expect(r.status).toBe('error')
        expect(r.observed).toContain(name)
        expect(r.observed).toMatch(/not a key-check result/)
        // only that case changed
        expect(out.filter((x) => x.status !== 'pass')).toHaveLength(1)
      }
    )

    it.each(UNRELATED)(
      'a valid key whose import fails with %s is an error, not a rejection',
      async (name, rv) => {
        const cases = await agreeingEngine()
        const good = keyCase(cases, fn, true)
        importRv.set((good.ek ?? good.dk)!.toUpperCase(), rv)
        const r = resultFor(await runEncapDecapSample(M, 1), good)
        expect(r.status).toBe('error')
        expect(r.observed).toContain(name)
      }
    )

    it('an imported key whose operation then fails is an error, for either polarity', async () => {
      const cases = await agreeingEngine()
      const bad = keyCase(cases, fn, false)
      refused.delete((bad.ek ?? bad.dk)!.toUpperCase())
      keyCheckOpRv = 0x30 // CKR_DEVICE_ERROR
      const out = await runEncapDecapSample(M, 1)
      for (const c of [bad, keyCase(cases, fn, true)]) {
        const r = resultFor(out, c)
        expect(r.status, `${c.tgId}/${c.tcId}`).toBe('error')
        expect(r.observed).toMatch(
          /key imported, then C_(En|De)capsulateKey returned CKR_DEVICE_ERROR/
        )
      }
    })
  })

  it('reports an engine error as an error, never as a successful rejection', async () => {
    runEncapCase.mockImplementation(() => {
      throw new Error('engine unavailable')
    })
    importPrivate.mockImplementation(() => {
      throw new Error('engine unavailable')
    })
    importPublic.mockImplementation(() => {
      throw new Error('engine unavailable')
    })
    const out = await runEncapDecapSample(M, 1)
    expect(out).toHaveLength(11)
    expect(out.every((r) => r.status === 'error')).toBe(true)
    expect(out.every((r) => /engine unavailable/.test(r.observed))).toBe(true)
  })
})
