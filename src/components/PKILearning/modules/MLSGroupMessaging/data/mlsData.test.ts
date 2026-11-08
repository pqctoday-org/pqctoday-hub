// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import { MLS_CIPHERSUITES, MLS_LIBRARY_REFS } from './mlsData'
import { content } from '../content'

// Cipher-suite names registered by draft-ietf-mls-pq-ciphersuites-07, section 3.1 (the same eleven names as -06).
const REGISTERED_PQ_SUITES = [
  'MLS_128_MLKEM768X25519_AES128GCM_SHA256_Ed25519',
  'MLS_128_MLKEM768X25519_AES256GCM_SHA384_Ed25519',
  'MLS_128_MLKEM768P256_AES128GCM_SHA256_P256',
  'MLS_128_MLKEM768P256_AES256GCM_SHA384_P256',
  'MLS_192_MLKEM1024P384_AES256GCM_SHA384_P384',
  'MLS_128_MLKEM768_AES256GCM_SHA384_Ed25519',
  'MLS_128_MLKEM768_AES256GCM_SHA384_P256',
  'MLS_192_MLKEM1024_AES256GCM_SHA384_P384',
  'MLS_128_MLKEM768X25519_CHACHA20POLY1305_SHA384_MLDSA44',
  'MLS_192_MLKEM768_AES256GCM_SHA384_MLDSA65',
  'MLS_256_MLKEM1024_AES256GCM_SHA384_MLDSA87',
]

describe('MLS cipher-suite catalogue', () => {
  it('lists a post-quantum draft row only if its name is a suite the draft registers', () => {
    const pqRows = MLS_CIPHERSUITES.filter((s) => s.status === 'draft-pq')
    expect(pqRows.length).toBeGreaterThan(0)
    for (const row of pqRows) {
      const name = row.label.replace(/\s*\(draft\)$/, '')
      expect(REGISTERED_PQ_SUITES).toContain(name)
    }
  })

  it('gives each post-quantum row the KDF and AEAD its registered name carries', () => {
    const mldsa65 = MLS_CIPHERSUITES.find((s) => s.label.startsWith('MLS_192_MLKEM768_AES256GCM'))
    expect(mldsa65?.kdf).toBe('HKDF-SHA384')
    expect(mldsa65?.aead).toBe('AES-256-GCM')
    expect(mldsa65?.signature).toBe('ML-DSA-65')
    const hybrid = MLS_CIPHERSUITES.find((s) => s.label.startsWith('MLS_128_MLKEM768X25519'))
    expect(hybrid?.kdf).toBe('HKDF-SHA256')
    expect(hybrid?.aead).toBe('AES-128-GCM')
    expect(hybrid?.signature).toMatch(/Ed25519/)
    expect(hybrid?.signature).toMatch(/confidentiality only/i)
  })

  it('presents the combiner as two sessions joined by an exported PSK, not as one fixed suite', () => {
    const combiner = MLS_CIPHERSUITES.filter((s) =>
      s.referenceId.startsWith('draft-ietf-mls-combiner')
    )
    expect(combiner).toHaveLength(1)
    const row = combiner[0]
    expect(row.label).toMatch(/traditional session/i)
    expect(row.label).toMatch(/PQ session/i)
    expect(row.label).toMatch(/exported PSK/i)
    // each session names its own suite; no concatenated KEM or dual-signature suite is invented
    expect(row.kem).toMatch(/per session/i)
    expect(row.kdf).toMatch(/per session/i)
    expect(row.aead).toMatch(/per session/i)
    expect(row.signature).toMatch(/per session/i)
    expect(JSON.stringify(row)).not.toMatch(/X25519\s*‖\s*ML-KEM/)
    expect(row.signature).not.toMatch(/Ed25519 \+ ML-DSA/)
  })
})

describe('MLS draft revisions', () => {
  it('names revision -07 of the cipher-suite draft and -11 of the extensions framework', () => {
    const pq = MLS_CIPHERSUITES.filter((c) => c.status === 'draft-pq')
    expect(pq.every((c) => c.referenceId === 'draft-ietf-mls-pq-ciphersuites-07')).toBe(true)
    expect(MLS_LIBRARY_REFS).toContain('draft-ietf-mls-pq-ciphersuites-07')
    expect(MLS_LIBRARY_REFS).toContain('draft-ietf-mls-extensions-11')
    expect(MLS_LIBRARY_REFS).not.toContain('draft-ietf-mls-pq-ciphersuites-06')
    expect(MLS_LIBRARY_REFS).not.toContain('draft-ietf-mls-extensions-09')
  })

  it('cites the same revisions in the module standards', () => {
    const ids = content.standards.map((s) => s.id)
    expect(ids).toContain('draft-ietf-mls-pq-ciphersuites-07')
    expect(ids).toContain('draft-ietf-mls-extensions-11')
  })
})
