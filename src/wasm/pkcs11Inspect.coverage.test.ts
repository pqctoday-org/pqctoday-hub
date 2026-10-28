// SPDX-License-Identifier: AGPL-3.0-only
//
// Inspect-drawer coverage for every PKCS#11 function either engine exports.
// A row only gets the Log panel's ▶ chevron when buildInspect returns a
// decode, so an export without a decoder is a call a learner cannot inspect.
// The export lists are read from the two engines' type declarations, so a
// function added to either engine fails here until it has a decoder.
//
// Also pins the v3.x decoders added alongside the coverage gate: multi-part
// encrypt/decrypt/verify, the Message API, recover, the info structs, and the
// hybrid paths (composite signatures on multi-part sign/verify, CKM_HPKE
// parameters including X-Wing). Runs against a fake wasm32 heap.
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, it, expect } from 'vitest'
import type { SoftHSMModule } from '@pqctoday/softhsm-wasm'
import { buildInspect } from './pkcs11Inspect'

const CKA_PARAMETER_SET = 0x61d

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
      if (n !== 1 || dv.getUint32(tpl, true) !== CKA_PARAMETER_SET || !(h in paramSets)) return 0x12
      dv.setUint32(dv.getUint32(tpl + 4, true), paramSets[h], true)
      return 0
    },
  }
  const u32 = (...vals: number[]) => {
    const p = M._malloc(vals.length * 4)
    vals.forEach((v, i) => dv.setUint32(p + i * 4, v >>> 0, true))
    return p
  }
  const bytes = (b: number[] | Uint8Array) => {
    const p = M._malloc(b.length)
    HEAPU8.set(b, p)
    return p
  }
  const text = (s: string, width: number) => {
    const b = new Uint8Array(width).fill(0x20)
    b.set(new TextEncoder().encode(s))
    return b
  }
  const mech = (type: number, pParam = 0, len = 0) => u32(type, pParam, len)
  return { M: M as unknown as SoftHSMModule, HEAPU8, dv, u32, bytes, text, mech }
}

type R = ReturnType<typeof buildInspect>
const rows = (r: R) => [
  ...(r?.inputs.flatMap((s) => s.primitives ?? []) ?? []),
  ...(r?.outputs ?? []),
]
const row = (r: R, name: string) => rows(r).find((x) => x.name === name)

const exportsOf = (file: string) =>
  [...readFileSync(resolve(__dirname, '..', '..', file), 'utf8').matchAll(/\b_(C_[A-Za-z]+)\s*\(/g)]
    .map((m) => m[1])
    .filter((v, i, a) => a.indexOf(v) === i)

describe('pkcs11Inspect coverage — every engine export decodes', () => {
  const rust = exportsOf('src/wasm/softhsmrustv3.d.ts')
  const cpp = exportsOf('node_modules/@pqctoday/softhsm-wasm/index.d.ts')

  it('reads a plausible export list from each engine', () => {
    expect(rust.length).toBeGreaterThan(60)
    expect(cpp.length).toBeGreaterThan(60)
  })

  it.each([...new Set([...rust, ...cpp])].sort())('%s has an Inspect decoder', (fn) => {
    // All-zero arguments: NULL pointers and zero lengths must decode, not throw.
    const r = buildInspect(fakeModule().M, fn, [0, 0, 0, 0, 0, 0, 0, 0, 0], 0)
    expect(r, `${fn} has no decoder — its log row cannot be inspected`).toBeDefined()
    expect(r?.decodeError).toBeUndefined()
  })
})

describe('pkcs11Inspect — v3.x decoders', () => {
  it('a throwing decoder reports decodeError instead of hiding the drawer', () => {
    const args = new Proxy([] as number[], {
      get: () => {
        throw new Error('boom')
      },
    })
    const r = buildInspect(fakeModule().M, 'C_Login', args, 0)
    expect(r?.decodeError).toBe('boom')
  })

  it('C_GenerateRandom shows the requested length and the random bytes', () => {
    const { M, bytes } = fakeModule()
    const p = bytes([0xde, 0xad, 0xbe, 0xef])
    const r = buildInspect(M, 'C_GenerateRandom', [1, p, 4], 0)
    expect(row(r, 'ulRandomLen')?.value).toBe('4 bytes')
    expect(row(r, 'Random Data')?.value).toBe('deadbeef')
  })

  it('C_EncryptUpdate reads the part and the output length behind pulOutPartLen', () => {
    const { M, bytes, u32 } = fakeModule()
    const out = bytes([1, 2, 3])
    const r = buildInspect(M, 'C_EncryptUpdate', [1, bytes([9, 9]), 2, out, u32(3)], 0)
    expect(row(r, 'Plaintext Part')?.value).toBe('0909')
    expect(row(r, '*pulOutPartLen')?.value).toBe('3 bytes')
    expect(row(r, 'Ciphertext Part')?.value).toBe('010203')
  })

  it('C_DecryptFinal size query shows NULL and the needed length', () => {
    const { M, u32 } = fakeModule()
    const r = buildInspect(M, 'C_DecryptFinal', [1, 0, u32(16)], 0x150)
    expect(row(r, 'pLastPart')?.value).toBe('NULL (size query)')
    expect(row(r, '*pulLastPartLen')?.value).toBe('16 bytes')
  })

  it('C_SignMessageNext marks a middle part and a final part', () => {
    const { M, bytes, u32 } = fakeModule()
    const mid = buildInspect(M, 'C_SignMessageNext', [1, 0, 0, bytes([1]), 1, 0, 0], 0)
    expect(row(mid, 'pulSignatureLen')?.note).toBe('More parts follow')
    const sig = bytes([7, 7])
    const last = buildInspect(M, 'C_SignMessageNext', [1, 0, 0, bytes([1]), 1, sig, u32(2)], 0)
    expect(row(last, 'Signature Payload')?.value).toBe('0707')
  })

  it('C_EncryptMessage decodes CK_GCM_MESSAGE_PARAMS, including the token-written IV and tag', () => {
    const { M, bytes, u32 } = fakeModule()
    const iv = bytes(new Array(12).fill(0xab))
    const tag = bytes(new Array(16).fill(0xcd))
    const gcm = u32(iv, 12, 0, 3 /* CKG_GENERATE_RANDOM */, tag, 128)
    const r = buildInspect(
      M,
      'C_EncryptMessage',
      [1, gcm, 24, bytes([0xaa]), 1, bytes([1, 2]), 2, bytes([0, 0]), u32(2)],
      0
    )
    expect(row(r, 'IV')?.value).toBe(`12 bytes  [${'ab'.repeat(12)}]`)
    expect(row(r, 'ivGenerator')?.value).toBe('CKG_GENERATE_RANDOM')
    expect(row(r, 'Tag')?.value).toBe(`128 bits  [${'cd'.repeat(16)}]`)
    expect(row(r, 'Associated Data')?.value).toBe('aa')
  })

  it('C_DecryptMessage reports a failed tag check', () => {
    const r = buildInspect(fakeModule().M, 'C_DecryptMessage', [1, 0, 0, 0, 0, 0, 0, 0, 0], 0x42)
    expect(row(r, 'Authentication')?.note).toBe('CKR_AEAD_DECRYPT_FAILED')
  })

  it('C_GetTokenInfo decodes the CK_TOKEN_INFO fields and flags', () => {
    const { M, HEAPU8, dv, text, bytes } = fakeModule()
    const p = bytes(new Uint8Array(160))
    HEAPU8.set(text('PQC Token', 32), p)
    HEAPU8.set(text('PQCToday', 32), p + 32)
    dv.setUint32(p + 96, 0x400 | 0x8 | 0x4 | 0x1, true)
    dv.setUint32(p + 116, 255, true)
    dv.setUint32(p + 120, 4, true)
    const r = buildInspect(M, 'C_GetTokenInfo', [0, p], 0)
    expect(row(r, 'label')?.value).toBe('"PQC Token"')
    expect(row(r, 'flags')?.value).toBe(
      'CKF_RNG | CKF_LOGIN_REQUIRED | CKF_USER_PIN_INITIALIZED | CKF_TOKEN_INITIALIZED (0x0000040d)'
    )
    expect(row(r, 'PIN length (min–max)')?.value).toBe('4–255')
  })

  it('C_GetSessionInfo names the session state', () => {
    const { M, u32 } = fakeModule()
    const r = buildInspect(M, 'C_GetSessionInfo', [1, u32(0, 3, 0x6, 0)], 0)
    expect(row(r, 'state')?.value).toBe('CKS_RW_USER_FUNCTIONS (3)')
    expect(row(r, 'flags')?.value).toBe('CKF_RW_SESSION | CKF_SERIAL_SESSION (0x00000006)')
  })

  it('C_LoginUser shows the username but never the PIN', () => {
    const { M, bytes } = fakeModule()
    const pin = bytes([0x31, 0x32, 0x33, 0x34])
    const user = bytes([...new TextEncoder().encode('alice')])
    const r = buildInspect(M, 'C_LoginUser', [1, 1, pin, 4, user, 5], 0)
    expect(row(r, 'pUsername')?.value).toBe('"alice"')
    expect(JSON.stringify(r)).not.toContain('1234')
  })
})

describe('pkcs11Inspect — hybrid mechanisms (PKCS#11 v3.3 composite, HPKE / X-Wing)', () => {
  // key 5 = CKP_COMP_SIG_MLDSA44_ED25519_SHA512 (0x03): 2420 + 64 = 2484 bytes
  const SPLIT = 'ML-DSA-44 2420 B + Ed25519 64 B'

  it('C_SignFinal after C_SignInit(CKM_COMP_SIG) splits the multi-part composite signature', () => {
    const { M, u32, bytes, mech } = fakeModule({ 5: 0x03 })
    buildInspect(M, 'C_SignInit', [11, mech(0x403e), 5], 0)
    buildInspect(M, 'C_SignUpdate', [11, bytes([1]), 1], 0)
    const r = buildInspect(M, 'C_SignFinal', [11, bytes([1]), u32(2484)], 0)
    expect(row(r, 'Signature split')?.value).toBe(SPLIT)
  })

  it('C_VerifyFinal after C_VerifyInit(CKM_COMP_SIG) splits the signature and reports the result', () => {
    const { M, bytes, mech } = fakeModule({ 5: 0x03 })
    buildInspect(M, 'C_VerifyInit', [12, mech(0x403e), 5], 0)
    expect(buildInspect(M, 'C_VerifyUpdate', [12, bytes([1]), 1], 0)).toBeDefined()
    const r = buildInspect(M, 'C_VerifyFinal', [12, bytes([0]), 2484], 0)
    expect(row(r, 'Signature split')?.value).toBe(SPLIT)
    expect(row(r, 'Verification')?.value).toContain('VALID')
  })

  it('C_VerifySignatureInit(CKM_COMP_SIG) splits the up-front signature', () => {
    const { M, bytes, mech } = fakeModule({ 5: 0x03 })
    const r = buildInspect(M, 'C_VerifySignatureInit', [13, mech(0x403e), 5, bytes([0]), 2484], 0)
    expect(row(r, 'ulSignatureLen')?.value).toBe('2484 bytes')
    expect(row(r, 'Signature split')?.value).toBe(SPLIT)
  })

  it('C_EncapsulateKey with CKM_HPKE decodes CK_HPKE_PARAMS and names X-Wing', () => {
    const { M, u32, mech, bytes } = fakeModule()
    const info = bytes([0x01, 0x02])
    const params = u32(0x647a, 0x0001, 0x0002, 0, 0, 0, 0, info, 2, 0, 0, 0, 0, 12, 0, 0, 0)
    const r = buildInspect(
      M,
      'C_EncapsulateKey',
      [1, mech(0x80000014, params, 68), 5, 0, 0, 0, 0, 0],
      0
    )
    const sec = r?.inputs.find((s) => s.label === 'CK_HPKE_PARAMS')
    const get = (n: string) => sec?.primitives?.find((p) => p.name === n)?.value
    expect(get('kemId')).toBe('MLKEM768-X25519 (X-Wing) (0x647a)')
    expect(get('kdfId')).toBe('HKDF-SHA256 (0x0001)')
    expect(get('aeadId')).toBe('AES-256-GCM (0x0002)')
    expect(get('mode')).toBe('Base (0x0000)')
    expect(get('info')).toBe('2 bytes  [0102]')
  })

  it('C_DecapsulateKey with CKM_HPKE decodes the same parameters', () => {
    const { M, u32, mech } = fakeModule()
    const params = u32(0x0050, 0x0011, 0xffff, 1, 9, 0, 0, 0, 0, 0, 0, 0, 0, 12, 0, 0, 0)
    const r = buildInspect(
      M,
      'C_DecapsulateKey',
      [1, mech(0x80000014, params, 68), 5, 0, 0, 0, 0, 0],
      0
    )
    const sec = r?.inputs.find((s) => s.label === 'CK_HPKE_PARAMS')
    const get = (n: string) => sec?.primitives?.find((p) => p.name === n)?.value
    expect(get('kemId')).toBe('MLKEM768-P256 (0x0050)')
    expect(get('kdfId')).toBe('SHAKE256 (one-stage, draft-ietf-hpke-pq) (0x0011)')
    expect(get('aeadId')).toBe('Export-only (no AEAD) (0xffff)')
    expect(get('mode')).toBe('PSK (0x0001)')
    expect(get('hPsk')).toBe('9')
  })

  it('C_GenerateKeyPair(CKM_HPKE_KEM_KEY_PAIR_GEN) names the X-Wing parameter set', () => {
    const { M, u32, mech } = fakeModule()
    const val = u32(0x647a)
    const tpl = u32(CKA_PARAMETER_SET, val, 4)
    const r = buildInspect(M, 'C_GenerateKeyPair', [1, mech(0x80000013), tpl, 1, 0, 0, 0, 0], 0)
    const attr = r?.inputs
      .find((s) => s.label === 'Public Key Template')
      ?.attributes?.find((a) => a.typeName === 'CKA_PARAMETER_SET')
    expect(attr?.value.display).toBe('MLKEM768-X25519 (X-Wing) (0x647a)')
  })
})
