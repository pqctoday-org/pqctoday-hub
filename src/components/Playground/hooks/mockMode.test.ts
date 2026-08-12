// SPDX-License-Identifier: GPL-3.0-only
//
// Mock mode is the fallback the interactive playground drops into when
// WebAssembly cannot load. Before 2026-08-12 it fabricated success: signature
// verification returned VALID for any string beginning `mock_signature_`
// regardless of which public key was selected, and KEM decapsulation reported a
// match unconditionally.
//
// That is worse than useless pedagogically. The single most important thing a
// signature tool demonstrates is that a signature does NOT verify under the
// wrong key — and the old mock made that impossible to show. These tests exist
// to pin the failure cases, not the success ones.
import { describe, it, expect } from 'vitest'
import { mockSignature } from './useDsaOperations'
import { mockPairId, mockKemSecret } from './useKemOperations'

const MSG = 'The quick brown fox'

describe('mock mode — signatures', () => {
  it('verifies when the public key is from the signing key pair', () => {
    // Keys are minted as pk-<base> / sk-<base>; the pair is the shared <base>.
    expect(mockSignature('pk-abc1234', MSG)).toBe(mockSignature('sk-abc1234', MSG))
  })

  it('FAILS under a public key from a different pair', () => {
    expect(mockSignature('pk-zzz9999', MSG)).not.toBe(mockSignature('sk-abc1234', MSG))
  })

  it('FAILS when the message changed after signing', () => {
    expect(mockSignature('pk-abc1234', 'edited message')).not.toBe(mockSignature('sk-abc1234', MSG))
  })

  it('is deterministic — the same pair and message always agree', () => {
    expect(mockSignature('sk-abc1234', MSG)).toBe(mockSignature('sk-abc1234', MSG))
  })

  it('still looks like the mock it is, so it can never be mistaken for real output', () => {
    expect(mockSignature('sk-abc1234', MSG)).toMatch(/^mock_signature_[0-9a-f]{32}$/)
  })
})

describe('mock mode — KEM', () => {
  it('derives the same secret for both halves of a pair', () => {
    expect(mockKemSecret('pk-abc1234')).toBe(mockKemSecret('sk-abc1234'))
  })

  it('derives a DIFFERENT secret for a different pair', () => {
    expect(mockKemSecret('pk-zzz9999')).not.toBe(mockKemSecret('sk-abc1234'))
  })

  it('strips the pk-/sk- prefix to find the pair identity', () => {
    expect(mockPairId('pk-abc1234')).toBe('abc1234')
    expect(mockPairId('sk-abc1234')).toBe('abc1234')
    expect(mockPairId('abc1234')).toBe('abc1234') // already bare
  })

  it('encodes the pair into the ciphertext so the wrong key cannot decapsulate', () => {
    // Mirrors what the encapsulate branch builds; the decapsulate branch accepts
    // only a ciphertext carrying its own pair id.
    const ct = `mockct-${mockPairId('pk-abc1234')}-${mockKemSecret('pk-abc1234').slice(0, 16)}`
    expect(ct.startsWith(`mockct-${mockPairId('sk-abc1234')}-`)).toBe(true)
    expect(ct.startsWith(`mockct-${mockPairId('sk-zzz9999')}-`)).toBe(false)
  })
})
