// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('./softhsm', () => {
  let ecKeyPairCallCount = 0
  return {
    hsm_generateEdDSAKeyPair: vi.fn().mockReturnValue({ pubHandle: 1, privHandle: 2 }),
    hsm_generateECKeyPair: vi.fn().mockImplementation(() => {
      ecKeyPairCallCount++
      return ecKeyPairCallCount === 1
        ? { pubHandle: 3, privHandle: 4 }
        : { pubHandle: 5, privHandle: 6 }
    }),
    hsm_generateMLDSAKeyPair: vi.fn().mockReturnValue({ pubHandle: 8, privHandle: 9 }),
    hsm_generateMLKEMKeyPair: vi.fn().mockReturnValue({ pubHandle: 10, privHandle: 11 }),
    hsm_generateSLHDSAKeyPair: vi.fn().mockReturnValue({ pubHandle: 13, privHandle: 14 }),
    hsm_ecdhDerive: vi.fn().mockReturnValue(7),
    hsm_eddsaSign: vi.fn().mockReturnValue(new Uint8Array(64).fill(0x03)),
    hsm_signBytesMLDSA: vi.fn().mockReturnValue(new Uint8Array(3309).fill(0x04)),
    hsm_signBytesSLHDSA: vi.fn().mockReturnValue(new Uint8Array(7856).fill(0x06)),
    hsm_encapsulate: vi.fn().mockReturnValue({
      ciphertextBytes: new Uint8Array(1088).fill(0x05),
      secretHandle: 12,
    }),
    hsm_extractECPoint: vi.fn().mockReturnValue(new Uint8Array(32).fill(0x01)),
    hsm_extractKeyValue: vi.fn().mockReturnValue(new Uint8Array(32).fill(0x02)),
    hsm_digest: vi.fn().mockReturnValue(new Uint8Array(32).fill(0x07)),
    CKM_SHA256: 0x250,
    CKD_NULL: 0x00000001,
    // Real values from softhsm.ts (pkcs11t.h ordering) — the modeled engine's
    // hostKeyAlgInfo() switch keys off these to pick the SLH-DSA param set.
    CKP_SLH_DSA_SHA2_128S: 0x01,
    CKP_SLH_DSA_SHAKE_128S: 0x02,
    CKP_SLH_DSA_SHA2_128F: 0x03,
    CKP_SLH_DSA_SHAKE_128F: 0x04,
    CKP_SLH_DSA_SHA2_256S: 0x09,
    CKP_SLH_DSA_SHAKE_256S: 0x0a,
    CKP_SLH_DSA_SHA2_256F: 0x0b,
    CKP_SLH_DSA_SHAKE_256F: 0x0c,
    createLoggingProxy: vi.fn().mockImplementation((m: unknown) => m),
  }
})

import { SshEngine } from './openssh'
import {
  hsm_generateEdDSAKeyPair,
  hsm_generateECKeyPair,
  hsm_generateMLDSAKeyPair,
  hsm_generateMLKEMKeyPair,
  hsm_generateSLHDSAKeyPair,
  hsm_eddsaSign,
  hsm_signBytesMLDSA,
  hsm_signBytesSLHDSA,
  hsm_encapsulate,
} from './softhsm'

const fakeModule = {} as Parameters<SshEngine['bindHsm']>[0] extends { module: infer M } ? M : never

describe('SshEngine', () => {
  let engine: SshEngine

  beforeEach(() => {
    vi.clearAllMocks()
    engine = new SshEngine()
  })

  it('bindHsm sets ready state — runHandshake resolves after bind', async () => {
    engine.bindHsm({ module: fakeModule as never, hSession: 1 })
    const result = await engine.runHandshake('classical')
    expect(result.connection_ok).toBe(true)
  })

  it('unbound engine throws on runHandshake', async () => {
    await expect(engine.runHandshake('classical')).rejects.toThrow('No HSM binding')
  })

  describe('classical handshake', () => {
    beforeEach(() => {
      engine.bindHsm({ module: fakeModule as never, hSession: 1 })
    })

    it('calls hsm_generateEdDSAKeyPair exactly twice', async () => {
      await engine.runHandshake('classical')
      expect(hsm_generateEdDSAKeyPair).toHaveBeenCalledTimes(2)
    })

    it('calls hsm_generateECKeyPair exactly twice', async () => {
      await engine.runHandshake('classical')
      expect(hsm_generateECKeyPair).toHaveBeenCalledTimes(2)
    })

    it('calls hsm_eddsaSign exactly twice', async () => {
      await engine.runHandshake('classical')
      expect(hsm_eddsaSign).toHaveBeenCalledTimes(2)
    })

    it('does NOT call ML-DSA or ML-KEM functions', async () => {
      await engine.runHandshake('classical')
      expect(hsm_generateMLDSAKeyPair).not.toHaveBeenCalled()
      expect(hsm_generateMLKEMKeyPair).not.toHaveBeenCalled()
      expect(hsm_signBytesMLDSA).not.toHaveBeenCalled()
      expect(hsm_encapsulate).not.toHaveBeenCalled()
    })

    it('returns classical algorithm names', async () => {
      const result = await engine.runHandshake('classical')
      expect(result.kex_algorithm).toBe('curve25519-sha256')
      expect(result.host_key_algorithm).toBe('ssh-ed25519')
      expect(result.quantum_safe).toBe(false)
    })

    it('returns pkcs11_host_backed true', async () => {
      const result = await engine.runHandshake('classical')
      expect(result.pkcs11_host_backed).toBe(true)
      expect(result.pkcs11_client_backed).toBe(true)
    })
  })

  describe('PQC handshake', () => {
    beforeEach(() => {
      engine.bindHsm({ module: fakeModule as never, hSession: 1 })
    })

    it('calls hsm_generateMLDSAKeyPair with variant 65 exactly twice', async () => {
      await engine.runHandshake('pqc')
      expect(hsm_generateMLDSAKeyPair).toHaveBeenCalledTimes(2)
      expect(hsm_generateMLDSAKeyPair).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        65,
        false
      )
    })

    it('calls hsm_generateMLKEMKeyPair with variant 768 exactly once', async () => {
      await engine.runHandshake('pqc')
      expect(hsm_generateMLKEMKeyPair).toHaveBeenCalledTimes(1)
      expect(hsm_generateMLKEMKeyPair).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        768,
        true
      )
    })

    it('calls hsm_encapsulate exactly once', async () => {
      await engine.runHandshake('pqc')
      expect(hsm_encapsulate).toHaveBeenCalledTimes(1)
    })

    it('calls hsm_signBytesMLDSA exactly twice', async () => {
      await engine.runHandshake('pqc')
      expect(hsm_signBytesMLDSA).toHaveBeenCalledTimes(2)
    })

    it('does NOT call Ed25519 sign', async () => {
      await engine.runHandshake('pqc')
      expect(hsm_eddsaSign).not.toHaveBeenCalled()
    })

    it('returns PQC algorithm names', async () => {
      const result = await engine.runHandshake('pqc')
      // Legacy 'pqc' mode now maps to the canonical IETF KEX name used by the
      // structured-config refactor (Fix 2).
      expect(result.kex_algorithm).toBe('mlkem768-curve25519-sha256')
      expect(result.host_key_algorithm).toBe('ssh-mldsa-65')
      expect(result.quantum_safe).toBe(true)
    })
  })

  it('terminate() clears binding and subsequent runHandshake throws', async () => {
    engine.bindHsm({ module: fakeModule as never, hSession: 1 })
    engine.terminate()
    await expect(engine.runHandshake('classical')).rejects.toThrow()
  })

  describe('structured config (Fix 2)', () => {
    beforeEach(() => {
      engine.bindHsm({ module: fakeModule as never, hSession: 1 })
    })

    it('pure ML-KEM-768 + ML-DSA-87 skips classical EC keygen', async () => {
      const result = await engine.runHandshake({ kex: 'mlkem768', hostKey: 'ssh-mldsa-87' })
      expect(result.connection_ok).toBe(true)
      expect(result.kex_algorithm).toBe('mlkem768')
      expect(result.host_key_algorithm).toBe('ssh-mldsa-87')
      expect(result.quantum_safe).toBe(true)
      // Pure ML-KEM: no classical EC keypair is generated.
      expect(hsm_generateECKeyPair).not.toHaveBeenCalled()
      expect(hsm_generateMLDSAKeyPair).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        87,
        false
      )
      expect(hsm_generateMLKEMKeyPair).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        768,
        true
      )
    })

    it('pure ML-KEM-1024 + ML-DSA-44 uses requested parameter sets', async () => {
      const result = await engine.runHandshake({ kex: 'mlkem1024', hostKey: 'ssh-mldsa-44' })
      expect(result.connection_ok).toBe(true)
      expect(result.kex_algorithm).toBe('mlkem1024')
      expect(result.host_key_algorithm).toBe('ssh-mldsa-44')
      expect(hsm_generateMLDSAKeyPair).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        44,
        false
      )
      expect(hsm_generateMLKEMKeyPair).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        1024,
        true
      )
    })

    it('hybrid ML-KEM-512 + nistp256 still generates a classical EC keypair', async () => {
      const result = await engine.runHandshake({
        kex: 'mlkem512-nistp256-sha256',
        hostKey: 'ssh-mldsa-65',
      })
      expect(result.connection_ok).toBe(true)
      expect(result.kex_algorithm).toBe('mlkem512-nistp256-sha256')
      // Hybrid path: server + client EC keypair generation (2 calls).
      expect(hsm_generateECKeyPair).toHaveBeenCalledTimes(2)
      expect(hsm_generateMLKEMKeyPair).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        512,
        true
      )
    })
  })

  // 2026-08-31: SLH-DSA UI wiring — the modeled engine (this file's SUT) now
  // dispatches to hsm_generateSLHDSAKeyPair/hsm_signBytesSLHDSA for any of the
  // 8 real SLH-DSA host keys, mirroring the ML-DSA dispatch above via the same
  // generateHostKeyPair/signWithHostKeyFamily family-dispatch helpers in
  // openssh.ts. This exercises the fallback path a user hits by picking an
  // SLH-DSA host key with a non-real KEX (the real-combo case skips this
  // engine entirely and drives the actual OpenSSH WASM binary instead).
  describe('SLH-DSA host keys (structured config)', () => {
    beforeEach(() => {
      engine.bindHsm({ module: fakeModule as never, hSession: 1 })
    })

    it('ssh-slh-dsa-sha2-128s dispatches to SLH-DSA gen/sign, not ML-DSA', async () => {
      const result = await engine.runHandshake({
        kex: 'mlkem768-curve25519-sha256',
        hostKey: 'ssh-slh-dsa-sha2-128s',
      })
      expect(result.connection_ok).toBe(true)
      expect(result.host_key_algorithm).toBe('ssh-slh-dsa-sha2-128s')
      expect(result.quantum_safe).toBe(true)
      expect(hsm_generateSLHDSAKeyPair).toHaveBeenCalledTimes(2)
      expect(hsm_generateSLHDSAKeyPair).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        0x01, // CKP_SLH_DSA_SHA2_128S
        false
      )
      expect(hsm_signBytesSLHDSA).toHaveBeenCalledTimes(2)
      expect(hsm_generateMLDSAKeyPair).not.toHaveBeenCalled()
      expect(hsm_signBytesMLDSA).not.toHaveBeenCalled()
    })

    it('ssh-slh-dsa-shake-256f resolves the correct CKP_SLH_DSA_SHAKE_256F param set', async () => {
      await engine.runHandshake({
        kex: 'mlkem1024',
        hostKey: 'ssh-slh-dsa-shake-256f',
      })
      expect(hsm_generateSLHDSAKeyPair).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        0x0c, // CKP_SLH_DSA_SHAKE_256F
        false
      )
      // Pure ML-KEM-1024: no classical EC keypair generated.
      expect(hsm_generateECKeyPair).not.toHaveBeenCalled()
    })

    it('reports the real signature bytes returned by hsm_signBytesSLHDSA', async () => {
      const result = await engine.runHandshake({
        kex: 'mlkem768-curve25519-sha256',
        hostKey: 'ssh-slh-dsa-sha2-256s',
      })
      // Mock always returns a 7856-byte signature regardless of param set —
      // this just asserts the result plumbs through hostSig.length honestly
      // rather than a hardcoded ML-DSA-sized constant.
      expect(result.host_sig_bytes).toBe(7856)
      expect(result.client_sig_bytes).toBe(7856)
    })
  })
})
