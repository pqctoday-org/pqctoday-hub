// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import { ALGORITHM_REGISTRY } from './algorithmProperties'
import { loadPQCAlgorithmsData } from './pqcAlgorithmsData'
import { quizQuestions } from './quizDataLoader'

// HQC specification dated 2025-08-22, Table 6 (HQC-1 / HQC-3 / HQC-5): encapsulation key,
// decapsulation key, ciphertext and shared key sizes in bytes.
const HQC_TABLE_6 = {
  'HQC-128': { pk: 2241, sk: 2321, ct: 4433, ss: 32 },
  'HQC-192': { pk: 4514, sk: 4602, ct: 8978, ss: 32 },
  'HQC-256': { pk: 7237, sk: 7333, ct: 14421, ss: 32 },
} as const

describe('HQC sizes follow Table 6 of the HQC specification of 2025-08-22', () => {
  for (const [name, t] of Object.entries(HQC_TABLE_6)) {
    it(`${name} registry entry`, () => {
      const a = Object.entries(ALGORITHM_REGISTRY).find(([key]) => key === name)?.[1]
      expect(a).toBeDefined()
      expect(a?.publicKeyBytes).toBe(t.pk)
      expect(a?.privateKeyBytes).toBe(t.sk)
      expect(a?.signatureOrCiphertextBytes).toBe(t.ct)
      expect(a?.sharedSecretBytes).toBe(t.ss)
    })
  }

  it('the algorithm reference rows carry the same sizes and the dated specification label', async () => {
    const all = await loadPQCAlgorithmsData()
    for (const [name, t] of Object.entries(HQC_TABLE_6)) {
      const row = all.find((a) => a.name === name)
      expect(row, name).toBeDefined()
      expect(row?.publicKeySize).toBe(t.pk)
      expect(row?.privateKeySize).toBe(t.sk)
      expect(row?.signatureCiphertextSize).toBe(t.ct)
      expect(row?.sharedSecretSize).toBe(t.ss)
      expect(JSON.stringify(row)).toContain('HQC specification of 2025-08-22')
      expect(JSON.stringify(row)).not.toContain('liboqs 0.12.0')
    }
  })

  it('quiz question algo-025 quotes the HQC-128 ciphertext size of 4,433 bytes', () => {
    const q = quizQuestions.find((x) => x.id === 'algo-025')
    expect(q).toBeDefined()
    const text = JSON.stringify(q)
    expect(text).toContain('4,433')
    expect(text).not.toContain('4,522')
  })
})
