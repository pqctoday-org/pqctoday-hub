// SPDX-License-Identifier: AGPL-3.0-only
/**
 * The ML-KEM encapsulation-key check depth rows (§7c) over the bundled depth
 * file (mlkem_ekcheck_depth_test.json), driven through
 * runMlkemKeyCheckDepthSection. The engine is faked at the import and encapsulate
 * boundary (sections/mlkemAcvp.ts): per key, the C_CreateObject return value and
 * the return value of C_EncapsulateKey after a successful import are injected.
 *
 * Only CKR_ATTRIBUTE_VALUE_INVALID from C_CreateObject refuses an invalid key.
 * Any other answer is an error row, never a pass.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import depthFile from '@/data/acvp/mlkem_ekcheck_depth_test.json'
import type { SoftHSMModule } from '@/wasm/softhsm'
import type { MldsaAcvpSectionCtx } from './mldsaAcvp'
import { runMlkemKeyCheckDepthSection } from './mlkemKeyCheckDepth'

const CKR_OK = 0x00
const CKR_GENERAL_ERROR = 0x05
const CKR_DEVICE_ERROR = 0x30
const CKR_SESSION_HANDLE_INVALID = 0xb3
const CKR_ATTRIBUTE_VALUE_INVALID = 0x13

const eng = vi.hoisted(() => {
  const hexOf = (b: Uint8Array) =>
    Array.from(b, (x) => x.toString(16).padStart(2, '0'))
      .join('')
      .toUpperCase()
  return {
    hexOf,
    /** key hex -> C_CreateObject return value (default CKR_OK) */
    importRv: new Map<string, number>(),
    /** key hex -> C_EncapsulateKey return value after a successful import (default CKR_OK) */
    opRv: new Map<string, number>(),
    /** object handle -> key hex */
    keyOf: new Map<number, string>(),
    next: 100,
  }
})

vi.mock('./mlkemAcvp', async (original) => ({
  ...(await original<typeof import('./mlkemAcvp')>()),
  importPublic: (_M: unknown, _h: number, _v: number, ek: Uint8Array) => {
    const hex = eng.hexOf(ek)
    const rv = eng.importRv.get(hex) ?? CKR_OK
    if (rv !== CKR_OK) return { rv, handle: 0 }
    const handle = ++eng.next
    eng.keyOf.set(handle, hex)
    return { rv, handle }
  },
  encapsulateRv: (_M: unknown, _h: number, key: number) => ({
    rv: eng.opRv.get(eng.keyOf.get(key) ?? '') ?? CKR_OK,
    handle: 0,
    ctLen: 0,
  }),
}))

const M = { _C_DestroyObject: () => CKR_OK } as unknown as SoftHSMModule

type Row = Parameters<MldsaAcvpSectionCtx['pushResult']>[0]

interface DepthCase {
  ps: string
  tgId: number
  tcId: number
  testPassed: boolean
  hex: string
}

const depthCases: DepthCase[] = (
  depthFile as unknown as {
    testGroups: Array<{
      tgId: number
      parameterSet: string
      tests: Array<{ tcId: number; testPassed: boolean; ek: string }>
    }>
  }
).testGroups.flatMap((g) =>
  g.tests.map((t) => ({
    ps: g.parameterSet,
    tgId: g.tgId,
    tcId: t.tcId,
    testPassed: t.testPassed,
    hex: t.ek.toUpperCase(),
  }))
)

const idOf = (c: DepthCase) => `mlkem-ekcheck-depth-${c.ps}-tg${c.tgId}-tc${c.tcId}-C++`

async function runDepth(): Promise<Row[]> {
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
  await runMlkemKeyCheckDepthSection(ctx)
  return rows
}

const rowFor = (rows: Row[], c: DepthCase): Row => {
  const row = rows.find((r) => r.id === idOf(c))
  if (!row) throw new Error(`no row ${idOf(c)}`)
  return row
}

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

describe('ML-KEM encapsulation-key check depth (§7c): only a real refusal counts', () => {
  it('the bundled depth file carries 12 invalid encapsulation keys: 4 per parameter set', () => {
    expect(depthCases).toHaveLength(12)
    expect(depthCases.every((c) => !c.testPassed)).toBe(true)
    for (const ps of ['ML-KEM-512', 'ML-KEM-768', 'ML-KEM-1024']) {
      expect(depthCases.filter((c) => c.ps === ps)).toHaveLength(4)
    }
  })

  it('an invalid key refused with CKR_ATTRIBUTE_VALUE_INVALID passes: 12 of 12', async () => {
    for (const c of depthCases) eng.importRv.set(c.hex, CKR_ATTRIBUTE_VALUE_INVALID)
    const rows = await runDepth()
    expect(rows).toHaveLength(12)
    expect(rows.filter((r) => r.status !== 'pass').map((r) => `${r.id}: ${r.details}`)).toEqual([])
    for (const c of depthCases) {
      expect(rowFor(rows, c).caseMeta?.observed).toBe(
        'C_CreateObject → CKR_ATTRIBUTE_VALUE_INVALID'
      )
    }
  })

  it('an invalid key that the engine accepts still fails, as ACCEPTED', async () => {
    const rows = await runDepth()
    expect(rows).toHaveLength(12)
    for (const c of depthCases) {
      const row = rowFor(rows, c)
      expect(row.status).toBe('fail')
      expect(row.details).toMatch(/ACCEPTED a key NIST marks invalid/)
      expect(row.details).not.toMatch(/ERROR/)
    }
  })

  it.each([
    ['CKR_SESSION_HANDLE_INVALID', CKR_SESSION_HANDLE_INVALID],
    ['CKR_DEVICE_ERROR', CKR_DEVICE_ERROR],
    ['CKR_GENERAL_ERROR', CKR_GENERAL_ERROR],
  ])('an invalid key whose import fails with %s is an error, not a rejection', async (name, rv) => {
    for (const c of depthCases) eng.importRv.set(c.hex, CKR_ATTRIBUTE_VALUE_INVALID)
    const first = depthCases[0]
    eng.importRv.set(first.hex, rv)
    const rows = await runDepth()
    expectError(rowFor(rows, first), `C_CreateObject returned ${name}`)
    // only that case changed
    expect(rows.filter((r) => r.status !== 'pass')).toHaveLength(1)
  })

  it('every invalid key whose import fails with CKR_DEVICE_ERROR is an error', async () => {
    for (const c of depthCases) eng.importRv.set(c.hex, CKR_DEVICE_ERROR)
    const rows = await runDepth()
    for (const c of depthCases)
      expectError(rowFor(rows, c), 'C_CreateObject returned CKR_DEVICE_ERROR')
  })

  it('an invalid key that imports and then fails in C_EncapsulateKey is an error', async () => {
    for (const c of depthCases) eng.opRv.set(c.hex, CKR_DEVICE_ERROR)
    const rows = await runDepth()
    for (const c of depthCases) {
      expectError(rowFor(rows, c), 'key imported, then C_EncapsulateKey returned CKR_DEVICE_ERROR')
    }
  })
})
