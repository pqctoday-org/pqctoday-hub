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

// hexToBytes: return zero-filled Uint8Array of length hex.length/2 (value = 0 per byte)
vi.mock('./dataInputUtils', () => ({
  hexToBytes: (hex: string) => new Uint8Array(Math.max(1, hex.length / 2)),
}))

// ── Module under test (imported after mocks) ──────────────────────────────────

import { runKAT } from './katRunner'
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
    vi.mocked(softhsm.hsm_importMLKEMPrivateKey).mockReturnValue(1)
    vi.mocked(softhsm.hsm_decapsulate).mockReturnValue(2)
    // Default extractKeyValue: zero-filled 1-byte array → matches mocked ss '00' → pass
    vi.mocked(softhsm.hsm_extractKeyValue).mockReturnValue(new Uint8Array(1))
    vi.mocked(softhsm.hsm_generateMLKEMKeyPair).mockReturnValue({ pubHandle: 1, privHandle: 2 })
    vi.mocked(softhsm.hsm_encapsulate).mockReturnValue({
      ciphertextBytes: new Uint8Array(10),
      secretHandle: 3,
    })
    vi.mocked(softhsm.hsm_importMLDSAPublicKey).mockReturnValue(4)
    vi.mocked(softhsm.hsm_verifyBytes).mockReturnValue(true)
    vi.mocked(softhsm.hsm_generateMLDSAKeyPair).mockReturnValue({ pubHandle: 5, privHandle: 6 })
    vi.mocked(softhsm.hsm_sign).mockReturnValue(new Uint8Array(10))
    vi.mocked(softhsm.hsm_verify).mockReturnValue(true)
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
      expect(result.details).toMatch(/\d+ bytes/)
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
      expect(result.details).toContain('ct=')
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
      expect(result.details).toContain('NIST ACVP')
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
      expect(result.details).toContain('sig=')
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
