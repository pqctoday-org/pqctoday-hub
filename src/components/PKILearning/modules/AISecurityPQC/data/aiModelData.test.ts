// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import { KEY_WRAPPING_OVERHEADS } from './aiModelData'

const wrap = (id: string) => KEY_WRAPPING_OVERHEADS.find((w) => w.algorithmId === id)!

// FIPS 203 Table 3 ciphertext sizes, RFC 3394 AES-KW expansion (32 B key -> 40 B), RFC 7748 X25519 value
const KEM_CT = { 'ml-kem-768': 1088, 'ml-kem-1024': 1568 }
const AES_KW_32B_KEY = 40
const X25519_PUBLIC = 32

describe('key wrapping overhead models a complete stored envelope, not just the KEM ciphertext', () => {
  it('stores the KEM ciphertext plus the wrapped DEK for ML-KEM', () => {
    for (const [id, ct] of Object.entries(KEM_CT)) {
      expect(wrap(id).keyOrSignatureSize).toBe(ct + AES_KW_32B_KEY)
      expect(wrap(id).keyOrSignatureSize).toBeGreaterThan(ct)
    }
  })

  it('adds the X25519 public value for the hybrid envelope', () => {
    expect(wrap('hybrid-ml-kem-x25519').keyOrSignatureSize).toBe(
      KEM_CT['ml-kem-768'] + X25519_PUBLIC + AES_KW_32B_KEY
    )
  })

  it('keeps RSA-OAEP as the wrapped DEK itself', () => {
    expect(wrap('rsa-2048').keyOrSignatureSize).toBe(256)
  })

  it('names each envelope field and algorithm in the label', () => {
    expect(wrap('ml-kem-768').algorithmLabel).toMatch(/KEM ciphertext 1,088 B/)
    expect(wrap('ml-kem-768').algorithmLabel).toMatch(/AES-KW wrapped DEK 40 B/)
    expect(wrap('hybrid-ml-kem-x25519').algorithmLabel).toMatch(/32 B/)
    expect(wrap('rsa-2048').algorithmLabel).toMatch(/wrapped DEK/)
  })

  it('never reports a PQC wrap smaller than its own KEM ciphertext', () => {
    for (const w of KEY_WRAPPING_OVERHEADS.filter((x) => x.quantumSafe)) {
      const ct = w.algorithmId === 'ml-kem-1024' ? 1568 : 1088
      expect(w.keyOrSignatureSize).toBeGreaterThan(ct)
    }
  })
})
