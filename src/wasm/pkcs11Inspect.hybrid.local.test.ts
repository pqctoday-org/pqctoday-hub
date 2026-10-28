// SPDX-License-Identifier: AGPL-3.0-only
//
// The Log panel's Inspect drawer on the real Rust engine for the hybrid
// paths: X-Wing (MLKEM768-X25519) through CKM_HPKE, and multi-part composite
// ML-DSA sign/verify (PKCS#11 v3.3 working draft). Every call goes through
// the same createLoggingProxy the playground uses, so this checks the
// decoders against the real argument layouts and heap, not a fake one.
//
// Venue: `*.local.test.ts` — run by the local gate, not CI.
import { describe, it, expect, beforeAll } from 'vitest'
import * as SoftHSM from '@/wasm/softhsm'
import type { Pkcs11LogEntry } from '@/wasm/softhsm'

const row = (e: Pkcs11LogEntry | undefined, name: string) =>
  [
    ...(e?.inspect?.inputs.flatMap((s) => s.primitives ?? []) ?? []),
    ...(e?.inspect?.outputs ?? []),
  ].find((r) => r.name === name)

describe('Inspect drawer on the real engine — hybrid mechanisms', () => {
  let M: SoftHSM.SoftHSMModule
  let hSession: number
  const log: Pkcs11LogEntry[] = []

  beforeAll(async () => {
    const raw = (await SoftHSM.getSoftHSMRustModule()) as SoftHSM.SoftHSMModule
    SoftHSM.hsm_initialize(raw)
    const slot = SoftHSM.hsm_initToken(
      raw,
      SoftHSM.hsm_getFirstFreeSlot(raw),
      '1234',
      'Inspect hybrid'
    )
    hSession = SoftHSM.hsm_openUserSession(raw, slot, '1234', '1234')
    M = SoftHSM.createLoggingProxy(raw, (e) => log.push(e), 'rust')
  })

  it('X-Wing over CKM_HPKE: key generation names the KEM and encapsulation decodes CK_HPKE_PARAMS', () => {
    log.length = 0
    const { pubHandle } = SoftHSM.hsm_generateHpkeKeyPair(
      M,
      hSession,
      SoftHSM.CKP_HPKE_KEM_MLKEM768_X25519
    )
    const gen = log.find((e) => e.fn === 'C_GenerateKeyPair')
    const attr = gen?.inspect?.inputs
      .find((s) => s.label === 'Public Key Template')
      ?.attributes?.find((a) => a.typeName === 'CKA_PARAMETER_SET')
    expect(attr?.value.display).toBe('MLKEM768-X25519 (X-Wing) (0x647a)')

    log.length = 0
    SoftHSM.hsm_hpkeEncapsulate(M, hSession, pubHandle, {
      kemId: SoftHSM.CKP_HPKE_KEM_MLKEM768_X25519,
      kdfId: SoftHSM.CKD_HPKE_HKDF_SHA256,
      aeadId: SoftHSM.CKZ_HPKE_AEAD_256_GCM,
      mode: SoftHSM.CKZ_HPKE_MODE_BASE,
      info: new Uint8Array([1, 2, 3]),
    })
    const encaps = log.filter((e) => e.fn === 'C_EncapsulateKey')
    expect(encaps.length).toBeGreaterThan(0)
    const last = encaps[encaps.length - 1]
    expect(last.ok).toBe(true)
    const hpke = last.inspect?.inputs.find((s) => s.label === 'CK_HPKE_PARAMS')
    const get = (n: string) => hpke?.primitives?.find((p) => p.name === n)?.value
    expect(get('kemId')).toBe('MLKEM768-X25519 (X-Wing) (0x647a)')
    expect(get('kdfId')).toBe('HKDF-SHA256 (0x0001)')
    expect(get('aeadId')).toBe('AES-256-GCM (0x0002)')
    expect(get('mode')).toBe('Base (0x0000)')
    expect(get('info')).toBe('3 bytes  [010203]')
    // X-Wing ciphertext: ML-KEM-768 1088 B ‖ X25519 32 B (draft-connolly-cfrg-xwing-kem).
    expect(row(last, '*pulCiphertextLen')?.value).toBe('1120 bytes')
  })

  it('multi-part composite ML-DSA: C_SignFinal and C_VerifyFinal split the signature', () => {
    // CKP_COMP_SIG_MLDSA44_ED25519_SHA512 (0x03): ML-DSA-44 2420 B ‖ Ed25519 64 B
    const k = SoftHSM.hsm_generateCompositeKeyPair(M, hSession, 'sig', 0x03)
    const data = new Uint8Array(300).fill(7)
    log.length = 0
    const s = SoftHSM.hsm_compositeSignRv(M, hSession, k.privHandle, data, { multiPartChunk: 128 })
    expect(s.rv).toBe(0)
    const finals = log.filter((e) => e.fn === 'C_SignFinal' && e.ok)
    expect(row(finals[finals.length - 1], 'Signature split')?.value).toBe(
      'ML-DSA-44 2420 B + Ed25519 64 B'
    )
    expect(log.filter((e) => e.fn === 'C_SignUpdate').every((e) => e.inspect)).toBe(true)

    log.length = 0
    const v = SoftHSM.hsm_compositeVerifyRv(M, hSession, k.pubHandle, data, s.signature!, {
      multiPartChunk: 128,
    })
    expect(v.rv).toBe(0)
    expect(log.filter((e) => e.fn === 'C_VerifyUpdate').every((e) => e.inspect)).toBe(true)
    const vf = log.find((e) => e.fn === 'C_VerifyFinal')
    expect(row(vf, 'Signature split')?.value).toBe('ML-DSA-44 2420 B + Ed25519 64 B')
    expect(row(vf, 'Verification')?.value).toContain('VALID')
  })
})
