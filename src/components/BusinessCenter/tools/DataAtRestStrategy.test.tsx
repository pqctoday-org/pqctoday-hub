// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import { buildMarkdown, STRATEGY_OPTIONS, type DataAtRestState } from './DataAtRestStrategy'

const sample: DataAtRestState = {
  stores: [
    {
      id: 's1',
      name: 'Customer PII database',
      strategy: 'Re-wrap existing DEK under PQC KEK',
      sensitivity: 'High',
      note: '',
    },
    {
      id: 's2',
      name: 'Backups & archives',
      strategy: 'Re-encrypt with fresh AES-256 DEK (PQC-wrapped KEK)',
      sensitivity: 'High',
      note: '',
    },
  ],
}

describe('buildMarkdown — data-at-rest envelope', () => {
  const md = buildMarkdown(sample)

  it('shows the envelope explicitly, with the KDF between the ML-KEM secret and the KEK', () => {
    expect(md).toMatch(
      /ML-KEM shared secret → approved key-derivation function \(as required\) → symmetric key-encryption key \(KEK\) → authenticated wrap of the data-encryption key \(DEK\)/
    )
    expect(md).toMatch(/shared secret is not itself the KEK/)
    expect(md).toMatch(/DEK\s+remains an AES-256 key that still encrypts the data/)
  })

  it('does not say the strategies swap the KEK to ML-KEM, or call the data lower-urgency across the board', () => {
    expect(md).not.toMatch(/swap the KEK to ML-KEM/i)
    expect(md).not.toMatch(/Why most data-at-rest is lower-urgency/i)
    expect(md).not.toMatch(/~128-bit effective level/)
  })

  it('tells re-wrap from re-encrypt and says which key protects which bytes after each', () => {
    expect(md).toMatch(/re-wrapping replaces only the wrapped DEK/i)
    expect(md).toMatch(/DEK and\s+the stored ciphertext are unchanged/i)
    expect(md).toMatch(
      /Re-encrypting under a fresh DEK limits that to copies made before the change/
    )
    expect(md).toMatch(/Neither\s+affects ciphertext or wrapped keys that were already taken/)
  })

  it('says when storage is urgent and a rewrap alone is not sufficient', () => {
    expect(md).toMatch(/must stay confidential for decades/)
    expect(md).toMatch(/a rewrap alone is not sufficient/)
    expect(md).toMatch(/security category 5/)
  })

  it('keeps the stored strategy values so saved selections still round-trip', () => {
    expect(STRATEGY_OPTIONS).toContain('Re-wrap existing DEK under PQC KEK')
    expect(STRATEGY_OPTIONS).toContain('Re-encrypt with fresh AES-256 DEK (PQC-wrapped KEK)')
    expect(md).toContain('Re-wrap existing DEK under PQC KEK')
  })
})
