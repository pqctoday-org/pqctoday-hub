// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect, vi, beforeEach } from 'vitest'
const { M, generateRsa, signRsa, verifyRsa, extract, generateDsa, signDsa, verifyDsa } = vi.hoisted(
  () => ({
    M: {},
    generateRsa: vi.fn(),
    signRsa: vi.fn(),
    verifyRsa: vi.fn(),
    extract: vi.fn(),
    generateDsa: vi.fn(),
    signDsa: vi.fn(),
    verifyDsa: vi.fn(),
  })
)
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
    generateDsa.mockReturnValue({ pubHandle: 21, privHandle: 22 })
    extract.mockImplementation((_M, _s, handle) => new Uint8Array(handle === 21 ? 1952 : 4032))
    signDsa.mockReturnValue(new Uint8Array(3309))
    verifyDsa.mockReturnValue(true)
  })
  it.each([2048, 3072, 4096] as const)(
    'keeps RSA-%s serialized measurements unknown and names the original estimates',
    async (bits) => {
      signRsa.mockReturnValue(new Uint8Array(bits / 8))
      const r = await runBenchmark(`RSA-${bits}`)
      expect(r.publicKeyBytes).toBeNull()
      expect(r.privateKeyBytes).toBeNull()
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
  it('leaves the existing measured non-RSA output fields and operations unchanged', async () => {
    const r = await runBenchmark('ML-DSA-65')
    expect(r.publicKeyBytes).toBe(1952)
    expect(r.privateKeyBytes).toBe(4032)
    expect(r.sigCiphertextBytes).toBe(3309)
    expect(r).not.toHaveProperty('keySizeEstimates')
    expect(generateDsa).toHaveBeenCalledWith(M, 7, 65, true)
  })
})
