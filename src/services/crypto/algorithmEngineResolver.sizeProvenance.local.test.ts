// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect, vi, beforeEach } from 'vitest'
const {
  M,
  generateRsa,
  signRsa,
  verifyRsa,
  extract,
  publicDer,
  readAttr,
  generateDsa,
  signDsa,
  verifyDsa,
} = vi.hoisted(() => ({
  M: {},
  generateRsa: vi.fn(),
  signRsa: vi.fn(),
  verifyRsa: vi.fn(),
  extract: vi.fn(),
  publicDer: vi.fn(),
  readAttr: vi.fn(),
  generateDsa: vi.fn(),
  signDsa: vi.fn(),
  verifyDsa: vi.fn(),
}))
vi.mock('@/wasm/softhsm', () => ({
  getSoftHSMRustModule: async () => M,
  hsm_initialize: vi.fn(),
  hsm_getFirstFreeSlot: () => 1,
  hsm_getFirstInitializedSlot: () => 1,
  hsm_initToken: () => 1,
  hsm_openUserSession: () => 7,
  hsm_generateRSAKeyPair: generateRsa,
  hsm_rsaSign: signRsa,
  hsm_rsaVerify: verifyRsa,
  hsm_extractKeyValue: extract,
  hsm_extractRSAPublicKeyDer: publicDer,
  readBytesAttr: readAttr,
  CKA_MODULUS: 0x120,
  CKA_PUBLIC_EXPONENT: 0x122,
  CKA_PRIVATE_EXPONENT: 0x123,
  CKA_PRIME_1: 0x124,
  CKA_PRIME_2: 0x125,
  CKA_EXPONENT_1: 0x126,
  CKA_EXPONENT_2: 0x127,
  CKA_COEFFICIENT: 0x128,
  hsm_generateMLDSAKeyPair: generateDsa,
  hsm_signBytesMLDSA: signDsa,
  hsm_verifyBytes: verifyDsa,
}))
import { runBenchmark } from './algorithmEngineResolver'
describe('RSA benchmark representation provenance', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    generateRsa.mockReturnValue({ pubHandle: 11, privHandle: 12 })
    signRsa.mockReturnValue(new Uint8Array(256))
    verifyRsa.mockReturnValue(true)
    publicDer.mockReturnValue(new Uint8Array(270))
    readAttr.mockImplementation((_M, _s, _h, attr) => ({
      rv: 0,
      value: attr === 0x122 ? new Uint8Array([1, 0, 1]) : new Uint8Array(128).fill(0x7f),
    }))
    generateDsa.mockReturnValue({ pubHandle: 21, privHandle: 22 })
    extract.mockImplementation((_M, _s, handle) => new Uint8Array(handle === 21 ? 1952 : 4032))
    signDsa.mockReturnValue(new Uint8Array(3309))
    verifyDsa.mockReturnValue(true)
  })
  it.each([2048, 3072, 4096] as const)(
    'measures both RSA-%s binary PKCS#1 encodings without comparing catalogue guesses',
    async (bits) => {
      signRsa.mockReturnValue(new Uint8Array(bits / 8))
      publicDer.mockReturnValue(new Uint8Array(bits / 8 + 14))
      const r = await runBenchmark(`RSA-${bits}`)
      expect(r.publicKeyBytes).toBe(bits / 8 + 14)
      expect(r.privateKeyBytes).toBeGreaterThan(900)
      expect(r.rsaKeyEncoding).toBe('pkcs1-der')
      expect(publicDer).toHaveBeenCalledWith(M, 7, 11)
      expect(readAttr).toHaveBeenCalledTimes(8)
      expect(r.keySizeEstimates).toEqual({
        rsaModulusBytes: bits / 8,
        rsaPrivateHeuristicBytes: (bits / 8) * 2,
      })
      expect(r.sigCiphertextBytes).toBe(bits / 8)
      expect(generateRsa).toHaveBeenCalledWith(M, 7, bits, true)
      expect(signRsa).toHaveBeenCalledWith(M, 7, 12, 'bench')
      expect(verifyRsa).toHaveBeenCalledWith(M, 7, 11, 'bench', expect.any(Uint8Array))
      expect(extract).not.toHaveBeenCalled()
      expect(r.keyGenMs).toBeGreaterThanOrEqual(0)
    }
  )
  it('uses returned binary byte length rather than a modulus or catalogue formula', async () => {
    publicDer.mockReturnValue(new Uint8Array(271))
    expect((await runBenchmark('RSA-2048')).publicKeyBytes).toBe(271)
  })
  it('does not turn a denied private attribute into a completed benchmark', async () => {
    readAttr.mockReturnValue({ rv: 0x11, value: null })
    await expect(runBenchmark('RSA-2048')).rejects.toThrow(/private.*attribute/i)
    expect(signRsa).not.toHaveBeenCalled()
  })
  it('does not publish a partial benchmark when public extraction fails', async () => {
    publicDer.mockImplementation(() => {
      throw new Error('public attribute read failed')
    })
    await expect(runBenchmark('RSA-2048')).rejects.toThrow('public attribute read failed')
    expect(readAttr).not.toHaveBeenCalled()
    expect(signRsa).not.toHaveBeenCalled()
  })
  it('leaves the existing measured non-RSA output fields and operations unchanged', async () => {
    const r = await runBenchmark('ML-DSA-65')
    expect(r.publicKeyBytes).toBe(1952)
    expect(r.privateKeyBytes).toBe(4032)
    expect(r.sigCiphertextBytes).toBe(3309)
    expect(r).not.toHaveProperty('keySizeEstimates')
    expect(generateDsa).toHaveBeenCalledWith(M, 7, 65, true)
  })
})
