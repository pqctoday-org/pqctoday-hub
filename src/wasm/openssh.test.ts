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
    hsm_ecdhDerive: vi.fn().mockReturnValue(7),
    hsm_eddsaSign: vi.fn().mockReturnValue(new Uint8Array(64).fill(0x03)),
    hsm_signBytesMLDSA: vi.fn().mockReturnValue(new Uint8Array(3309).fill(0x04)),
    hsm_encapsulate: vi.fn().mockReturnValue({
      ciphertextBytes: new Uint8Array(1088).fill(0x05),
      secretHandle: 12,
    }),
    hsm_extractECPoint: vi.fn().mockReturnValue(new Uint8Array(32).fill(0x01)),
    hsm_extractKeyValue: vi.fn().mockReturnValue(new Uint8Array(32).fill(0x02)),
    hsm_digest: vi.fn().mockReturnValue(new Uint8Array(32).fill(0x07)),
    CKM_SHA256: 0x250,
    CKD_NULL: 0x00000001,
    createLoggingProxy: vi.fn().mockImplementation((m: unknown) => m),
  }
})

import { SshEngine } from './openssh'
import {
  hsm_generateEdDSAKeyPair,
  hsm_generateECKeyPair,
  hsm_generateMLDSAKeyPair,
  hsm_generateMLKEMKeyPair,
  hsm_eddsaSign,
  hsm_signBytesMLDSA,
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
      expect(result.kex_algorithm).toBe('mlkem768x25519-sha256')
      expect(result.host_key_algorithm).toBe('ssh-mldsa-65')
      expect(result.quantum_safe).toBe(true)
    })
  })

  it('terminate() clears binding and subsequent runHandshake throws', async () => {
    engine.bindHsm({ module: fakeModule as never, hSession: 1 })
    engine.terminate()
    await expect(engine.runHandshake('classical')).rejects.toThrow()
  })
})
