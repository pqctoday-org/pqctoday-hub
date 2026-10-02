// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { SoftHSMModule } from '../wasm/softhsm'

// ── Mocks (hoisted by Vitest before imports) ──────────────────────────────────

vi.mock('../wasm/softhsm', () => ({
  hsm_importMLKEMPrivateKey: vi.fn(),
  hsm_decapsulate: vi.fn(),
  hsm_extractKeyValue: vi.fn(),
  hsm_generateMLKEMKeyPair: vi.fn(),
  hsm_encapsulate: vi.fn(),
  hsm_importMLDSAPublicKey: vi.fn(),
  hsm_verifyBytes: vi.fn(),
  hsm_generateMLDSAKeyPair: vi.fn(),
  hsm_sign: vi.fn(),
  hsm_verify: vi.fn(),
  hsm_generateSLHDSAKeyPair: vi.fn(),
  hsm_slhdsaSign: vi.fn(),
  hsm_slhdsaVerify: vi.fn(),
  // AES
  hsm_importAESKey: vi.fn(),
  hsm_aesDecrypt: vi.fn(),
  hsm_aesCtrEncrypt: vi.fn(),
  hsm_aesCtrDecrypt: vi.fn(),
  hsm_aesWrapKey: vi.fn(),
  hsm_generateAESKey: vi.fn(),
  hsm_aesEncrypt: vi.fn(),
  // HMAC / Hash
  hsm_importHMACKey: vi.fn(),
  hsm_hmacVerify: vi.fn(),
  hsm_hmacVerifyGeneral: vi.fn(),
  hsm_hmacGeneral: vi.fn(),
  hsm_digest: vi.fn(),
  // ECDSA
  hsm_importECPublicKey: vi.fn(),
  hsm_ecdsaVerify: vi.fn(),
  hsm_generateECKeyPair: vi.fn(),
  hsm_ecdsaSign: vi.fn(),
  // EdDSA
  hsm_importEdDSAPublicKey: vi.fn(),
  hsm_eddsaVerify: vi.fn(),
  hsm_generateEdDSAKeyPair: vi.fn(),
  hsm_eddsaSign: vi.fn(),
  // RSA
  hsm_importRSAPublicKey: vi.fn(),
  hsm_rsaVerify: vi.fn(),
  hsm_rsaVerifyBytes: vi.fn(),
  hsm_generateRSAKeyPair: vi.fn(),
  hsm_rsaSign: vi.fn(),
  // HSS/LMS (RFC 8554)
  hsm_importStatefulPublicKey: vi.fn(),
  hsm_statefulVerifyBytes: vi.fn(),
  rvName: (rv: number) => (rv === 0 ? 'CKR_OK' : `CKR_0x${rv.toString(16)}`),
  // SLH-DSA CKP constants
  CKP_SLH_DSA_SHA2_128S: 0x01,
  CKP_SLH_DSA_SHA2_128F: 0x03,
  CKP_SLH_DSA_SHA2_192S: 0x05,
  CKP_SLH_DSA_SHA2_192F: 0x07,
  CKP_SLH_DSA_SHA2_256S: 0x09,
  CKP_SLH_DSA_SHA2_256F: 0x0b,
  CKP_SLH_DSA_SHAKE_128S: 0x02,
  CKP_SLH_DSA_SHAKE_128F: 0x04,
  CKP_SLH_DSA_SHAKE_192S: 0x06,
  CKP_SLH_DSA_SHAKE_192F: 0x08,
  CKP_SLH_DSA_SHAKE_256S: 0x0a,
  CKP_SLH_DSA_SHAKE_256F: 0x0c,
  // Mechanism constants
  CKM_SHA256: 0x250,
  CKM_SHA256_HMAC: 0x251,
  CKM_SHA384_HMAC: 0x261,
  CKM_SHA512_HMAC: 0x271,
  CKM_SHA256_HMAC_GENERAL: 0x252,
  CKM_SHA384_HMAC_GENERAL: 0x262,
  CKM_SHA512_HMAC_GENERAL: 0x272,
  CKM_ECDSA_SHA256: 0x1044,
  CKM_ECDSA_SHA384: 0x1045,
  CKM_SHA256_RSA_PKCS_PSS: 0x43,
}))

vi.mock('../data/acvp/mlkem_test.json', () => ({
  default: {
    testGroups: [
      { parameterSet: 'ML-KEM-512', tests: [{ sk: 'aa', ct: 'bb', ss: '00' }] },
      { parameterSet: 'ML-KEM-768', tests: [{ sk: 'cc', ct: 'dd', ss: '00' }] },
      { parameterSet: 'ML-KEM-1024', tests: [{ sk: 'ee', ct: 'ff', ss: '00' }] },
    ],
  },
}))

vi.mock('../data/acvp/mldsa_test.json', () => ({
  default: {
    testGroups: [
      { parameterSet: 'ML-DSA-44', tests: [{ pk: 'aa', msg: 'bb', sig: 'cc' }] },
      { parameterSet: 'ML-DSA-65', tests: [{ pk: 'dd', msg: 'ee', sig: 'ff' }] },
      { parameterSet: 'ML-DSA-87', tests: [{ pk: '11', msg: '22', sig: '33' }] },
    ],
  },
}))

vi.mock('../data/acvp/aesgcm_test.json', () => ({
  default: {
    testGroups: [
      {
        keyLen: 256,
        ivLen: 96,
        tagLen: 128,
        direction: 'decrypt',
        tests: [{ key: 'aabb', iv: 'cc', pt: '00', ct: 'dd', tag: 'ee' }],
      },
    ],
  },
}))

vi.mock('../data/acvp/aescbc_test.json', () => ({
  default: {
    testGroups: [
      {
        keyLen: 256,
        ivLen: 128,
        direction: 'decrypt',
        tests: [{ key: 'aabb', iv: 'cc', pt: '00', ct: 'dd' }],
      },
    ],
  },
}))

vi.mock('../data/acvp/aesctr_test.json', () => ({
  default: {
    testGroups: [
      {
        keyLen: 256,
        counterBits: 128,
        tests: [{ key: 'aabb', iv: 'cc', pt: '00', ct: 'dd' }],
      },
    ],
  },
}))

vi.mock('../data/acvp/aeskw_test.json', () => ({
  default: {
    testGroups: [
      {
        keyLen: 256,
        tests: [{ kek: 'aabb', keyData: 'ccdd', wrapped: '0000' }],
      },
    ],
  },
}))

vi.mock('../data/acvp/hmac_test.json', () => ({
  default: {
    testGroups: [{ macLen: 256, tests: [{ key: 'aa', msg: 'bb', mac: 'cc' }] }],
  },
}))

vi.mock('../data/acvp/hmac_sha384_test.json', () => ({
  default: {
    testGroups: [{ macLen: 384, tests: [{ key: 'aa', msg: 'bb', mac: 'cc' }] }],
  },
}))

vi.mock('../data/acvp/hmac_sha512_test.json', () => ({
  default: {
    testGroups: [{ macLen: 512, tests: [{ key: 'aa', msg: 'bb', mac: 'cc' }] }],
  },
}))

vi.mock('../data/acvp/sha256_test.json', () => ({
  default: {
    testGroups: [{ tgId: 1, testType: 'AFT', tests: [{ tcId: 1, msg: '', md: '00' }] }],
  },
}))

vi.mock('../data/acvp/ecdsa_test.json', () => ({
  default: {
    testGroups: [
      {
        curve: 'P-256',
        hashAlg: 'SHA-256',
        tests: [
          {
            qx: 'aa',
            qy: 'bb',
            msg: 'ACVP ECDSA P-256 SigVer test vector',
            r: 'cc',
            s: 'dd',
            testPassed: true,
          },
        ],
      },
    ],
  },
}))

vi.mock('../data/acvp/ecdsa_p384_test.json', () => ({
  default: {
    testGroups: [
      {
        curve: 'P-384',
        hashAlg: 'SHA-384',
        tests: [
          {
            qx: 'aa',
            qy: 'bb',
            msg: 'ECDSA P-384 ACVP SigVer test',
            r: 'cc',
            s: 'dd',
            testPassed: true,
          },
        ],
      },
    ],
  },
}))

vi.mock('../data/acvp/eddsa_test.json', () => ({
  default: {
    testGroups: [
      {
        curve: 'Ed25519',
        tests: [
          {
            pk: 'aa',
            msg: '4142',
            signature: 'bb',
            testPassed: true,
          },
        ],
      },
    ],
  },
}))

vi.mock('../data/acvp/wycheproof_rsa_pss_2048_sha256_mgf1_32_test.json', () => ({
  default: {
    testGroups: [
      {
        keySize: 2048,
        sha: 'SHA-256',
        mgf: 'MGF1',
        mgfSha: 'SHA-256',
        sLen: 32,
        publicKey: { modulus: '00aabb', publicExponent: '010001' },
        tests: [
          { tcId: 1, comment: 'valid signature', msg: '', sig: 'dd', result: 'valid' },
          { tcId: 2, comment: 'modified signature', msg: '00', sig: 'ee', result: 'invalid' },
        ],
      },
    ],
  },
}))

// hexToBytes: return zero-filled Uint8Array of length hex.length/2 (value = 0 per byte)
vi.mock('./dataInputUtils', () => ({
  hexToBytes: (hex: string) => new Uint8Array(Math.max(1, hex.length / 2)),
}))

// ── Module under test (imported after mocks) ──────────────────────────────────

import { runKAT, requiredMechanisms, summarizeKatResults, RFC8554_TEST_CASES } from './katRunner'
import type { KatTestSpec } from './katRunner'
import * as softhsm from '../wasm/softhsm'

// ── Helpers ───────────────────────────────────────────────────────────────────

// The WASM module object is passed to mocked functions; its value is irrelevant.
const FAKE_MODULE = {} as unknown as SoftHSMModule
const FAKE_SESSION = 1

function spec(kind: KatTestSpec['kind'], overrides: Partial<KatTestSpec> = {}): KatTestSpec {
  return {
    id: 'test-id',
    useCase: 'Test use case',
    standard: 'Test Standard',
    referenceUrl: 'https://example.com/ref',
    kind,
    ...overrides,
  }
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('runKAT', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Default return values — each test overrides as needed

    // ML-KEM
    vi.mocked(softhsm.hsm_importMLKEMPrivateKey).mockReturnValue(1)
    vi.mocked(softhsm.hsm_decapsulate).mockReturnValue(2)
    // Default extractKeyValue: zero-filled 1-byte array → matches mocked ss '00' → pass
    vi.mocked(softhsm.hsm_extractKeyValue).mockReturnValue(new Uint8Array(1))
    vi.mocked(softhsm.hsm_generateMLKEMKeyPair).mockReturnValue({ pubHandle: 1, privHandle: 2 })
    vi.mocked(softhsm.hsm_encapsulate).mockReturnValue({
      ciphertextBytes: new Uint8Array(10),
      secretHandle: 3,
    })

    // ML-DSA
    vi.mocked(softhsm.hsm_importMLDSAPublicKey).mockReturnValue(4)
    vi.mocked(softhsm.hsm_verifyBytes).mockReturnValue(true)
    vi.mocked(softhsm.hsm_generateMLDSAKeyPair).mockReturnValue({ pubHandle: 5, privHandle: 6 })
    vi.mocked(softhsm.hsm_sign).mockReturnValue(new Uint8Array(10))
    vi.mocked(softhsm.hsm_verify).mockReturnValue(true)

    // SLH-DSA
    vi.mocked(softhsm.hsm_generateSLHDSAKeyPair).mockReturnValue({
      pubHandle: 7,
      privHandle: 8,
    })
    vi.mocked(softhsm.hsm_slhdsaSign).mockReturnValue(new Uint8Array(7856))
    vi.mocked(softhsm.hsm_slhdsaVerify).mockReturnValue(true)

    // AES
    vi.mocked(softhsm.hsm_importAESKey).mockReturnValue(10)
    vi.mocked(softhsm.hsm_aesDecrypt).mockReturnValue(new Uint8Array(1)) // matches hexToBytes('00')
    vi.mocked(softhsm.hsm_aesCtrEncrypt).mockReturnValue(new Uint8Array(1)) // matches hexToBytes('dd')
    vi.mocked(softhsm.hsm_aesCtrDecrypt).mockReturnValue(new Uint8Array(1)) // matches hexToBytes('00')
    vi.mocked(softhsm.hsm_aesWrapKey).mockReturnValue(new Uint8Array(1)) // matches hexToBytes('0000')
    vi.mocked(softhsm.hsm_generateAESKey).mockReturnValue(11)
    vi.mocked(softhsm.hsm_aesEncrypt).mockReturnValue({
      ciphertext: new Uint8Array(10),
      iv: new Uint8Array(12),
    })

    // HMAC / Hash
    vi.mocked(softhsm.hsm_importHMACKey).mockReturnValue(12)
    vi.mocked(softhsm.hsm_hmacVerify).mockReturnValue(true)
    vi.mocked(softhsm.hsm_hmacVerifyGeneral).mockReturnValue(true)
    vi.mocked(softhsm.hsm_digest).mockReturnValue(new Uint8Array(1)) // matches hexToBytes('00')

    // ECDSA
    vi.mocked(softhsm.hsm_importECPublicKey).mockReturnValue(13)
    vi.mocked(softhsm.hsm_ecdsaVerify).mockReturnValue(true)
    vi.mocked(softhsm.hsm_generateECKeyPair).mockReturnValue({ pubHandle: 14, privHandle: 15 })
    vi.mocked(softhsm.hsm_ecdsaSign).mockReturnValue(new Uint8Array(64))

    // EdDSA
    vi.mocked(softhsm.hsm_importEdDSAPublicKey).mockReturnValue(16)
    vi.mocked(softhsm.hsm_eddsaVerify).mockReturnValue(true)
    vi.mocked(softhsm.hsm_generateEdDSAKeyPair).mockReturnValue({ pubHandle: 17, privHandle: 18 })
    vi.mocked(softhsm.hsm_eddsaSign).mockReturnValue(new Uint8Array(64))

    // RSA
    vi.mocked(softhsm.hsm_importRSAPublicKey).mockReturnValue(19)
    vi.mocked(softhsm.hsm_rsaVerify).mockReturnValue(true)
    vi.mocked(softhsm.hsm_generateRSAKeyPair).mockReturnValue({ pubHandle: 20, privHandle: 21 })
    vi.mocked(softhsm.hsm_rsaSign).mockReturnValue(new Uint8Array(256))
  })

  // ── mlkem-decap ─────────────────────────────────────────────────────────────

  describe('mlkem-decap', () => {
    it('returns pass when shared secret matches NIST vector', async () => {
      // hexToBytes('00') returns Uint8Array(1) = [0]
      // extractKeyValue returns Uint8Array(1) = [0] → byte-for-byte match
      vi.mocked(softhsm.hsm_extractKeyValue).mockReturnValue(new Uint8Array(1))
      const result = await runKAT(
        FAKE_MODULE,
        FAKE_SESSION,
        spec({ type: 'mlkem-decap', variant: 768 })
      )
      expect(result.status).toBe('pass')
      expect(result.details).toContain('shared secret matches ACVP expected value')
    })

    it('returns fail when shared secret does not match', async () => {
      // extractKeyValue returns [1]; expectedSs = hexToBytes('00') = [0] → mismatch
      vi.mocked(softhsm.hsm_extractKeyValue).mockReturnValue(new Uint8Array([1]))
      const result = await runKAT(
        FAKE_MODULE,
        FAKE_SESSION,
        spec({ type: 'mlkem-decap', variant: 512 })
      )
      expect(result.status).toBe('fail')
      expect(result.details).toContain('mismatch')
    })

    it('uses ML-KEM-512 variant when specified', async () => {
      const result = await runKAT(
        FAKE_MODULE,
        FAKE_SESSION,
        spec({ type: 'mlkem-decap', variant: 512 })
      )
      expect(result.algorithm).toBe('ML-KEM-512')
    })

    it('uses ML-KEM-768 variant when specified', async () => {
      const result = await runKAT(
        FAKE_MODULE,
        FAKE_SESSION,
        spec({ type: 'mlkem-decap', variant: 768 })
      )
      expect(result.algorithm).toBe('ML-KEM-768')
    })

    it('uses ML-KEM-1024 variant when specified', async () => {
      const result = await runKAT(
        FAKE_MODULE,
        FAKE_SESSION,
        spec({ type: 'mlkem-decap', variant: 1024 })
      )
      expect(result.algorithm).toBe('ML-KEM-1024')
    })

    it('propagates referenceUrl to result on pass', async () => {
      const result = await runKAT(
        FAKE_MODULE,
        FAKE_SESSION,
        spec({ type: 'mlkem-decap', variant: 768 }, { referenceUrl: 'https://nist.gov/kem' })
      )
      expect(result.referenceUrl).toBe('https://nist.gov/kem')
    })

    it('propagates id, useCase, standard to result', async () => {
      const s = spec(
        { type: 'mlkem-decap', variant: 768 },
        { id: 'my-id', useCase: 'My use case', standard: 'FIPS 203' }
      )
      const result = await runKAT(FAKE_MODULE, FAKE_SESSION, s)
      expect(result.id).toBe('my-id')
      expect(result.useCase).toBe('My use case')
      expect(result.standard).toBe('FIPS 203')
    })
  })

  // ── mlkem-encap-roundtrip ────────────────────────────────────────────────────

  describe('mlkem-encap-roundtrip', () => {
    it('returns pass when encap and decap shared secrets match', async () => {
      // Both extractKeyValue calls return same bytes → match
      vi.mocked(softhsm.hsm_extractKeyValue).mockReturnValue(new Uint8Array([5, 6]))
      const result = await runKAT(
        FAKE_MODULE,
        FAKE_SESSION,
        spec({ type: 'mlkem-encap-roundtrip', variant: 768 })
      )
      expect(result.status).toBe('pass')
      expect(result.details).toContain('both shared secrets match')
    })

    it('returns fail when encap and decap shared secrets differ', async () => {
      vi.mocked(softhsm.hsm_extractKeyValue)
        .mockReturnValueOnce(new Uint8Array([1]))
        .mockReturnValueOnce(new Uint8Array([2]))
      const result = await runKAT(
        FAKE_MODULE,
        FAKE_SESSION,
        spec({ type: 'mlkem-encap-roundtrip', variant: 512 })
      )
      expect(result.status).toBe('fail')
    })

    it('sets correct algorithm name', async () => {
      const result = await runKAT(
        FAKE_MODULE,
        FAKE_SESSION,
        spec({ type: 'mlkem-encap-roundtrip', variant: 1024 })
      )
      expect(result.algorithm).toBe('ML-KEM-1024')
    })
  })

  // ── mldsa-sigver ─────────────────────────────────────────────────────────────

  describe('mldsa-sigver', () => {
    it('returns pass when NIST signature verifies', async () => {
      vi.mocked(softhsm.hsm_verifyBytes).mockReturnValue(true)
      const result = await runKAT(
        FAKE_MODULE,
        FAKE_SESSION,
        spec({ type: 'mldsa-sigver', variant: 65 })
      )
      expect(result.status).toBe('pass')
      expect(result.details).toContain('verified ACVP reference signature')
    })

    it('returns fail when signature verification fails', async () => {
      vi.mocked(softhsm.hsm_verifyBytes).mockReturnValue(false)
      const result = await runKAT(
        FAKE_MODULE,
        FAKE_SESSION,
        spec({ type: 'mldsa-sigver', variant: 44 })
      )
      expect(result.status).toBe('fail')
    })

    it('uses ML-DSA-44 variant', async () => {
      const result = await runKAT(
        FAKE_MODULE,
        FAKE_SESSION,
        spec({ type: 'mldsa-sigver', variant: 44 })
      )
      expect(result.algorithm).toBe('ML-DSA-44')
    })

    it('uses ML-DSA-65 variant', async () => {
      const result = await runKAT(
        FAKE_MODULE,
        FAKE_SESSION,
        spec({ type: 'mldsa-sigver', variant: 65 })
      )
      expect(result.algorithm).toBe('ML-DSA-65')
    })

    it('uses ML-DSA-87 variant', async () => {
      const result = await runKAT(
        FAKE_MODULE,
        FAKE_SESSION,
        spec({ type: 'mldsa-sigver', variant: 87 })
      )
      expect(result.algorithm).toBe('ML-DSA-87')
    })

    it('propagates referenceUrl', async () => {
      const result = await runKAT(
        FAKE_MODULE,
        FAKE_SESSION,
        spec({ type: 'mldsa-sigver', variant: 65 }, { referenceUrl: 'https://nist.gov/dsa' })
      )
      expect(result.referenceUrl).toBe('https://nist.gov/dsa')
    })
  })

  // ── mldsa-functional ─────────────────────────────────────────────────────────

  describe('mldsa-functional', () => {
    it('returns pass when sign+verify round-trip succeeds', async () => {
      vi.mocked(softhsm.hsm_verify).mockReturnValue(true)
      const result = await runKAT(
        FAKE_MODULE,
        FAKE_SESSION,
        spec({ type: 'mldsa-functional', variant: 65 })
      )
      expect(result.status).toBe('pass')
      expect(result.details).toContain('signature verified successfully')
    })

    it('returns fail when round-trip verification fails', async () => {
      vi.mocked(softhsm.hsm_verify).mockReturnValue(false)
      const result = await runKAT(
        FAKE_MODULE,
        FAKE_SESSION,
        spec({ type: 'mldsa-functional', variant: 44 })
      )
      expect(result.status).toBe('fail')
    })

    it('sets correct algorithm name', async () => {
      const result = await runKAT(
        FAKE_MODULE,
        FAKE_SESSION,
        spec({ type: 'mldsa-functional', variant: 87 })
      )
      expect(result.algorithm).toBe('ML-DSA-87')
    })
  })

  // ── slhdsa-functional ────────────────────────────────────────────────────────

  describe('slhdsa-functional', () => {
    it('returns pass when sign+verify round-trip succeeds', async () => {
      vi.mocked(softhsm.hsm_slhdsaVerify).mockReturnValue(true)
      const result = await runKAT(
        FAKE_MODULE,
        FAKE_SESSION,
        spec({ type: 'slhdsa-functional', variant: 'SHA2-128s' })
      )
      expect(result.status).toBe('pass')
    })

    it('returns fail when round-trip verification fails', async () => {
      vi.mocked(softhsm.hsm_slhdsaVerify).mockReturnValue(false)
      const result = await runKAT(
        FAKE_MODULE,
        FAKE_SESSION,
        spec({ type: 'slhdsa-functional', variant: 'SHAKE-256f' })
      )
      expect(result.status).toBe('fail')
    })

    it('sets correct algorithm name for SHA2-128s', async () => {
      const result = await runKAT(
        FAKE_MODULE,
        FAKE_SESSION,
        spec({ type: 'slhdsa-functional', variant: 'SHA2-128s' })
      )
      expect(result.algorithm).toBe('SLH-DSA-SHA2-128s')
    })

    it('sets correct algorithm name for SHAKE-256f', async () => {
      const result = await runKAT(
        FAKE_MODULE,
        FAKE_SESSION,
        spec({ type: 'slhdsa-functional', variant: 'SHAKE-256f' })
      )
      expect(result.algorithm).toBe('SLH-DSA-SHAKE-256f')
    })

    it('passes CKP constant to generateSLHDSAKeyPair', async () => {
      await runKAT(
        FAKE_MODULE,
        FAKE_SESSION,
        spec({ type: 'slhdsa-functional', variant: 'SHA2-128s' })
      )
      expect(softhsm.hsm_generateSLHDSAKeyPair).toHaveBeenCalledWith(
        FAKE_MODULE,
        FAKE_SESSION,
        0x01 // CKP_SLH_DSA_SHA2_128S
      )
    })

    it('returns error when keygen throws', async () => {
      vi.mocked(softhsm.hsm_generateSLHDSAKeyPair).mockImplementation(() => {
        throw new Error('SLH-DSA keygen crash')
      })
      const result = await runKAT(
        FAKE_MODULE,
        FAKE_SESSION,
        spec({ type: 'slhdsa-functional', variant: 'SHA2-192s' })
      )
      expect(result.status).toBe('error')
      expect(result.details).toContain('SLH-DSA keygen crash')
    })
  })

  // ── aesgcm-decrypt ──────────────────────────────────────────────────────────

  describe('aesgcm-decrypt', () => {
    it('returns pass when decrypted plaintext matches the published GCM example', async () => {
      // hexToBytes('00') → Uint8Array(1) = [0]; aesDecrypt returns Uint8Array(1) = [0] → match
      vi.mocked(softhsm.hsm_aesDecrypt).mockReturnValue(new Uint8Array(1))
      const result = await runKAT(FAKE_MODULE, FAKE_SESSION, spec({ type: 'aesgcm-decrypt' }))
      expect(result.status).toBe('pass')
      expect(result.details).toContain("plaintext matches NIST's expected value")
    })

    it('returns fail when decrypted plaintext does not match', async () => {
      vi.mocked(softhsm.hsm_aesDecrypt).mockReturnValue(new Uint8Array([0xff]))
      const result = await runKAT(FAKE_MODULE, FAKE_SESSION, spec({ type: 'aesgcm-decrypt' }))
      expect(result.status).toBe('fail')
      expect(result.details).toContain('mismatch')
    })

    it('returns error when hsm_importAESKey throws', async () => {
      vi.mocked(softhsm.hsm_importAESKey).mockImplementation(() => {
        throw new Error('AES-GCM import crash')
      })
      const result = await runKAT(FAKE_MODULE, FAKE_SESSION, spec({ type: 'aesgcm-decrypt' }))
      expect(result.status).toBe('error')
      expect(result.details).toContain('AES-GCM import crash')
    })

    it('sets algorithm to AES-256-GCM', async () => {
      const result = await runKAT(FAKE_MODULE, FAKE_SESSION, spec({ type: 'aesgcm-decrypt' }))
      expect(result.algorithm).toBe('AES-256-GCM')
    })
  })

  // ── aescbc-decrypt ──────────────────────────────────────────────────────────

  describe('aescbc-decrypt', () => {
    it('returns pass when decrypted plaintext matches ACVP vector', async () => {
      vi.mocked(softhsm.hsm_aesDecrypt).mockReturnValue(new Uint8Array(1))
      const result = await runKAT(FAKE_MODULE, FAKE_SESSION, spec({ type: 'aescbc-decrypt' }))
      expect(result.status).toBe('pass')
      expect(result.details).toContain('plaintext matches expected value')
    })

    it('returns fail when decrypted plaintext does not match', async () => {
      vi.mocked(softhsm.hsm_aesDecrypt).mockReturnValue(new Uint8Array([0xff]))
      const result = await runKAT(FAKE_MODULE, FAKE_SESSION, spec({ type: 'aescbc-decrypt' }))
      expect(result.status).toBe('fail')
      expect(result.details).toContain('mismatch')
    })

    it('returns error when hsm_aesDecrypt throws', async () => {
      vi.mocked(softhsm.hsm_aesDecrypt).mockImplementation(() => {
        throw new Error('AES-CBC decrypt crash')
      })
      const result = await runKAT(FAKE_MODULE, FAKE_SESSION, spec({ type: 'aescbc-decrypt' }))
      expect(result.status).toBe('error')
      expect(result.details).toContain('AES-CBC decrypt crash')
    })

    // 2026-09-24: the NIST ACVP-AES-CBC sample is unpadded; 'cbc' (CKM_AES_CBC_PAD)
    // made both engines reject it. The runner must ask for raw CKM_AES_CBC.
    it("decrypts with raw CKM_AES_CBC ('cbc-raw'), not CBC_PAD", async () => {
      vi.mocked(softhsm.hsm_aesDecrypt).mockReturnValue(new Uint8Array(1))
      await runKAT(FAKE_MODULE, FAKE_SESSION, spec({ type: 'aescbc-decrypt' }))
      expect(vi.mocked(softhsm.hsm_aesDecrypt).mock.lastCall?.[5]).toBe('cbc-raw')
    })

    it('sets algorithm to AES-256-CBC', async () => {
      const result = await runKAT(FAKE_MODULE, FAKE_SESSION, spec({ type: 'aescbc-decrypt' }))
      expect(result.algorithm).toBe('AES-256-CBC')
    })
  })

  // ── aesctr-roundtrip ────────────────────────────────────────────────────────

  describe('aesctr-roundtrip', () => {
    it('returns pass when encrypt+decrypt round-trip matches', async () => {
      // hexToBytes('dd') → Uint8Array(1) = [0]; aesCtrEncrypt returns Uint8Array(1) = [0] → ct matches
      // hexToBytes('00') → Uint8Array(1) = [0]; aesCtrDecrypt returns Uint8Array(1) = [0] → pt matches
      vi.mocked(softhsm.hsm_aesCtrEncrypt).mockReturnValue(new Uint8Array(1))
      vi.mocked(softhsm.hsm_aesCtrDecrypt).mockReturnValue(new Uint8Array(1))
      const result = await runKAT(FAKE_MODULE, FAKE_SESSION, spec({ type: 'aesctr-roundtrip' }))
      expect(result.status).toBe('pass')
      expect(result.details).toContain('decrypted back to the original')
    })

    it('returns fail when ciphertext does not match expected', async () => {
      vi.mocked(softhsm.hsm_aesCtrEncrypt).mockReturnValue(new Uint8Array([0xff]))
      const result = await runKAT(FAKE_MODULE, FAKE_SESSION, spec({ type: 'aesctr-roundtrip' }))
      expect(result.status).toBe('fail')
      expect(result.details).toContain('mismatch')
    })

    it('returns fail when decrypt does not recover original plaintext', async () => {
      // CT matches but decrypted PT does not
      vi.mocked(softhsm.hsm_aesCtrEncrypt).mockReturnValue(new Uint8Array(1))
      vi.mocked(softhsm.hsm_aesCtrDecrypt).mockReturnValue(new Uint8Array([0xff]))
      const result = await runKAT(FAKE_MODULE, FAKE_SESSION, spec({ type: 'aesctr-roundtrip' }))
      expect(result.status).toBe('fail')
      expect(result.details).toContain('mismatch')
    })

    it('returns error when hsm_aesCtrEncrypt throws', async () => {
      vi.mocked(softhsm.hsm_aesCtrEncrypt).mockImplementation(() => {
        throw new Error('CTR encrypt crash')
      })
      const result = await runKAT(FAKE_MODULE, FAKE_SESSION, spec({ type: 'aesctr-roundtrip' }))
      expect(result.status).toBe('error')
      expect(result.details).toContain('CTR encrypt crash')
    })

    it('sets algorithm to AES-256-CTR', async () => {
      const result = await runKAT(FAKE_MODULE, FAKE_SESSION, spec({ type: 'aesctr-roundtrip' }))
      expect(result.algorithm).toBe('AES-256-CTR')
    })
  })

  // ── aeskw-wrap ──────────────────────────────────────────────────────────────

  describe('aeskw-wrap', () => {
    it('returns pass when wrapped output matches the RFC 3394 example', async () => {
      // hexToBytes('0000') → Uint8Array(2) = [0,0]; aesWrapKey returns Uint8Array(2) = [0,0] → match
      vi.mocked(softhsm.hsm_aesWrapKey).mockReturnValue(new Uint8Array(2))
      const result = await runKAT(FAKE_MODULE, FAKE_SESSION, spec({ type: 'aeskw-wrap' }))
      expect(result.status).toBe('pass')
      expect(result.details).toContain("output matches the RFC's expected value")
    })

    it('returns fail when wrapped output does not match', async () => {
      vi.mocked(softhsm.hsm_aesWrapKey).mockReturnValue(new Uint8Array([0xff]))
      const result = await runKAT(FAKE_MODULE, FAKE_SESSION, spec({ type: 'aeskw-wrap' }))
      expect(result.status).toBe('fail')
      expect(result.details).toContain('mismatch')
    })

    it('returns error when hsm_aesWrapKey throws', async () => {
      vi.mocked(softhsm.hsm_aesWrapKey).mockImplementation(() => {
        throw new Error('AES-KW wrap crash')
      })
      const result = await runKAT(FAKE_MODULE, FAKE_SESSION, spec({ type: 'aeskw-wrap' }))
      expect(result.status).toBe('error')
      expect(result.details).toContain('AES-KW wrap crash')
    })

    it('sets algorithm to AES-256-KW', async () => {
      const result = await runKAT(FAKE_MODULE, FAKE_SESSION, spec({ type: 'aeskw-wrap' }))
      expect(result.algorithm).toBe('AES-256-KW')
    })
  })

  // ── aesgcm-functional ───────────────────────────────────────────────────────

  describe('aesgcm-functional', () => {
    it('returns pass when encrypt+decrypt round-trip succeeds', async () => {
      // aesEncrypt returns {ciphertext, iv}; aesDecrypt must return bytes matching original pt
      // The original pt is TextEncoder.encode(message) which produces ASCII bytes
      // We need aesDecrypt to return the same bytes as the pt
      const ptBytes = new TextEncoder().encode(
        'NIST KAT validation — AES-256-GCM functional round-trip'
      )
      vi.mocked(softhsm.hsm_aesEncrypt).mockReturnValue({
        ciphertext: new Uint8Array(ptBytes.length + 16),
        iv: new Uint8Array(12),
      })
      vi.mocked(softhsm.hsm_aesDecrypt).mockReturnValue(new Uint8Array(ptBytes))
      const result = await runKAT(FAKE_MODULE, FAKE_SESSION, spec({ type: 'aesgcm-functional' }))
      expect(result.status).toBe('pass')
      expect(result.details).toContain('plaintext matches original')
    })

    it('returns fail when round-trip plaintext does not match', async () => {
      vi.mocked(softhsm.hsm_aesEncrypt).mockReturnValue({
        ciphertext: new Uint8Array(20),
        iv: new Uint8Array(12),
      })
      vi.mocked(softhsm.hsm_aesDecrypt).mockReturnValue(new Uint8Array([0xff]))
      const result = await runKAT(FAKE_MODULE, FAKE_SESSION, spec({ type: 'aesgcm-functional' }))
      expect(result.status).toBe('fail')
      expect(result.details).toContain('round-trip failed')
    })

    it('returns error when hsm_generateAESKey throws', async () => {
      vi.mocked(softhsm.hsm_generateAESKey).mockImplementation(() => {
        throw new Error('AES keygen crash')
      })
      const result = await runKAT(FAKE_MODULE, FAKE_SESSION, spec({ type: 'aesgcm-functional' }))
      expect(result.status).toBe('error')
      expect(result.details).toContain('AES keygen crash')
    })

    it('sets algorithm to AES-256-GCM', async () => {
      const ptBytes = new TextEncoder().encode(
        'NIST KAT validation — AES-256-GCM functional round-trip'
      )
      vi.mocked(softhsm.hsm_aesDecrypt).mockReturnValue(new Uint8Array(ptBytes))
      const result = await runKAT(FAKE_MODULE, FAKE_SESSION, spec({ type: 'aesgcm-functional' }))
      expect(result.algorithm).toBe('AES-256-GCM')
    })
  })

  // ── hmac-verify ─────────────────────────────────────────────────────────────

  describe('hmac-verify', () => {
    it('returns pass when HMAC-SHA-256 verifies', async () => {
      vi.mocked(softhsm.hsm_hmacVerifyGeneral).mockReturnValue(true)
      const result = await runKAT(
        FAKE_MODULE,
        FAKE_SESSION,
        spec({ type: 'hmac-verify', hashAlg: 'SHA-256' })
      )
      expect(result.status).toBe('pass')
      expect(result.details).toContain("accepts the ACVP sample's truncated MAC")
    })

    // 2026-09-24: the NIST ACVP-HMAC samples carry a truncated MAC, which only
    // the _GENERAL mechanism can verify. The plain CKM_SHA*_HMAC path failed on
    // both engines; this pins the mechanism the runner hands to the engine.
    it.each([
      ['SHA-256', 0x252],
      ['SHA-384', 0x262],
      ['SHA-512', 0x272],
    ] as const)('verifies %s with the truncating _GENERAL mechanism', async (hashAlg, mech) => {
      vi.mocked(softhsm.hsm_hmacVerifyGeneral).mockReturnValue(true)
      await runKAT(FAKE_MODULE, FAKE_SESSION, spec({ type: 'hmac-verify', hashAlg }))
      expect(vi.mocked(softhsm.hsm_hmacVerifyGeneral).mock.lastCall?.[5]).toBe(mech)
      expect(softhsm.hsm_hmacVerify).not.toHaveBeenCalled()
    })

    it('returns fail when HMAC verification fails', async () => {
      vi.mocked(softhsm.hsm_hmacVerifyGeneral).mockReturnValue(false)
      const result = await runKAT(
        FAKE_MODULE,
        FAKE_SESSION,
        spec({ type: 'hmac-verify', hashAlg: 'SHA-256' })
      )
      expect(result.status).toBe('fail')
      expect(result.details).toContain('verification rejected')
    })

    it('returns error when hsm_importHMACKey throws', async () => {
      vi.mocked(softhsm.hsm_importHMACKey).mockImplementation(() => {
        throw new Error('HMAC import crash')
      })
      const result = await runKAT(
        FAKE_MODULE,
        FAKE_SESSION,
        spec({ type: 'hmac-verify', hashAlg: 'SHA-256' })
      )
      expect(result.status).toBe('error')
      expect(result.details).toContain('HMAC import crash')
    })

    it('sets algorithm to HMAC-SHA-256', async () => {
      const result = await runKAT(
        FAKE_MODULE,
        FAKE_SESSION,
        spec({ type: 'hmac-verify', hashAlg: 'SHA-256' })
      )
      expect(result.algorithm).toBe('HMAC-SHA-256')
    })

    it('sets algorithm to HMAC-SHA-384 for SHA-384 variant', async () => {
      const result = await runKAT(
        FAKE_MODULE,
        FAKE_SESSION,
        spec({ type: 'hmac-verify', hashAlg: 'SHA-384' })
      )
      expect(result.algorithm).toBe('HMAC-SHA-384')
    })

    it('sets algorithm to HMAC-SHA-512 for SHA-512 variant', async () => {
      const result = await runKAT(
        FAKE_MODULE,
        FAKE_SESSION,
        spec({ type: 'hmac-verify', hashAlg: 'SHA-512' })
      )
      expect(result.algorithm).toBe('HMAC-SHA-512')
    })
  })

  // ── sha256-hash ─────────────────────────────────────────────────────────────

  describe('sha256-hash', () => {
    it('returns pass when digest matches ACVP vector', async () => {
      // hexToBytes('00') → Uint8Array(1) = [0]; digest returns Uint8Array(1) = [0] → match
      vi.mocked(softhsm.hsm_digest).mockReturnValue(new Uint8Array(1))
      const result = await runKAT(FAKE_MODULE, FAKE_SESSION, spec({ type: 'sha256-hash' }))
      expect(result.status).toBe('pass')
      expect(result.details).toContain('digest matches ACVP expected value')
    })

    it('returns fail when digest does not match', async () => {
      vi.mocked(softhsm.hsm_digest).mockReturnValue(new Uint8Array([0xff]))
      const result = await runKAT(FAKE_MODULE, FAKE_SESSION, spec({ type: 'sha256-hash' }))
      expect(result.status).toBe('fail')
      expect(result.details).toContain('mismatch')
    })

    it('returns error when hsm_digest throws', async () => {
      vi.mocked(softhsm.hsm_digest).mockImplementation(() => {
        throw new Error('SHA-256 digest crash')
      })
      const result = await runKAT(FAKE_MODULE, FAKE_SESSION, spec({ type: 'sha256-hash' }))
      expect(result.status).toBe('error')
      expect(result.details).toContain('SHA-256 digest crash')
    })

    it('sets algorithm to SHA-256', async () => {
      const result = await runKAT(FAKE_MODULE, FAKE_SESSION, spec({ type: 'sha256-hash' }))
      expect(result.algorithm).toBe('SHA-256')
    })
  })

  // ── ecdsa-sigver ────────────────────────────────────────────────────────────

  describe('ecdsa-sigver', () => {
    it('returns pass when P-256 signature verifies', async () => {
      vi.mocked(softhsm.hsm_ecdsaVerify).mockReturnValue(true)
      const result = await runKAT(
        FAKE_MODULE,
        FAKE_SESSION,
        spec({ type: 'ecdsa-sigver', curve: 'P-256' })
      )
      expect(result.status).toBe('pass')
      expect(result.details).toContain('verified its published signature')
    })

    it('returns fail when P-256 signature verification fails', async () => {
      vi.mocked(softhsm.hsm_ecdsaVerify).mockReturnValue(false)
      const result = await runKAT(
        FAKE_MODULE,
        FAKE_SESSION,
        spec({ type: 'ecdsa-sigver', curve: 'P-256' })
      )
      expect(result.status).toBe('fail')
      expect(result.details).toContain('verification failed')
    })

    it('returns error when hsm_importECPublicKey throws', async () => {
      vi.mocked(softhsm.hsm_importECPublicKey).mockImplementation(() => {
        throw new Error('EC import crash')
      })
      const result = await runKAT(
        FAKE_MODULE,
        FAKE_SESSION,
        spec({ type: 'ecdsa-sigver', curve: 'P-256' })
      )
      expect(result.status).toBe('error')
      expect(result.details).toContain('EC import crash')
    })

    it('sets algorithm to ECDSA-P-256', async () => {
      const result = await runKAT(
        FAKE_MODULE,
        FAKE_SESSION,
        spec({ type: 'ecdsa-sigver', curve: 'P-256' })
      )
      expect(result.algorithm).toBe('ECDSA-P-256')
    })

    it('sets algorithm to ECDSA-P-384 for P-384 variant', async () => {
      const result = await runKAT(
        FAKE_MODULE,
        FAKE_SESSION,
        spec({ type: 'ecdsa-sigver', curve: 'P-384' })
      )
      expect(result.algorithm).toBe('ECDSA-P-384')
    })
  })

  // ── eddsa-sigver ────────────────────────────────────────────────────────────

  describe('eddsa-sigver', () => {
    it('returns pass when Ed25519 signature verifies', async () => {
      vi.mocked(softhsm.hsm_eddsaVerify).mockReturnValue(true)
      const result = await runKAT(FAKE_MODULE, FAKE_SESSION, spec({ type: 'eddsa-sigver' }))
      expect(result.status).toBe('pass')
      expect(result.details).toContain('verified its published Ed25519 signature')
    })

    it('returns fail when Ed25519 signature verification fails', async () => {
      vi.mocked(softhsm.hsm_eddsaVerify).mockReturnValue(false)
      const result = await runKAT(FAKE_MODULE, FAKE_SESSION, spec({ type: 'eddsa-sigver' }))
      expect(result.status).toBe('fail')
      expect(result.details).toContain('verification failed')
    })

    it('returns error when hsm_importEdDSAPublicKey throws', async () => {
      vi.mocked(softhsm.hsm_importEdDSAPublicKey).mockImplementation(() => {
        throw new Error('EdDSA import crash')
      })
      const result = await runKAT(FAKE_MODULE, FAKE_SESSION, spec({ type: 'eddsa-sigver' }))
      expect(result.status).toBe('error')
      expect(result.details).toContain('EdDSA import crash')
    })

    it('sets algorithm to Ed25519', async () => {
      const result = await runKAT(FAKE_MODULE, FAKE_SESSION, spec({ type: 'eddsa-sigver' }))
      expect(result.algorithm).toBe('Ed25519')
    })
  })

  // ── rsapss-sigver ───────────────────────────────────────────────────────────

  describe('rsapss-sigver', () => {
    it('returns pass when the Wycheproof valid case verifies', async () => {
      vi.mocked(softhsm.hsm_rsaVerifyBytes).mockReturnValue(true)
      const result = await runKAT(FAKE_MODULE, FAKE_SESSION, spec({ type: 'rsapss-sigver' }))
      expect(result.status).toBe('pass')
      expect(result.details).toContain('verified the Wycheproof rsa_pss_2048_sha256_mgf1_32 tc1')
    })

    it('returns fail when the Wycheproof valid case does not verify', async () => {
      vi.mocked(softhsm.hsm_rsaVerifyBytes).mockReturnValue(false)
      const result = await runKAT(FAKE_MODULE, FAKE_SESSION, spec({ type: 'rsapss-sigver' }))
      expect(result.status).toBe('fail')
      expect(result.details).toContain('verification failed')
    })

    it('passes an invalid case only when verification refuses it', async () => {
      vi.mocked(softhsm.hsm_rsaVerifyBytes).mockReturnValue(false)
      const refused = await runKAT(
        FAKE_MODULE,
        FAKE_SESSION,
        spec({ type: 'rsapss-sigver', testIndex: 1 })
      )
      expect(refused.status).toBe('pass')
      vi.mocked(softhsm.hsm_rsaVerifyBytes).mockReturnValue(true)
      const accepted = await runKAT(
        FAKE_MODULE,
        FAKE_SESSION,
        spec({ type: 'rsapss-sigver', testIndex: 1 })
      )
      expect(accepted.status).toBe('fail')
      expect(accepted.details).toContain('VERIFIED a signature Wycheproof marks invalid')
    })

    it('drops the ASN.1 sign byte from the Wycheproof modulus', async () => {
      vi.mocked(softhsm.hsm_rsaVerifyBytes).mockReturnValue(true)
      await runKAT(FAKE_MODULE, FAKE_SESSION, spec({ type: 'rsapss-sigver' }))
      const n = vi.mocked(softhsm.hsm_importRSAPublicKey).mock.calls.at(-1)![2] as Uint8Array
      expect(n.length).toBe(2) // '00aabb' -> 'aabb'
    })

    it('returns error when hsm_importRSAPublicKey throws', async () => {
      vi.mocked(softhsm.hsm_importRSAPublicKey).mockImplementation(() => {
        throw new Error('RSA import crash')
      })
      const result = await runKAT(FAKE_MODULE, FAKE_SESSION, spec({ type: 'rsapss-sigver' }))
      expect(result.status).toBe('error')
      expect(result.details).toContain('RSA import crash')
    })

    it('sets algorithm to RSA-2048-PSS', async () => {
      const result = await runKAT(FAKE_MODULE, FAKE_SESSION, spec({ type: 'rsapss-sigver' }))
      expect(result.algorithm).toBe('RSA-2048-PSS')
    })
  })

  // ── ecdsa-functional ────────────────────────────────────────────────────────

  describe('ecdsa-functional', () => {
    it('returns pass when P-256 sign+verify round-trip succeeds', async () => {
      vi.mocked(softhsm.hsm_ecdsaVerify).mockReturnValue(true)
      const result = await runKAT(
        FAKE_MODULE,
        FAKE_SESSION,
        spec({ type: 'ecdsa-functional', curve: 'P-256' })
      )
      expect(result.status).toBe('pass')
      expect(result.details).toContain('signature verified successfully')
    })

    it('returns fail when P-256 round-trip verification fails', async () => {
      vi.mocked(softhsm.hsm_ecdsaVerify).mockReturnValue(false)
      const result = await runKAT(
        FAKE_MODULE,
        FAKE_SESSION,
        spec({ type: 'ecdsa-functional', curve: 'P-256' })
      )
      expect(result.status).toBe('fail')
      expect(result.details).toContain('sign+verify')
    })

    it('returns error when hsm_generateECKeyPair throws', async () => {
      vi.mocked(softhsm.hsm_generateECKeyPair).mockImplementation(() => {
        throw new Error('EC keygen crash')
      })
      const result = await runKAT(
        FAKE_MODULE,
        FAKE_SESSION,
        spec({ type: 'ecdsa-functional', curve: 'P-256' })
      )
      expect(result.status).toBe('error')
      expect(result.details).toContain('EC keygen crash')
    })

    it('sets algorithm to ECDSA-P-256', async () => {
      const result = await runKAT(
        FAKE_MODULE,
        FAKE_SESSION,
        spec({ type: 'ecdsa-functional', curve: 'P-256' })
      )
      expect(result.algorithm).toBe('ECDSA-P-256')
    })

    it('sets algorithm to ECDSA-P-384 for P-384 variant', async () => {
      const result = await runKAT(
        FAKE_MODULE,
        FAKE_SESSION,
        spec({ type: 'ecdsa-functional', curve: 'P-384' })
      )
      expect(result.algorithm).toBe('ECDSA-P-384')
    })
  })

  // ── eddsa-functional ────────────────────────────────────────────────────────

  describe('eddsa-functional', () => {
    it('returns pass when Ed25519 sign+verify round-trip succeeds', async () => {
      vi.mocked(softhsm.hsm_eddsaVerify).mockReturnValue(true)
      const result = await runKAT(FAKE_MODULE, FAKE_SESSION, spec({ type: 'eddsa-functional' }))
      expect(result.status).toBe('pass')
      expect(result.details).toContain('Ed25519 signature verified successfully')
    })

    it('returns fail when Ed25519 round-trip verification fails', async () => {
      vi.mocked(softhsm.hsm_eddsaVerify).mockReturnValue(false)
      const result = await runKAT(FAKE_MODULE, FAKE_SESSION, spec({ type: 'eddsa-functional' }))
      expect(result.status).toBe('fail')
      expect(result.details).toContain('sign+verify')
    })

    it('returns error when hsm_generateEdDSAKeyPair throws', async () => {
      vi.mocked(softhsm.hsm_generateEdDSAKeyPair).mockImplementation(() => {
        throw new Error('EdDSA keygen crash')
      })
      const result = await runKAT(FAKE_MODULE, FAKE_SESSION, spec({ type: 'eddsa-functional' }))
      expect(result.status).toBe('error')
      expect(result.details).toContain('EdDSA keygen crash')
    })

    it('sets algorithm to Ed25519', async () => {
      const result = await runKAT(FAKE_MODULE, FAKE_SESSION, spec({ type: 'eddsa-functional' }))
      expect(result.algorithm).toBe('Ed25519')
    })
  })

  // ── rsa-functional ──────────────────────────────────────────────────────────

  describe('rsa-functional', () => {
    it('returns pass when RSA-PSS sign+verify round-trip succeeds', async () => {
      vi.mocked(softhsm.hsm_rsaVerify).mockReturnValue(true)
      const result = await runKAT(
        FAKE_MODULE,
        FAKE_SESSION,
        spec({ type: 'rsa-functional', bits: 2048 })
      )
      expect(result.status).toBe('pass')
      expect(result.details).toContain('RSA-PSS signature verified successfully')
    })

    it('returns fail when RSA-PSS round-trip verification fails', async () => {
      vi.mocked(softhsm.hsm_rsaVerify).mockReturnValue(false)
      const result = await runKAT(
        FAKE_MODULE,
        FAKE_SESSION,
        spec({ type: 'rsa-functional', bits: 2048 })
      )
      expect(result.status).toBe('fail')
      expect(result.details).toContain('sign+verify')
    })

    it('returns error when hsm_generateRSAKeyPair throws', async () => {
      vi.mocked(softhsm.hsm_generateRSAKeyPair).mockImplementation(() => {
        throw new Error('RSA keygen crash')
      })
      const result = await runKAT(
        FAKE_MODULE,
        FAKE_SESSION,
        spec({ type: 'rsa-functional', bits: 2048 })
      )
      expect(result.status).toBe('error')
      expect(result.details).toContain('RSA keygen crash')
    })

    it('sets algorithm to RSA-2048-PSS', async () => {
      const result = await runKAT(
        FAKE_MODULE,
        FAKE_SESSION,
        spec({ type: 'rsa-functional', bits: 2048 })
      )
      expect(result.algorithm).toBe('RSA-2048-PSS')
    })

    it('sets algorithm to RSA-3072-PSS for 3072-bit variant', async () => {
      const result = await runKAT(
        FAKE_MODULE,
        FAKE_SESSION,
        spec({ type: 'rsa-functional', bits: 3072 })
      )
      expect(result.algorithm).toBe('RSA-3072-PSS')
    })
  })

  // ── Error handling ────────────────────────────────────────────────────────────

  describe('error handling', () => {
    it('returns error status when WASM throws during mlkem-decap', async () => {
      vi.mocked(softhsm.hsm_importMLKEMPrivateKey).mockImplementation(() => {
        throw new Error('WASM abort: boom')
      })
      const result = await runKAT(
        FAKE_MODULE,
        FAKE_SESSION,
        spec({ type: 'mlkem-decap', variant: 768 })
      )
      expect(result.status).toBe('error')
      expect(result.details).toContain('boom')
    })

    it('returns error status when WASM throws during mldsa-sigver', async () => {
      vi.mocked(softhsm.hsm_importMLDSAPublicKey).mockImplementation(() => {
        throw new Error('sigver crash')
      })
      const result = await runKAT(
        FAKE_MODULE,
        FAKE_SESSION,
        spec({ type: 'mldsa-sigver', variant: 65 })
      )
      expect(result.status).toBe('error')
      expect(result.details).toContain('sigver crash')
    })

    it('propagates referenceUrl even on error', async () => {
      vi.mocked(softhsm.hsm_importMLKEMPrivateKey).mockImplementation(() => {
        throw new Error('fail')
      })
      const result = await runKAT(
        FAKE_MODULE,
        FAKE_SESSION,
        spec({ type: 'mlkem-decap', variant: 768 }, { referenceUrl: 'https://custom.ref' })
      )
      expect(result.referenceUrl).toBe('https://custom.ref')
    })

    it('propagates algorithm name even on error', async () => {
      vi.mocked(softhsm.hsm_importMLKEMPrivateKey).mockImplementation(() => {
        throw new Error('fail')
      })
      const result = await runKAT(
        FAKE_MODULE,
        FAKE_SESSION,
        spec({ type: 'mlkem-decap', variant: 768 })
      )
      expect(result.algorithm).toBe('ML-KEM-768')
    })

    it('propagates id and useCase even on error', async () => {
      vi.mocked(softhsm.hsm_importMLDSAPublicKey).mockImplementation(() => {
        throw new Error('fail')
      })
      const s = spec({ type: 'mldsa-sigver', variant: 65 }, { id: 'err-id', useCase: 'Err case' })
      const result = await runKAT(FAKE_MODULE, FAKE_SESSION, s)
      expect(result.id).toBe('err-id')
      expect(result.useCase).toBe('Err case')
    })
  })
})

// ── not-tested (skip) status ──────────────────────────────────────────────────

describe("runKAT 'skip' — not tested when the engine does not advertise a needed mechanism", () => {
  it('skips a kind whose registered case needs a mechanism missing from C_GetMechanismList', async () => {
    // aes-kwp-wrap drives CKM_AES_KEY_WRAP_KWP (0x210b); advertise something else only.
    const r = await runKAT(FAKE_MODULE, FAKE_SESSION, spec({ type: 'aes-kwp-wrap' }), {
      advertised: new Set([0x250]),
    })
    expect(r.status).toBe('skip')
    expect(r.details).toMatch(/^Not tested — this engine does not advertise CKM_AES_KEY_WRAP_KWP/)
  })

  it('runs normally when every needed mechanism is advertised, or when no list is given', async () => {
    const needed = requiredMechanisms({ type: 'hmac-verify', hashAlg: 'SHA-256' })
    expect(needed).toEqual([0x252]) // CKM_SHA256_HMAC_GENERAL
    vi.mocked(softhsm.hsm_hmacVerifyGeneral).mockReturnValue(true)
    const withList = await runKAT(
      FAKE_MODULE,
      FAKE_SESSION,
      spec({ type: 'hmac-verify', hashAlg: 'SHA-256' }),
      { advertised: new Set(needed) }
    )
    expect(withList.status).toBe('pass')
    const emptyList = await runKAT(
      FAKE_MODULE,
      FAKE_SESSION,
      spec({ type: 'hmac-verify', hashAlg: 'SHA-256' }),
      { advertised: new Set() }
    )
    expect(emptyList.status).toBe('pass') // empty = probe failed → no pre-skip
  })

  it('summarizeKatResults keeps skip as its own bucket', () => {
    expect(
      summarizeKatResults([
        { status: 'pass' },
        { status: 'skip' },
        { status: 'fail' },
        { status: 'error' },
        { status: 'skip' },
      ])
    ).toEqual({ pass: 1, fail: 1, error: 1, skip: 2, total: 5 })
  })
})

// ── lms-sigver (RFC 8554 Appendix F) ─────────────────────────────────────────
//
// hexToBytes is mocked above (zero-filled), so the byte-level assertions read
// the hex strings directly: the lengths below are structural consequences of
// RFC 8554 §4-6 and would change if a single segment of the transcription were
// dropped or duplicated.
describe('lms-sigver', () => {
  const CKR_SIGNATURE_INVALID = 0xc0

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(softhsm.hsm_importStatefulPublicKey).mockReturnValue(31)
  })

  it.each([
    // TC1: HSS L=2, both levels LMS H5 / LMOTS W8. LMS sig = 4 + (4 + 32 + 34*32) + 4 + 5*32 = 1,292.
    [1, 60, 4 + (1292 + 56) + 1292, 'LMS_SHA256_M32_H5', 'LMOTS_SHA256_N32_W8'],
    // TC2: top LMS H10 / LMOTS W4 (4 + (4 + 32 + 67*32) + 4 + 10*32 = 2,508), bottom H5 / W8 (1,292).
    [2, 60, 4 + (2508 + 56) + 1292, 'LMS_SHA256_M32_H10', 'LMOTS_SHA256_N32_W4'],
  ] as const)(
    'test case %i has the RFC structure (pk %i B, sig %i B)',
    (tcNo, pkLen, sigLen, topLms, topOts) => {
      const tc = RFC8554_TEST_CASES[tcNo]()
      expect(tc.pub_key_hex.length / 2).toBe(pkLen)
      expect(tc.signature_hex.length / 2).toBe(sigLen)
      expect(tc.levels).toBe(2)
      // HSS public key = u32(L) || LMS public key (type || ots type || I || K)
      const typeIds: Record<string, string> = {
        LMS_SHA256_M32_H5: '00000005',
        LMS_SHA256_M32_H10: '00000006',
        LMOTS_SHA256_N32_W4: '00000003',
        LMOTS_SHA256_N32_W8: '00000004',
      }
      expect(tc.pub_key_hex.slice(0, 8)).toBe('00000002')
      expect(tc.pub_key_hex.slice(8, 16)).toBe(typeIds[topLms])
      expect(tc.pub_key_hex.slice(16, 24)).toBe(typeIds[topOts])
      // HSS signature starts with Nspk = L - 1 = 1
      expect(tc.signature_hex.slice(0, 8)).toBe('00000001')
    }
  )

  it('test case 2 carries the RFC message text', () => {
    const msg = RFC8554_TEST_CASES[2]().message_hex
    const text = String.fromCharCode(...(msg.match(/../g) ?? []).map((h) => parseInt(h, 16)))
    expect(text).toBe(
      'The enumeration in the Constitution, of certain rights, shall not be construed to deny or disparage others retained by the people.\n'
    )
  })

  it('passes when the RFC signature verifies and the tampered copy is rejected', async () => {
    vi.mocked(softhsm.hsm_statefulVerifyBytes)
      .mockReturnValueOnce(0)
      .mockReturnValueOnce(CKR_SIGNATURE_INVALID)
    const r = await runKAT(FAKE_MODULE, FAKE_SESSION, spec({ type: 'lms-sigver', testCase: 2 }))
    expect(r.status).toBe('pass')
    expect(r.algorithm).toBe('HSS/LMS (L=2, H10/W4 + H5/W8)')
    expect(r.details).toMatch(/RFC 8554 App\. F Test Case 2/)
    expect(softhsm.hsm_importStatefulPublicKey).toHaveBeenCalledWith(
      FAKE_MODULE,
      FAKE_SESSION,
      0x46, // CKK_HSS
      expect.any(Uint8Array)
    )
  })

  it('fails when the RFC signature does not verify', async () => {
    vi.mocked(softhsm.hsm_statefulVerifyBytes).mockReturnValue(CKR_SIGNATURE_INVALID)
    const r = await runKAT(FAKE_MODULE, FAKE_SESSION, spec({ type: 'lms-sigver', testCase: 1 }))
    expect(r.status).toBe('fail')
    expect(r.details).toMatch(/expected CKR_OK/)
  })

  it('fails when a one-bit-flipped signature is also accepted (a verifier that says yes to everything)', async () => {
    vi.mocked(softhsm.hsm_statefulVerifyBytes).mockReturnValue(0)
    const r = await runKAT(FAKE_MODULE, FAKE_SESSION, spec({ type: 'lms-sigver', testCase: 1 }))
    expect(r.status).toBe('fail')
    expect(r.details).toMatch(/ALSO accepted/)
  })

  it('flips exactly one bit of the last signature byte for the negative half', async () => {
    vi.mocked(softhsm.hsm_statefulVerifyBytes)
      .mockReturnValueOnce(0)
      .mockReturnValueOnce(CKR_SIGNATURE_INVALID)
    await runKAT(FAKE_MODULE, FAKE_SESSION, spec({ type: 'lms-sigver', testCase: 1 }))
    const calls = vi.mocked(softhsm.hsm_statefulVerifyBytes).mock.calls
    const good = calls[0][5] as Uint8Array
    const bad = calls[1][5] as Uint8Array
    expect(bad.length).toBe(good.length)
    const diffs = [...good].map((b, i) => b ^ bad[i]).filter((x) => x !== 0)
    expect(diffs).toEqual([0x01])
    expect(good[good.length - 1] ^ bad[bad.length - 1]).toBe(0x01)
  })
})
