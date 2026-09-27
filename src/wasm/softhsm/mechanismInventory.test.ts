// SPDX-License-Identifier: GPL-3.0-only
//
// Pure-function KATs for mechanismInventory.ts: normalization, flag decoding,
// the G-2 flag → operation mapping and the canonical-JSON SHA-256. Driven by a
// FIXED synthetic mechanism list with a pinned hash, so a change to the
// canonical form (which would silently re-identify every engine build) fails
// here first. The real-engine capture is covered by
// mechanismInventory.local.test.ts.
import { describe, it, expect } from 'vitest'
import {
  buildMechanismInventory,
  canonicalInventoryJson,
  canonicalJson,
  compareToGenerated,
  decodeMechanismFlags,
  requiredOperationsForFlags,
  sha256Hex,
  unknownFlagBits,
  captureRawMechanisms,
  diffInventories,
  type GeneratedMechanismInventoryFile,
  type RawMechanismRecord,
} from './mechanismInventory'
import generated from '@/data/validation/mechanism-inventory.generated.json'
import type { SoftHSMModule } from '@pqctoday/softhsm-wasm'

const CKF_SIGN = 0x800
const CKF_VERIFY = 0x2000
const CKF_ENCRYPT = 0x100
const CKF_DECRYPT = 0x200
const CKF_GENERATE_KEY_PAIR = 0x10000
const CKF_ENCAPSULATE = 0x10000000
const CKF_DECAPSULATE = 0x20000000
const CKF_MESSAGE_SIGN = 0x8
const CKF_MULTI_MESSAGE = 0x20
const CKF_EC_OID = 0x800000

/** Deliberately unsorted, with one info failure and one unnamed vendor type. */
const SYNTHETIC: RawMechanismRecord[] = [
  {
    type: 0x17,
    infoRv: 0,
    ulMinKeySize: 0,
    ulMaxKeySize: 0,
    flags: CKF_ENCAPSULATE | CKF_DECAPSULATE,
  }, // CKM_ML_KEM
  {
    type: 0x1d,
    infoRv: 0,
    ulMinKeySize: 0,
    ulMaxKeySize: 0,
    flags: CKF_SIGN | CKF_VERIFY | CKF_MESSAGE_SIGN | CKF_MULTI_MESSAGE,
  }, // CKM_ML_DSA
  {
    type: 0x1081,
    infoRv: 0,
    ulMinKeySize: 128,
    ulMaxKeySize: 256,
    flags: CKF_ENCRYPT | CKF_DECRYPT,
  }, // CKM_AES_ECB
  {
    type: 0x1040,
    infoRv: 0,
    ulMinKeySize: 256,
    ulMaxKeySize: 521,
    flags: CKF_GENERATE_KEY_PAIR | CKF_EC_OID,
  }, // CKM_EC_KEY_PAIR_GEN
  { type: 0x8fff0001, infoRv: 0x70, ulMinKeySize: 0, ulMaxKeySize: 0, flags: 0 }, // unnamed, CKR_MECHANISM_INVALID
]

// Pinned: sha256 of the canonical JSON of SYNTHETIC (computed independently
// with `printf %s <SYNTHETIC_CANONICAL> | shasum -a 256`). If this changes, every
// recorded engine inventory hash changes with it — that must be deliberate.
const SYNTHETIC_CANONICAL =
  '{"mechanisms":[' +
  '{"flags":805306368,"infoRv":0,"type":23,"ulMaxKeySize":0,"ulMinKeySize":0},' +
  '{"flags":10280,"infoRv":0,"type":29,"ulMaxKeySize":0,"ulMinKeySize":0},' +
  '{"flags":8454144,"infoRv":0,"type":4160,"ulMaxKeySize":521,"ulMinKeySize":256},' +
  '{"flags":768,"infoRv":0,"type":4225,"ulMaxKeySize":256,"ulMinKeySize":128},' +
  '{"flags":0,"infoRv":112,"type":2415853569,"ulMaxKeySize":0,"ulMinKeySize":0}' +
  '],"schema":"pqctoday.mechanism-inventory/v1"}'
const SYNTHETIC_SHA256 = '1ea2376e3fc9d8855d06e8402c2f2c23d0bbecc85ed851d7898f23f978426903'

describe('canonicalJson', () => {
  it('sorts keys, drops undefined, has no whitespace', () => {
    expect(canonicalJson({ b: 1, a: [true, null, 's'], c: undefined })).toBe(
      '{"a":[true,null,"s"],"b":1}'
    )
  })
  it('rejects non-finite numbers', () => {
    expect(() => canonicalJson({ a: Number.NaN })).toThrow(/non-finite/)
  })
})

describe('flag decoding', () => {
  it('decodes v3.2 flags by name, including ENCAPSULATE/DECAPSULATE and message flags', () => {
    expect(decodeMechanismFlags(CKF_ENCAPSULATE | CKF_DECAPSULATE)).toEqual([
      'CKF_ENCAPSULATE',
      'CKF_DECAPSULATE',
    ])
    expect(decodeMechanismFlags(CKF_MESSAGE_SIGN | CKF_MULTI_MESSAGE | CKF_SIGN)).toEqual([
      'CKF_MESSAGE_SIGN',
      'CKF_MULTI_MESSAGE',
      'CKF_SIGN',
    ])
    expect(decodeMechanismFlags(0x80000000)).toEqual(['CKF_EXTENSION'])
  })
  it('isolates bits PKCS#11 v3.2 does not define', () => {
    expect(unknownFlagBits(0x08000000 | CKF_SIGN)).toBe(0x08000000)
    expect(unknownFlagBits(CKF_SIGN | CKF_VERIFY)).toBe(0)
  })
})

describe('G-2 required operations', () => {
  it('maps each operation flag to its own probe — sign does not imply verify', () => {
    expect(requiredOperationsForFlags(CKF_SIGN)).toEqual(['sign'])
    expect(requiredOperationsForFlags(CKF_SIGN | CKF_VERIFY)).toEqual(['sign', 'verify'])
    expect(requiredOperationsForFlags(CKF_ENCAPSULATE | CKF_DECAPSULATE)).toEqual([
      'encapsulate',
      'decapsulate',
    ])
  })
  it('adds Begin/Next probes only for message ops that CKF_MULTI_MESSAGE qualifies', () => {
    expect(requiredOperationsForFlags(CKF_MESSAGE_SIGN | CKF_MULTI_MESSAGE)).toEqual([
      'message-sign',
      'message-sign-multipart',
    ])
    expect(requiredOperationsForFlags(CKF_MULTI_MESSAGE)).toEqual([])
  })
  it('capability flags (EC_*, HW, EXTENSION) require no operation probe', () => {
    expect(requiredOperationsForFlags(CKF_EC_OID | 0x1 | 0x80000000)).toEqual([])
  })
})

describe('buildMechanismInventory', () => {
  it('canonical JSON of the synthetic list is byte-exact and order-independent', () => {
    expect(canonicalInventoryJson(SYNTHETIC)).toBe(SYNTHETIC_CANONICAL)
    expect(canonicalInventoryJson([...SYNTHETIC].reverse())).toBe(SYNTHETIC_CANONICAL)
  })

  it('hash is the pinned SHA-256 of the canonical JSON', async () => {
    expect(await sha256Hex(SYNTHETIC_CANONICAL)).toBe(SYNTHETIC_SHA256)
    const inv = await buildMechanismInventory(SYNTHETIC)
    expect(inv.inventorySha256).toBe(SYNTHETIC_SHA256)
    expect(inv.mechanismCount).toBe(5)
  })

  it('sha256Hex matches the FIPS 180-2 "abc" example', async () => {
    expect(await sha256Hex('abc')).toBe(
      'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad'
    )
  })

  it('any engine-reported field change changes the hash', async () => {
    const base = (await buildMechanismInventory(SYNTHETIC)).inventorySha256
    const mutated = SYNTHETIC.map((r) => (r.type === 0x1081 ? { ...r, ulMaxKeySize: 192 } : r))
    expect((await buildMechanismInventory(mutated)).inventorySha256).not.toBe(base)
    const flagFlip = SYNTHETIC.map((r) => (r.type === 0x17 ? { ...r, flags: CKF_ENCAPSULATE } : r))
    expect((await buildMechanismInventory(flagFlip)).inventorySha256).not.toBe(base)
  })

  it('sorts by type, names from MECH_TABLE, records objective findings', async () => {
    const inv = await buildMechanismInventory(SYNTHETIC)
    expect(inv.mechanisms.map((m) => m.typeHex)).toEqual([
      '0x00000017',
      '0x0000001d',
      '0x00001040',
      '0x00001081',
      '0x8fff0001',
    ])
    const byType = new Map(inv.mechanisms.map((m) => [m.type, m]))
    expect(byType.get(0x17)?.name).toBe('CKM_ML_KEM')
    expect(byType.get(0x1d)?.requiredOperations).toEqual([
      'sign',
      'verify',
      'message-sign',
      'message-sign-multipart',
    ])
    expect(byType.get(0x1040)?.findings).toEqual([])
    expect(byType.get(0x8fff0001)?.name).toBeNull()
    expect(byType.get(0x8fff0001)?.findings).toEqual([
      'mechanism-info-failed',
      'unnamed-in-mech-table',
    ])
  })

  it('flags duplicates (and keeps them in the hash)', async () => {
    const dup = [...SYNTHETIC, SYNTHETIC[0]]
    const inv = await buildMechanismInventory(dup)
    expect(inv.mechanismCount).toBe(6)
    expect(inv.mechanisms.filter((m) => m.type === 0x17).map((m) => m.findings)).toEqual([
      ['duplicate-in-mechanism-list'],
      ['duplicate-in-mechanism-list'],
    ])
    expect(inv.inventorySha256).not.toBe(SYNTHETIC_SHA256)
  })

  it('compareToGenerated distinguishes match / differ / missing', async () => {
    const inv = await buildMechanismInventory(SYNTHETIC)
    const record = { inventory: inv } as unknown as Parameters<typeof compareToGenerated>[1]
    expect(compareToGenerated(inv, record)).toBe('matches-generated')
    expect(compareToGenerated({ inventorySha256: 'x' }, record)).toBe('differs-from-generated')
    expect(compareToGenerated(inv, undefined)).toBe('no-generated-record')
  })
})

describe('captureRawMechanisms against a fake ABI', () => {
  /** Minimal wasm32 heap + a two-mechanism engine that fails info for one. */
  const fakeModule = (listRv = 0, list: number[] = [0x1d, 0x17]): SoftHSMModule => {
    const buf = new ArrayBuffer(4096)
    const dv = new DataView(buf)
    let next = 16
    return {
      _malloc: (n: number) => {
        const p = next
        next += (n + 7) & ~7
        return p
      },
      _free: () => {},
      getValue: (p: number) => dv.getInt32(p, true),
      setValue: (p: number, v: number) => dv.setUint32(p, v >>> 0, true),
      _C_GetMechanismList: (_slot: number, pList: number, pCount: number) => {
        if (listRv) return listRv
        if (pList === 0) {
          dv.setUint32(pCount, list.length, true)
          return 0
        }
        list.forEach((t, i) => dv.setUint32(pList + i * 4, t, true))
        dv.setUint32(pCount, list.length, true)
        return 0
      },
      _C_GetMechanismInfo: (_slot: number, type: number, p: number) => {
        if (type === 0x17) return 0x70
        dv.setUint32(p, 0, true)
        dv.setUint32(p + 4, 0, true)
        dv.setUint32(p + 8, 0x80000000 | CKF_SIGN, true)
        return 0
      },
    } as unknown as SoftHSMModule
  }

  it('reads flags as unsigned and records per-mechanism info rv', () => {
    expect(captureRawMechanisms(fakeModule(), 0)).toEqual([
      { type: 0x1d, infoRv: 0, ulMinKeySize: 0, ulMaxKeySize: 0, flags: 0x80000800 },
      { type: 0x17, infoRv: 0x70, ulMinKeySize: 0, ulMaxKeySize: 0, flags: 0 },
    ])
  })

  it('throws (never returns []) on a failed or empty list', () => {
    expect(() => captureRawMechanisms(fakeModule(0x3), 0)).toThrow(/0x00000003/)
    expect(() => captureRawMechanisms(fakeModule(0, []), 0)).toThrow(/empty list/)
  })
})

describe('diffInventories', () => {
  it('lists one-sided mechanisms and only the info fields that differ', async () => {
    const cpp = await buildMechanismInventory(SYNTHETIC)
    const rust = await buildMechanismInventory([
      ...SYNTHETIC.filter((r) => r.type !== 0x1081).map((r) =>
        r.type === 0x1040 ? { ...r, ulMinKeySize: 384 } : r
      ),
      { type: 0x80000010, infoRv: 0, ulMinKeySize: 0, ulMaxKeySize: 0, flags: 0x400 },
    ])
    expect(diffInventories(cpp, rust)).toEqual({
      onlyCpp: [{ typeHex: '0x00001081', name: 'CKM_AES_ECB' }],
      onlyRust: [{ typeHex: '0x80000010', name: 'CKM_KECCAK_256' }],
      sameTypeDifferentInfo: [
        {
          typeHex: '0x00001040',
          name: 'CKM_EC_KEY_PAIR_GEN',
          cpp: { ulMinKeySize: 256 },
          rust: { ulMinKeySize: 384 },
        },
      ],
    })
  })
})

describe('committed mechanism-inventory.generated.json is self-consistent', () => {
  // KAT over the committed artifact: recomputing each engine's hash from the
  // raw fields it records must reproduce the recorded inventorySha256, and the
  // derived fields must match what this module derives today. (Whether the
  // record still matches the SHIPPED engines is checked by
  // `npm run gen:mechanism-inventory:check` and mechanismInventory.local.test.ts.)
  it.each(['cpp', 'rust'] as const)('%s: recorded hash + derived fields reproduce', async (e) => {
    const rec = (generated as unknown as GeneratedMechanismInventoryFile).engines[e]
    const raw: RawMechanismRecord[] = rec.inventory.mechanisms.map((m) => ({
      type: m.type,
      infoRv: m.infoRv,
      ulMinKeySize: m.ulMinKeySize,
      ulMaxKeySize: m.ulMaxKeySize,
      flags: m.flags,
    }))
    const rebuilt = await buildMechanismInventory(raw)
    expect(rebuilt.inventorySha256).toBe(rec.inventory.inventorySha256)
    expect(rebuilt.mechanismCount).toBe(rec.inventory.mechanismCount)
    expect(rebuilt.mechanisms).toEqual(rec.inventory.mechanisms)
    expect(rec.inventory.mechanismCount).toBeGreaterThan(50) // not vacuous
    expect(rec.identity.artifacts.every((a) => /^[0-9a-f]{64}$/.test(a.sha256))).toBe(true)
  })
})
