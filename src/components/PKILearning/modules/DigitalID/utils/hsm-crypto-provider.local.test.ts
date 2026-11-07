// SPDX-License-Identifier: AGPL-3.0-only
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AsnConvert } from '@peculiar/asn1-schema'
import { AlgorithmIdentifier, SubjectPublicKeyInfo } from '@peculiar/asn1-x509'
import { SoftHSMCryptoProvider } from './hsm-crypto-provider'
import type { SoftHSMModule } from '@/wasm/softhsm'
import {
  hsm_eddsaSign,
  hsm_eddsaVerify,
  hsm_ecdsaSign,
  hsm_ecdsaVerify,
} from '@/wasm/softhsm/classical'
import { hsm_getPublicKeyInfo } from '@/wasm/softhsm/objects'
vi.mock('@/wasm/softhsm', () => ({
  hsm_generateECKeyPair: vi.fn(() => ({ pubHandle: 11, privHandle: 12 })),
  hsm_generateEdDSAKeyPair: vi.fn(() => ({ pubHandle: 21, privHandle: 22 })),
  hsm_extractECPoint: vi.fn(() => new Uint8Array([4, 65, 4, ...Array(64).fill(1)])),
  hsm_digest: vi.fn(),
  CKM_ECDSA_SHA256: 0x1044,
  CKM_ECDSA_SHA384: 0x1045,
}))
vi.mock('@/wasm/softhsm/classical', () => ({
  hsm_eddsaSign: vi.fn(() => new Uint8Array(64)),
  hsm_eddsaVerify: vi.fn(() => true),
  hsm_ecdsaSign: vi.fn(() => new Uint8Array(64)),
  hsm_ecdsaVerify: vi.fn(() => true),
}))
vi.mock('@/wasm/softhsm/objects', () => ({ hsm_getPublicKeyInfo: vi.fn() }))
// Generation uses the monolithic helper for EC as before; signing uses classical.
import { hsm_generateECKeyPair as ecGenerate, hsm_generateEdDSAKeyPair } from '@/wasm/softhsm'
const module = { _C_DestroyObject: vi.fn(() => 0) } as unknown as SoftHSMModule
const registry = { addKey: vi.fn() }
const provider = new SoftHSMCryptoProvider(module, 1, registry)
beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(hsm_getPublicKeyInfo).mockReturnValue(
    new Uint8Array(
      AsnConvert.serialize(
        new SubjectPublicKeyInfo({
          algorithm: new AlgorithmIdentifier({ algorithm: '1.3.101.112' }),
          subjectPublicKey: new Uint8Array(32).fill(7).buffer,
        })
      )
    )
  )
})
describe('Digital ID algorithm dispatch', () => {
  it('generates native Ed25519 and exposes raw public bytes with consistent labels', async () => {
    const key = await provider.generateKeyPair('EdDSA', 'Ed25519')
    expect(hsm_generateEdDSAKeyPair).toHaveBeenCalledWith(module, 1, 'Ed25519', false)
    expect(ecGenerate).not.toHaveBeenCalled()
    expect(key.publicKey).toBe('07'.repeat(32))
    expect(key.algorithm).toBe('EdDSA')
    expect(key.curve).toBe('Ed25519')
    expect(registry.addKey.mock.calls.map(([k]) => k.family)).toEqual(['eddsa', 'eddsa'])
    expect(await provider.signRaw(key, new Uint8Array([255, 0]))).toHaveLength(64)
    expect(hsm_eddsaSign).toHaveBeenCalledWith(module, 1, 22, new Uint8Array([255, 0]))
    expect(hsm_ecdsaSign).not.toHaveBeenCalled()
    expect(await provider.verifySignature(key, 'AA', new Uint8Array([255, 0]))).toBe(true)
    expect(hsm_eddsaVerify).toHaveBeenCalledWith(
      module,
      1,
      21,
      new Uint8Array([255, 0]),
      new Uint8Array([0]),
      true
    )
    expect(hsm_ecdsaVerify).not.toHaveBeenCalled()
  })
  it.each([
    ['ES256', 'P-256', 0x1044],
    ['ES384', 'P-384', 0x1045],
  ] as const)('preserves %s/%s dispatch', async (alg, curve, mechanism) => {
    const key = await provider.generateKeyPair(alg, curve)
    expect(ecGenerate).toHaveBeenCalledWith(module, 1, curve, false, 'sign')
    await provider.signRaw(key, new Uint8Array([1]))
    expect(hsm_ecdsaSign).toHaveBeenCalledWith(module, 1, 12, new Uint8Array([1]), mechanism)
    await provider.verifySignature(key, 'AA', 'sample')
    expect(hsm_ecdsaVerify).toHaveBeenCalledWith(
      module,
      1,
      11,
      new TextEncoder().encode('sample'),
      new Uint8Array([0]),
      mechanism
    )
  })
  it.each([
    ['ES256', 'Ed25519'],
    ['EdDSA', 'P-256'],
    ['ES384', 'P-256'],
  ] as const)('rejects contradictory %s/%s before generation', async (alg, curve) => {
    await expect(provider.generateKeyPair(alg, curve)).rejects.toThrow(/Unsupported/)
    expect(ecGenerate).not.toHaveBeenCalled()
    expect(hsm_generateEdDSAKeyPair).not.toHaveBeenCalled()
  })
  it('does not turn a verifier operation error into a rejected signature', async () => {
    const key = await provider.generateKeyPair('EdDSA', 'Ed25519')
    vi.mocked(hsm_eddsaVerify).mockImplementationOnce(() => {
      throw new Error('C_Verify operation error')
    })
    await expect(provider.verifySignature(key, 'AA', 'sample')).rejects.toThrow(/operation error/)
  })
  it('preserves an actual invalid-signature outcome', async () => {
    const key = await provider.generateKeyPair('EdDSA', 'Ed25519')
    vi.mocked(hsm_eddsaVerify).mockReturnValueOnce(false)
    expect(await provider.verifySignature(key, 'AA', 'changed')).toBe(false)
  })
  it('rejects missing and invalid handles before signing or verifying', async () => {
    const key = await provider.generateKeyPair('EdDSA', 'Ed25519')
    for (const privateKey of ['', '[PKCS#11 handle: 0]', '[PKCS#11 handle: 12] trailing'])
      await expect(provider.signRaw({ ...key, privateKey }, new Uint8Array())).rejects.toThrow()
    for (const meta of [undefined, { pubHandle: 0 }, { pubHandle: '21' }])
      await expect(provider.verifySignature({ ...key, meta }, 'AA', 'sample')).rejects.toThrow()
    expect(hsm_eddsaSign).not.toHaveBeenCalled()
    expect(hsm_eddsaVerify).not.toHaveBeenCalled()
  })
  it('rejects a key relabelled after generation', async () => {
    const key = await provider.generateKeyPair('EdDSA', 'Ed25519')
    await expect(
      provider.signRaw({ ...key, algorithm: 'ES256' }, new Uint8Array())
    ).rejects.toThrow(/Unsupported/)
  })
  it('cleans up an unreturned key pair if the engine exports the wrong SPKI', async () => {
    vi.mocked(hsm_getPublicKeyInfo).mockReturnValue(new Uint8Array([1, 2, 3]))
    await expect(provider.generateKeyPair('EdDSA', 'Ed25519')).rejects.toThrow()
    expect(module._C_DestroyObject).toHaveBeenCalledWith(1, 21)
    expect(module._C_DestroyObject).toHaveBeenCalledWith(1, 22)
    expect(registry.addKey).not.toHaveBeenCalled()
  })
})
