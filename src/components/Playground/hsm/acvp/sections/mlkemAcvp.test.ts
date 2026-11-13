// SPDX-License-Identifier: AGPL-3.0-only
/**
 * The ML-KEM key-check rows (§7b.4) of the reference-sample section, driven
 * through runMlkemAcvpSection over the bundled NIST VAL file
 * (mlkem_encapdecap_val_test.json). The engine is faked at the PKCS#11 call
 * boundary: per key, the C_CreateObject return value and the return value of the
 * operation that follows a successful import are injected.
 *
 * Only CKR_ATTRIBUTE_VALUE_INVALID from C_CreateObject refuses an invalid key
 * (the FIPS 203 §7.2 / §7.3 input check). Any other answer, including an
 * operation that fails after the key was imported, is an error row: status
 * 'fail' with an "ERROR:" detail, never a pass and never "rejected as expected".
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import valFile from '@/data/acvp/mlkem_encapdecap_val_test.json'
import type { SoftHSMModule } from '@/wasm/softhsm'
import type { MldsaAcvpSectionCtx } from './mldsaAcvp'
import { runMlkemAcvpSection } from './mlkemAcvp'

const CKR_OK = 0x00
const CKR_GENERAL_ERROR = 0x05
const CKR_DEVICE_ERROR = 0x30
const CKR_SESSION_HANDLE_INVALID = 0xb3
const CKR_ATTRIBUTE_VALUE_INVALID = 0x13

/** Engine state shared with the hoisted mocks below. */
const eng = vi.hoisted(() => {
  const hexOf = (b: Uint8Array) =>
    Array.from(b, (x) => x.toString(16).padStart(2, '0'))
      .join('')
      .toUpperCase()
  return {
    hexOf,
    /** key hex -> C_CreateObject return value (default CKR_OK) */
    importRv: new Map<string, number>(),
    /** key hex -> return value of the operation after a successful import (default CKR_OK) */
    opRv: new Map<string, number>(),
    /** object handle -> key hex */
    keyOf: new Map<number, string>(),
    next: 100,
  }
})

vi.mock('./pkcs11Raw', async (original) => ({
  ...(await original<typeof import('./pkcs11Raw')>()),
  // Templates are not under test: run the body with a null template.
  withTemplate: (
    _M: unknown,
    _defs: unknown,
    _bytes: unknown,
    fn: (p: number, n: number) => number
  ) => fn(0, 0),
  createObjectRv: (_M: unknown, _h: number, _defs: unknown, bytes: { bytes: Uint8Array }[]) => {
    const hex = eng.hexOf(bytes[0].bytes)
    const rv = eng.importRv.get(hex) ?? CKR_OK
    if (rv !== CKR_OK) return { rv, handle: 0 }
    const handle = ++eng.next
    eng.keyOf.set(handle, hex)
    return { rv, handle }
  },
  // Key generation is not under test; its rows fail through their own catch.
  generateKeyPairRv: () => ({ rv: CKR_DEVICE_ERROR, pub: 0, priv: 0 }),
}))

vi.mock('@/wasm/softhsm', async (original) => ({
  ...(await original<typeof import('@/wasm/softhsm')>()),
  hsm_extractKeyValue: () => new Uint8Array(0),
}))

// The operation after import: C_EncapsulateKey / C_DecapsulateKey, key is the 3rd argument.
const operate = (_h: number, _mech: number, key: number) =>
  eng.opRv.get(eng.keyOf.get(key) ?? '') ?? CKR_OK
const M = {
  _malloc: () => 64,
  _free: () => undefined,
  setValue: () => undefined,
  getValue: () => 0,
  HEAPU8: new Uint8Array(1 << 16),
  _C_EncapsulateKey: operate,
  _C_DecapsulateKey: operate,
  _C_DestroyObject: () => CKR_OK,
} as unknown as SoftHSMModule

type Row = Parameters<MldsaAcvpSectionCtx['pushResult']>[0]

interface KeyCase {
  fn: 'encapsulationKeyCheck' | 'decapsulationKeyCheck'
  ps: string
  tgId: number
  tcId: number
  testPassed: boolean
  /** upper-case hex of the ek (encapsulation) or dk (decapsulation) */
  hex: string
}

const valGroups = (
  valFile as unknown as {
    testGroups: Array<{
      tgId: number
      parameterSet: string
      function: string
      tests: Array<{ tcId: number; testPassed?: boolean; ek?: string; dk?: string }>
    }>
  }
).testGroups

const keyCases: KeyCase[] = valGroups
  .filter((g) => g.function.endsWith('KeyCheck'))
  .flatMap((g) =>
    g.tests.map((t) => ({
      fn: g.function as KeyCase['fn'],
      ps: g.parameterSet,
      tgId: g.tgId,
      tcId: t.tcId,
      testPassed: t.testPassed === true,
      hex: (g.function === 'decapsulationKeyCheck' ? t.dk! : t.ek!).toUpperCase(),
    }))
  )

const idOf = (c: KeyCase) =>
  `mlkem-keycheck-${c.fn === 'decapsulationKeyCheck' ? 'dk' : 'ek'}-${c.ps}-tg${c.tgId}-tc${c.tcId}-C++`

const opNameOf = (c: KeyCase) =>
  c.fn === 'decapsulationKeyCheck' ? 'C_DecapsulateKey' : 'C_EncapsulateKey'

const rowFor = (rows: Row[], c: KeyCase): Row => {
  const row = rows.find((r) => r.id === idOf(c))
  if (!row) throw new Error(`no row ${idOf(c)}`)
  return row
}

/** Runs the section and keeps its key-check rows. */
async function runKeyChecks(): Promise<Row[]> {
  const rows: Row[] = []
  const ctx: MldsaAcvpSectionCtx = {
    M,
    hSession: 1,
    eName: 'C++',
    mechs: new Set<number>(),
    referenceUrl: 'https://example.invalid/acvp',
    pushResult: async (r) => {
      rows.push(r)
    },
    addLog: () => undefined,
  }
  await runMlkemAcvpSection(ctx)
  return rows.filter((r) => r.id.startsWith('mlkem-keycheck-'))
}

/** An engine that agrees with NIST: every invalid key is refused at C_CreateObject. */
const agreeingEngine = () => {
  for (const c of keyCases) if (!c.testPassed) eng.importRv.set(c.hex, CKR_ATTRIBUTE_VALUE_INVALID)
}

/** An operational failure is a red row whose detail says so: never a pass, never a rejection. */
const expectError = (row: Row, detail: string) => {
  expect(row.status, `${row.id}: ${row.details}`).toBe('fail')
  expect(row.details).toMatch(/^ERROR: /)
  expect(row.details).toContain(detail)
  expect(row.details).toMatch(/not a key-check result/)
  expect(row.details).not.toMatch(/rejected|as expected/i)
}

beforeEach(() => {
  eng.importRv.clear()
  eng.opRv.clear()
  eng.keyOf.clear()
})

describe('ML-KEM key-check rows (§7b.4): only a real refusal counts', () => {
  it('the bundled NIST VAL file carries 12 key-check cases: 6 invalid and 6 valid', () => {
    expect(keyCases).toHaveLength(12)
    expect(keyCases.filter((c) => !c.testPassed)).toHaveLength(6)
    expect(keyCases.filter((c) => c.testPassed)).toHaveLength(6)
  })

  it('a valid key passes, and an invalid key refused with CKR_ATTRIBUTE_VALUE_INVALID passes: 12 of 12', async () => {
    agreeingEngine()
    const rows = await runKeyChecks()
    expect(rows).toHaveLength(12)
    expect(rows.filter((r) => r.status !== 'pass').map((r) => `${r.id}: ${r.details}`)).toEqual([])
    for (const c of keyCases.filter((x) => !x.testPassed)) {
      const row = rowFor(rows, c)
      expect(row.caseMeta?.observed).toBe('C_CreateObject → CKR_ATTRIBUTE_VALUE_INVALID')
      expect(row.details).not.toMatch(/ERROR/)
    }
  })

  it('a valid key that the engine refuses with CKR_ATTRIBUTE_VALUE_INVALID fails as a refusal of a valid key', async () => {
    agreeingEngine()
    const valid = keyCases.find((c) => c.testPassed && c.fn === 'encapsulationKeyCheck')!
    eng.importRv.set(valid.hex, CKR_ATTRIBUTE_VALUE_INVALID)
    const rows = await runKeyChecks()
    const row = rowFor(rows, valid)
    expect(row.status).toBe('fail')
    expect(row.details).toMatch(/REJECTED a key NIST marks valid/)
    expect(row.details).not.toMatch(/ERROR/)
  })

  describe.each(['encapsulationKeyCheck', 'decapsulationKeyCheck'] as const)('%s', (fn) => {
    const invalid = keyCases.find((c) => c.fn === fn && !c.testPassed)!
    const valid = keyCases.find((c) => c.fn === fn && c.testPassed)!

    it('an invalid key that the engine accepts still fails, as ACCEPTED', async () => {
      agreeingEngine()
      eng.importRv.delete(invalid.hex)
      const rows = await runKeyChecks()
      const row = rowFor(rows, invalid)
      expect(row.status).toBe('fail')
      expect(row.details).toMatch(/ACCEPTED a key NIST marks invalid/)
      expect(row.details).not.toMatch(/ERROR/)
    })

    it.each([
      ['CKR_SESSION_HANDLE_INVALID', CKR_SESSION_HANDLE_INVALID],
      ['CKR_DEVICE_ERROR', CKR_DEVICE_ERROR],
      ['CKR_GENERAL_ERROR', CKR_GENERAL_ERROR],
    ])(
      'an invalid key whose import fails with %s is an error, not a rejection',
      async (name, rv) => {
        agreeingEngine()
        eng.importRv.set(invalid.hex, rv)
        const rows = await runKeyChecks()
        expectError(rowFor(rows, invalid), `C_CreateObject returned ${name}`)
        // only that case changed
        expect(rows.filter((r) => r.status !== 'pass')).toHaveLength(1)
      }
    )

    it('an invalid key that imports and then fails in its operation with CKR_DEVICE_ERROR is an error', async () => {
      agreeingEngine()
      eng.importRv.delete(invalid.hex)
      eng.opRv.set(invalid.hex, CKR_DEVICE_ERROR)
      const rows = await runKeyChecks()
      expectError(
        rowFor(rows, invalid),
        `key imported, then ${opNameOf(invalid)} returned CKR_DEVICE_ERROR`
      )
      expect(rows.filter((r) => r.status !== 'pass')).toHaveLength(1)
    })

    it.each([
      ['CKR_SESSION_HANDLE_INVALID', CKR_SESSION_HANDLE_INVALID],
      ['CKR_DEVICE_ERROR', CKR_DEVICE_ERROR],
    ])('a valid key whose import fails with %s is an error, not a rejection', async (name, rv) => {
      agreeingEngine()
      eng.importRv.set(valid.hex, rv)
      const rows = await runKeyChecks()
      expectError(rowFor(rows, valid), `C_CreateObject returned ${name}`)
      expect(rows.filter((r) => r.status !== 'pass')).toHaveLength(1)
    })

    it('a valid key whose operation fails after import is an error', async () => {
      agreeingEngine()
      eng.opRv.set(valid.hex, CKR_DEVICE_ERROR)
      const rows = await runKeyChecks()
      expectError(
        rowFor(rows, valid),
        `key imported, then ${opNameOf(valid)} returned CKR_DEVICE_ERROR`
      )
      expect(rows.filter((r) => r.status !== 'pass')).toHaveLength(1)
    })
  })
})
