// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vitest'
import { softwareData } from './migrateData'

function product(id: string) {
  const matches = softwareData.filter((item) => item.productId === id)
  expect(matches).toHaveLength(1)
  return matches[0]
}

describe('catalogue capability scope through the real loader', () => {
  it('keeps Algorand’s concrete Falcon path without equating it to final FN-DSA or universal consensus migration', () => {
    const item = product('algorand')
    expect(item.pqcSupport).toMatch(/Yes.*Falcon/)
    expect(item.pqcSupport).not.toContain('FN-DSA')
    expect(item.pqcCapabilityDescription).toMatch(/State Proofs/)
    expect(item.pqcCapabilityDescription).toMatch(/Logic Signature/)
    expect(item.pqcCapabilityDescription).toMatch(/off-curve/)
    expect(item.pqcCapabilityDescription).toMatch(/four-transaction/)
    expect(item.productBrief).not.toMatch(/first blockchain|consensus PQC planned 2026/i)
    expect(item.proofRelevantInfo).toMatch(/Verifiable Random Function/)
    expect(item.latestVersion).toBe('5.0.5')
  })

  it('retains Commvault’s named vendor capability and both release tracks without silently converting older algorithm variants', () => {
    const item = product('commvault-cloud')
    for (const algorithm of ['CRYSTALS-Kyber', 'CRYSTALS-Dilithium', 'SPHINCS+', 'FALCON', 'HQC'])
      expect(item.pqcSupport).toContain(algorithm)
    expect(item.pqcSupport).not.toMatch(/ML-KEM|ML-DSA|SLH-DSA/)
    expect(item.pqcCapabilityDescription).toMatch(/network tunnels/)
    expect(item.pqcCapabilityDescription).toContain('11.36')
    expect(item.productBrief).not.toMatch(/the only/i)
    expect(item.latestVersion).toContain('Innovation 11.46.40')
    expect(item.latestVersion).toContain('LTS 11.44.30')
  })

  it('preserves both libcrux components while identifying the actual mathematical verification scope', () => {
    const item = product('cryspen-libcrux')
    expect(item.pqcSupport).toMatch(/ML-KEM and ML-DSA.*separate/)
    expect(item.pqcCapabilityDescription).toMatch(/portable.*AVX2.*NEON/)
    expect(item.pqcCapabilityDescription).toMatch(
      /field arithmetic, NTT polynomial arithmetic, serialization/
    )
    expect(item.pqcCapabilityDescription).toMatch(/compiled constant-time behavior as best-effort/)
    expect(item.productBrief).toMatch(/ML-DSA-44, ML-DSA-65 and ML-DSA-87/)
    expect(item.productBrief).toMatch(/arithmetic.*serialization/)
    expect(item.latestVersion).toBe('libcrux-ml-kem 0.0.11')
    expect(item.proofUrl).toContain('crates/libcrux-ml-kem')
  })
})
