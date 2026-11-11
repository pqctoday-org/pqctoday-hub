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

  it('keeps independently audited hash exports distinct from historical exclusions and newer self-review', () => {
    const item = product('noble-hashes')
    expect(item.pqcCapabilityDescription).toMatch(/MACs and KDFs/)
    expect(item.pqcCapabilityDescription).toMatch(/legacy functions separately/)
    expect(item.productBrief).toMatch(/version 1\.0\.0 in January 2022/)
    expect(item.productBrief).toMatch(/excluding blake3, sha3-addons, sha1 and argon2/)
    expect(item.productBrief).toMatch(/AI-assisted self-audits/)
    expect(item.productBrief).not.toMatch(/quantum-safe with doubled output/)
    expect(item.latestVersion).toBe('2.4.0')
    expect(item.proofRelevantInfo).toContain('2.4.0')
  })

  it('teaches the named timing defense and workload tradeoff without universal security conclusions', () => {
    const go = product('trailofbits-ml-dsa')
    expect(go.pqcCapabilityDescription).toMatch(/ML-DSA-44.*ML-DSA-65.*ML-DSA-87/)
    expect(go.pqcCapabilityDescription).toMatch(/Decompose.*Barrett reduction/)
    expect(go.pqcCapabilityDescription).not.toMatch(/prevent timing attacks/)
    const code = product('classic-mceliece-reference')
    expect(code.pqcSupport).toMatch(/historical NIST Round 4 candidate/)
    expect(code.pqcCapabilityDescription).toMatch(/large public keys.*small ciphertexts/)
    expect(code.pqcCapabilityDescription).toMatch(/public key is reused/)
    expect(code.proofRelevantInfo).toMatch(/ends its consideration/)
  })

  it('distinguishes selectable hash configurations from standardized-family names and scopes author benchmarks', () => {
    const item = product('pqmagic-shanghai-jiao-tong-university')
    expect(item.pqcSupport).toMatch(/ML-KEM.*ML-DSA.*SLH-DSA/)
    expect(item.pqcCapabilityDescription).toMatch(/SM3 default and SHAKE selectable/)
    expect(item.pqcCapabilityDescription).toMatch(/PQMagic-std.*PQMagic-adv/)
    expect(item.proofRelevantInfo).toMatch(/project-reported.*AMD Ryzen 5 9600x.*Debian 12/)
  })

  it('keeps standard and ephemeral Frodo key-reuse policies separate', () => {
    const item = product('microsoft-pqcrypto-lweke')
    expect(item.pqcSupport).toMatch(/FrodoKEM-640\/976\/1344.*eFrodoKEM-640\/976\/1344/)
    expect(item.pqcCapabilityDescription).toMatch(/repeated use.*limited number of ciphertexts/)
    expect(item.proofRelevantInfo).toMatch(/ISO\/IEC 18033-2:2006\/Amd 2:2026/)
    expect(item.proofRelevantInfo).toMatch(/not selected by NIST/)
  })

  it('keeps a vendor Java implementation’s supported parameter sets separate from its module options', () => {
    const item = product('Oracle-Jipher')
    for (const parameter of ['ML-KEM-512', 'ML-KEM-768', 'ML-KEM-1024'])
      expect(item.pqcCapabilityDescription).toContain(parameter)
    expect(item.pqcCapabilityDescription).toMatch(/ML-DSA-44.*ML-DSA-65.*ML-DSA-87/)
    expect(item.fipsValidated).toMatch(/patched module used by default/)
    expect(item.fipsValidated).toMatch(/not strictly FIPS 140-3 compliant/)
    expect(item.fipsValidated).not.toMatch(/^Yes|^No /)
  })
})
