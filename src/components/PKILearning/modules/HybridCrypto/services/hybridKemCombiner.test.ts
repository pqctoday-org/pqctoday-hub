// SPDX-License-Identifier: AGPL-3.0-only
/**
 * The Hybrid Key Establishment demo's combiner (hybridKemCombiner.ts).
 *
 * The demo used to place the ML-KEM secret in the HKDF salt and the X25519
 * secret in the input. CMVP IG D.S approves a concatenation of the shared
 * secrets fed into an SP 800-56C KDF (HKDF included), not that form. These
 * checks pin the form that replaced it:
 *
 *  - the input is ML-KEM_ss || X25519_ss, ML-KEM first (RFC 10024 section 4.3
 *    for X25519MLKEM768: "the concatenation of the ML-KEM shared secret and the
 *    X25519 shared secret", 64 bytes);
 *  - no secret is passed as the salt;
 *  - HKDF-SHA-256 with a 32-byte output and the domain-separation label.
 *
 * The call is checked against the real engine and an independent HKDF in
 * hybridKemCombiner.local.test.ts.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { SoftHSMModule } from '@/wasm/softhsm'

const hkdf = vi.fn()
const importSecret = vi.fn()
vi.mock('@/wasm/softhsm', async (original) => ({
  ...(await original<typeof import('@/wasm/softhsm')>()),
  hsm_hkdf: (...a: unknown[]) => hkdf(...a),
  hsm_importGenericSecret: (...a: unknown[]) => importSecret(...a),
}))

import { CKM_SHA256 } from '@/wasm/softhsm'
import { combineHybridSecrets, concatHybridSecrets, HYBRID_KEM_INFO } from './hybridKemCombiner'

const kemSS = Uint8Array.from({ length: 32 }, (_, i) => 0x10 + i)
const ecdhSS = Uint8Array.from({ length: 32 }, (_, i) => 0xa0 + i)

beforeEach(() => {
  hkdf.mockReset()
  importSecret.mockReset()
})

describe('concatHybridSecrets', () => {
  it('puts the ML-KEM secret first and the X25519 secret second (64 bytes)', () => {
    const ikm = concatHybridSecrets(kemSS, ecdhSS)
    expect(ikm).toHaveLength(64)
    expect(Array.from(ikm.slice(0, 32))).toEqual(Array.from(kemSS))
    expect(Array.from(ikm.slice(32))).toEqual(Array.from(ecdhSS))
  })
})

describe('combineHybridSecrets', () => {
  it('feeds the concatenation to HKDF-SHA-256 as input key material, with no salt', () => {
    const M = {} as SoftHSMModule
    importSecret.mockReturnValue(41)
    hkdf.mockImplementation(
      (
        _m: unknown,
        _s: unknown,
        _base: unknown,
        _prf: unknown,
        _ex: unknown,
        _exp: unknown,
        _salt: unknown,
        _info: unknown,
        _len: unknown,
        out: { current: number }
      ) => {
        out.current = 42
        return new Uint8Array(32).fill(7)
      }
    )

    const r = combineHybridSecrets(M, 9, kemSS, ecdhSS)

    // The generic secret that HKDF derives from holds ML-KEM_ss || X25519_ss.
    expect(importSecret).toHaveBeenCalledTimes(1)
    expect(Array.from(importSecret.mock.calls[0][2] as Uint8Array)).toEqual(
      Array.from(concatHybridSecrets(kemSS, ecdhSS))
    )
    // HKDF base key = that object; extract + expand; no salt; label as info; 32 bytes out.
    const [, session, base, prf, extract, expand, salt, info, len] = hkdf.mock.calls[0]
    expect(session).toBe(9)
    expect(base).toBe(41)
    expect(prf).toBe(CKM_SHA256)
    expect(extract).toBe(true)
    expect(expand).toBe(true)
    expect(salt).toBeUndefined()
    expect(new TextDecoder().decode(info as Uint8Array)).toBe(HYBRID_KEM_INFO)
    expect(len).toBe(32)
    expect(r.ikmHandle).toBe(41)
    expect(r.keyHandle).toBe(42)
    expect(r.key).toHaveLength(32)
  })

  it('keeps the domain-separation label', () => {
    expect(HYBRID_KEM_INFO).toBe('hybrid-kem-x25519-mlkem768-v1')
  })
})
