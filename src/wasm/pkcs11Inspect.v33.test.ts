// SPDX-License-Identifier: AGPL-3.0-only
//
// PKCS#11 v3.3 working draft decoding in the log inspector: external µ
// (CK_SIGN_ADDITIONAL_CONTEXT on CKM_ML_DSA_EXTERNAL_MU, CK_MU_GEN_PARAMS on
// C_DigestInit), composite KEM ciphertext splits on C_EncapsulateKey /
// C_DecapsulateKey, composite signature splits on C_Sign / C_Verify, and the
// v3.2 and v3.3 values of the KEM template attributes. Runs against a fake
// wasm32 heap, so every offset is the one the decoder must read.
import { describe, it, expect } from 'vitest'
import type { SoftHSMModule } from '@pqctoday/softhsm-wasm'
import {
  buildInspect,
  CKA_TABLE,
  splitCompositeCiphertext,
  splitCompositeSignature,
} from './pkcs11Inspect'

const CKA_PARAMETER_SET = 0x61d

/** A minimal wasm32 heap: i32 little-endian reads/writes, a bump allocator,
 * and a C_GetAttributeValue that answers CKA_PARAMETER_SET per key handle. */
const fakeModule = (paramSets: Record<number, number> = {}) => {
  const HEAPU8 = new Uint8Array(1 << 16)
  const dv = new DataView(HEAPU8.buffer)
  let next = 64
  const M = {
    HEAPU8,
    getValue: (p: number) => dv.getInt32(p, true),
    setValue: (p: number, v: number) => dv.setInt32(p, v | 0, true),
    _malloc: (n: number) => {
      const p = next
      next += (n + 7) & ~7
      return p
    },
    _free: () => {},
    _C_GetAttributeValue: (_s: number, h: number, tpl: number, n: number) => {
      if (n !== 1 || dv.getUint32(tpl, true) !== CKA_PARAMETER_SET || !(h in paramSets)) return 0x12 // CKR_ATTRIBUTE_TYPE_INVALID
      dv.setUint32(dv.getUint32(tpl + 4, true), paramSets[h], true)
      return 0
    },
  }
  const u32 = (...vals: number[]) => {
    const p = M._malloc(vals.length * 4)
    vals.forEach((v, i) => dv.setUint32(p + i * 4, v >>> 0, true))
    return p
  }
  const bytes = (b: number[]) => {
    const p = M._malloc(b.length)
    HEAPU8.set(b, p)
    return p
  }
  const mech = (type: number, pParam = 0, len = 0) => u32(type, pParam, len)
  return { M: M as unknown as SoftHSMModule, u32, bytes, mech }
}

const allRows = (r: ReturnType<typeof buildInspect>) => [
  ...(r?.inputs.flatMap((s) => s.primitives ?? []) ?? []),
  ...(r?.outputs ?? []),
]
const row = (r: ReturnType<typeof buildInspect>, name: string) =>
  allRows(r).find((x) => x.name === name)

describe('pkcs11Inspect — PKCS#11 v3.3 working draft', () => {
  it('decodes CK_SIGN_ADDITIONAL_CONTEXT on CKM_ML_DSA_EXTERNAL_MU (0x403c)', () => {
    const { M, u32, bytes, mech } = fakeModule()
    const ctx = bytes([0xaa, 0xbb])
    const param = u32(0x0 /* CKH_HEDGE_PREFERRED */, ctx, 2)
    const r = buildInspect(M, 'C_SignInit', [1, mech(0x403c, param, 12), 7], 0)
    const m = r?.inputs.find((s) => s.mechanism)?.mechanism
    expect(m?.param?.contextLen).toBe(2)
    expect(m?.param?.contextHex).toBe('aabb')
  })

  it('decodes CK_MU_GEN_PARAMS with a key handle (offsets 0/4/8/12/16)', () => {
    const { M, u32, bytes, mech } = fakeModule()
    const ctx = bytes([1, 2, 3])
    const p = u32(42, 0, 0, ctx, 3)
    const r = buildInspect(M, 'C_DigestInit', [1, mech(0x403b, p, 20)], 0)
    const sec = r?.inputs.find((s) => s.label.startsWith('CK_MU_GEN_PARAMS'))
    expect(sec?.label).toContain('PKCS#11 v3.3 working draft')
    expect(row(r, 'hKey')?.value).toBe('42')
    expect(row(r, 'Context')?.value).toBe('3 bytes [010203]')
    expect(row(r, 'pTR')).toBeUndefined()
  })

  it('decodes CK_MU_GEN_PARAMS with a precomputed tr', () => {
    const { M, u32, bytes, mech } = fakeModule()
    const tr = bytes(new Array(64).fill(7))
    const p = u32(0, tr, 64, 0, 0)
    const r = buildInspect(M, 'C_DigestInit', [1, mech(0x403b, p, 20)], 0)
    expect(row(r, 'pTR')?.value).toBe('precomputed tr (64 bytes)')
    expect(row(r, 'hKey')).toBeUndefined()
    expect(row(r, 'Context')?.value).toBe('empty')
  })

  it('C_EncapsulateKey with CKM_COMP_KEM splits the ciphertext from the key parameter set', () => {
    // key 9 = CKP_COMP_KEM_MLKEM768_X25519 (0x04): 1088 + 32 = 1120 bytes
    const { M, u32, mech } = fakeModule({ 9: 0x04 })
    const ctLen = u32(1120)
    const phKey = u32(55)
    const r = buildInspect(M, 'C_EncapsulateKey', [1, mech(0x4041), 9, 0, 0, 4096, ctLen, phKey], 0)
    expect(row(r, '*pulCiphertextLen')?.value).toBe('1120 bytes')
    const split = row(r, 'Ciphertext split')
    expect(split?.value).toBe('ML-KEM-768 1088 B + X25519 32 B')
    expect(split?.note).toContain('CKP_COMP_KEM_MLKEM768_X25519')
    expect(split?.note).toContain('CKA_PARAMETER_SET')
    expect(row(r, '*phKey')?.value).toBe('55')
    expect(r?.spec).toContain('PKCS#11 v3.3 working draft')
  })

  it('C_DecapsulateKey with CKM_COMP_KEM infers the split from the length when the key has no readable parameter set', () => {
    const { M, u32, mech } = fakeModule()
    const phKey = u32(77)
    // CKP_COMP_KEM_MLKEM1024_X448: 1568 + 56 = 1624 bytes, unique length
    const r = buildInspect(M, 'C_DecapsulateKey', [1, mech(0x4041), 3, 0, 0, 4096, 1624, phKey], 0)
    expect(row(r, 'ulCiphertextLen')?.value).toBe('1624 bytes')
    expect(row(r, 'Ciphertext split')?.value).toBe('ML-KEM-1024 1568 B + X448 56 B')
    expect(row(r, 'Ciphertext split')?.note).toContain('inferred from the length')
    expect(row(r, '*phKey')?.value).toBe('77')
    // The shared secret is a key handle only; no secret bytes are displayed.
    expect(allRows(r).some((x) => /secret value/i.test(x.note ?? ''))).toBe(true)
  })

  it('C_DecapsulateKey with plain ML-KEM shows no composite split', () => {
    const { M, u32, mech } = fakeModule()
    const r = buildInspect(M, 'C_DecapsulateKey', [1, mech(0x17), 3, 0, 0, 4096, 1088, u32(1)], 0)
    expect(row(r, 'Ciphertext split')).toBeUndefined()
    expect(r?.spec).toContain('FIPS 203')
  })

  it('C_Sign after C_SignInit(CKM_COMP_SIG) splits the signature into its ML-DSA and classical halves', () => {
    // key 5 = CKP_COMP_SIG_MLDSA44_ED25519_SHA512 (0x03): 2420 + 64 = 2484 bytes
    const { M, u32, bytes, mech } = fakeModule({ 5: 0x03 })
    buildInspect(M, 'C_SignInit', [11, mech(0x403e), 5], 0)
    const sig = bytes(new Array(16).fill(1))
    const r = buildInspect(M, 'C_Sign', [11, bytes([1]), 1, sig, u32(2484)], 0)
    expect(row(r, 'Signature split')?.value).toBe('ML-DSA-44 2420 B + Ed25519 64 B')
    expect(row(r, 'Signature split')?.note).toContain('PKCS#11 v3.3 working draft')
  })

  it('C_Verify after C_VerifyInit(CKM_COMP_SIG_EXTERNAL_HASH) splits a variable-length signature', () => {
    // key 6 = CKP_COMP_SIG_MLDSA65_ECDSA_P256_SHA512 (0x09): ML-DSA-65 3309 B + DER ECDSA
    const { M, bytes, mech } = fakeModule({ 6: 0x09 })
    buildInspect(M, 'C_VerifyInit', [12, mech(0x403f), 6], 0)
    const r = buildInspect(M, 'C_Verify', [12, bytes([1]), 64, bytes([0]), 3309 + 70], 0)
    expect(row(r, 'Signature split')?.value).toBe('ML-DSA-65 3309 B + ECDSA-P256 70 B')
  })

  it('a non-composite C_SignInit clears the session, so C_Sign shows no split', () => {
    const { M, u32, bytes, mech } = fakeModule({ 5: 0x03 })
    buildInspect(M, 'C_SignInit', [13, mech(0x403e), 5], 0)
    buildInspect(M, 'C_SignInit', [13, mech(0x1c /* CKM_ML_DSA */), 5], 0)
    const r = buildInspect(M, 'C_Sign', [13, bytes([1]), 1, bytes([0]), u32(2484)], 0)
    expect(row(r, 'Signature split')).toBeUndefined()
  })

  it('split helpers: lengths that match no set, or sets that disagree, give no split', () => {
    expect(splitCompositeCiphertext(1000)).toBeNull()
    expect(splitCompositeSignature(100)).toBeNull()
    // RSA2048 sets at ML-DSA-44: 2420 + 256 = 2676 — both PSS and PKCS15 fit; same ML length
    const sp = splitCompositeSignature(2676)
    expect(sp?.mlBytes).toBe(2420)
    expect(sp?.tradBytes).toBe(256)
  })

  it('CKA_ENCAPSULATE_TEMPLATE / CKA_DECAPSULATE_TEMPLATE: v3.2 and v3.3 values, composite KEM named', () => {
    for (const [v, name] of [
      [0x62a, 'CKA_ENCAPSULATE_TEMPLATE'],
      [0x4000062a, 'CKA_ENCAPSULATE_TEMPLATE'],
      [0x62b, 'CKA_DECAPSULATE_TEMPLATE'],
      [0x4000062b, 'CKA_DECAPSULATE_TEMPLATE'],
    ] as const) {
      expect(CKA_TABLE[v]?.name).toBe(name)
      expect(CKA_TABLE[v]?.description).toContain('composite KEM')
    }
    expect(CKA_TABLE[0x4000062a].description).toContain('PKCS#11 v3.3 working draft')
  })
})
