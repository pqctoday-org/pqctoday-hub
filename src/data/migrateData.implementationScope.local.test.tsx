// SPDX-License-Identifier: AGPL-3.0-only
// Source-scoped capabilities through the actual catalogue loader.
import { describe, expect, it } from 'vitest'
import { softwareData, softwareMetadata } from '@/data/migrateData'

function product(id: string) {
  const matches = softwareData.filter((item) => item.productId === id)
  expect(matches, `one active loader record for ${id}`).toHaveLength(1)
  return matches[0]!
}

const checkedProducts = [
  'taurus-sa',
  'qrypt-blast-sdk',
  'cryptonext-compass-network-probe',
  'pqcryptolib-core',
  'hqc-reference-implementation',
  'kpqclean-korean-reference',
  'PQ-SORT-Post-Quantum-Signatures-On-Ramp',
  'Cryptography-std-crypto-Zig',
] as const

describe('Implementation catalogue scope', () => {
  it('loads each reviewed implementation through the actual dated catalogue consumer', () => {
    expect(softwareMetadata?.filename).toMatch(/^pqc_product_catalog_\d{8}(?:_r\d+)?\.csv$/)
    for (const id of checkedProducts) expect(product(id).softwareName).toBeTruthy()
  })

  it('distinguishes vendor-reported hybrid transport from blockchain-dependent transaction signing', () => {
    const item = product('taurus-sa')
    expect(item.pqcSupport).toMatch(/vendor-reported X25519 \+ ML-KEM/)
    expect(item.pqcCapabilityDescription).toMatch(/SSH, TLS and VPN/)
    expect(item.pqcCapabilityDescription).toMatch(/when blockchains support/)
    expect(item.pqcCapabilityDescription).toMatch(
      /On-chain PQ signing.*dependent on blockchain adoption/
    )
    expect(item.proofRelevantInfo).toMatch(/September 2026/)
    expect(item.proofRelevantInfo).toMatch(/not deployment certification or blanket FIPS\/CNSA/)
  })

  it('retains BLAST coordination requirements and the reported rekey tradeoff', () => {
    const item = product('qrypt-blast-sdk')
    expect(item.pqcCapabilityDescription).toMatch(/locally extract matching encryption keys/)
    expect(item.pqcCapabilityDescription).toMatch(
      /server selections, sampling seeds and extraction parameters/
    )
    expect(item.productBrief).toMatch(/requires an access token/)
    const evidence = item.proofRelevantInfo || ''
    expect(evidence).toMatch(/vendor-reported VPN results, not a standalone SDK benchmark/)
    expect(evidence).toMatch(/Jetson Orin Nano 8GB.*strongSwan 6\.0\.0beta4.*liboqs 0\.11\.0/)
    // These are cited measurements in the related example, not measurements
    // made by this test. Equal-looking steady-state bandwidth hides rekey cost.
    for (const throughput of ['927.09', '926.54', '926.21']) expect(evidence).toContain(throughput)
    const rekey = evidence.match(/from (\d+) ms.*to (\d+) ms with BLAST/)
    expect(rekey).not.toBeNull()
    const baseline = Number(rekey![1])
    const withBlast = Number(rekey![2])
    expect([baseline, withBlast]).toEqual([483, 741])
    expect(withBlast - baseline).toBe(258)
    expect((withBlast / baseline - 1) * 100).toBeCloseTo(53.416149, 5)
    expect(evidence).toMatch(/does not establish zero handshake or rekey cost/)
  })

  it('keeps the Network Probe a passive discovery tool rather than an algorithm provider or recommendation', () => {
    const item = product('cryptonext-compass-network-probe')
    expect(item.pqcSupport).toMatch(/passive cryptographic discovery/)
    expect(item.pqcCapabilityDescription).toMatch(/packet-inspection extraction/)
    expect(item.pqcCapabilityDescription).toMatch(/COMPASS Analytics integration/)
    expect(item.pqcCapabilityDescription).toMatch(/no protocol count or probe-specific certificate/)
    expect(item.proofRelevantInfo).toMatch(/1 April 2025/)
    expect(item.proofRelevantInfo).toMatch(/availability announced for 1 July 2025/)
    expect(item.proofRelevantInfo).toMatch(
      /not independent completeness, safety, recommendation or certification/
    )
  })

  it('binds PQCryptoLib algorithm validation to its version and environment without promoting it to a module certificate', () => {
    const item = product('pqcryptolib-core')
    const capabilities = item.pqcCapabilityDescription || ''
    expect(capabilities).toMatch(/A8807.*PQCryptoLib-Core 3\.5\.1/)
    expect(capabilities).toMatch(/ML-KEM.*ML-DSA.*SLH-DSA/)
    expect(capabilities).toMatch(/Red Hat Enterprise Linux 8\.10 on AMD EPYC 9224/)
    expect(capabilities).toMatch(/Ubuntu 24\.04 LTS on Intel Xeon Platinum 8276/)
    expect(capabilities).toMatch(/with and without PAA/)
    expect(capabilities).toMatch(/distinct from FIPS 140-3 module validation/)
    expect(item.productBrief).toMatch(/v1\.0\.0 under CMVP #4800/)
    expect(item.productBrief).toMatch(/v3\.5\.1 under CAVP A8807/)
    expect(item.productBrief).toMatch(/v1\.0\.2 module validation is submitted\/in process/)
    expect(item.proofRelevantInfo).toMatch(/first validated 24 July 2026/)
  })

  it('preserves released HQC implementation capabilities, timing limits and separate software/specification dates', () => {
    const item = product('hqc-reference-implementation')
    expect(item.latestVersion).toBe('v5.1.0')
    expect(item.releaseDate).toBe('2026-10-26')
    expect(item.pqcSupport).toMatch(/HQC-1, HQC-3 and HQC-5/)
    expect(item.pqcCapabilityDescription).toMatch(/portable reference and optimized x86 AVX2/)
    expect(item.pqcCapabilityDescription).toMatch(/unit\/API tests, KAT files and benchmarks/)
    expect(item.pqcCapabilityDescription).toMatch(
      /timing attacks; other side channels are not considered/
    )
    expect(item.pqcCapabilityDescription).toMatch(
      /compiler-induced timing hardening remains work in progress/
    )
    expect(item.proofUrl).toBe('https://pqc-hqc.org/doc/hqc_specifications_v5.1.pdf')
    expect(item.proofPublicationDate).toBe('2026-11-09')
    expect(item.proofRelevantInfo).toMatch(/seed-based compressed decapsulation key the default/)
    expect(item.proofRelevantInfo).toMatch(/expansion overhead.*mitigated by caching/)
    expect(item.proofRelevantInfo).not.toMatch(/final.*2027|draft expected/)
  })

  it('keeps KpqClean submission identity and benchmark units rather than inferring later winner revisions', () => {
    const item = product('kpqclean-korean-reference')
    expect(item.pqcSupport).toMatch(/NTRUplus, SMAUG, PALOMA, REDOG, AIMer and HAETAE/)
    expect(item.pqcSupport).not.toMatch(/SMAUG-T/)
    expect(item.pqcCapabilityDescription).toMatch(
      /Round 1 submissions with individually dated updates/
    )
    expect(item.proofRelevantInfo).toMatch(/seven PKE\/KEM and nine signature submissions/)
    expect(item.proofRelevantInfo).toMatch(/x86 tests report average and median cycles/)
    expect(item.proofRelevantInfo).toMatch(/Apple M1 Pro uses 100 iterations and nanoseconds/)
    expect(item.proofRelevantInfo).toMatch(/ARM environment uses 10 iterations and nanoseconds/)
    expect(item.productBrief).toMatch(/not evidence that it implements every later/)
    expect(item.latestVersion || '').toBe('')
    expect(item.releaseDate || '').toBe('')
  })

  it('keeps PQ-SORT available as a benchmark tool with a controlled environment, not a portable crypto-service claim', () => {
    const item = product('PQ-SORT-Post-Quantum-Signatures-On-Ramp')
    expect(item.pqcSupport).toMatch(/^Yes \(benchmark comparison tool:/)
    expect(item.pqcStatusCanonical).toBe('available')
    expect(item.pqcCapabilityDescription).toMatch(/1,000 random executions using libcpucycles/)
    expect(item.pqcCapabilityDescription).toMatch(/fastest x86_64 implementation/)
    expect(item.pqcCapabilityDescription).toMatch(
      /ML-DSA, Falcon and SLH-DSA comparison code comes from liboqs/
    )
    expect(item.primaryPlatforms).toMatch(/Ubuntu 26\.04.*i7-13700K.*gcc\/g\+\+ 15\.2\.0/)
    expect(item.proofRelevantInfo).toMatch(/24 September 2026/)
    expect(item.proofRelevantInfo).toMatch(/not deployment-independent performance/)
  })

  it('exposes released Zig ML-DSA and final ML-KEM separately from earlier Kyber without inheriting a mirror date', () => {
    const item = product('Cryptography-std-crypto-Zig')
    expect(item.latestVersion).toBe('0.17.1')
    expect(item.releaseDate).toBe('2026-11-02')
    expect(item.pqcCapabilityDescription).toMatch(/sign\.mldsa.*kem\.ml_kem/)
    expect(item.pqcCapabilityDescription).toMatch(/kem\.kyber_d00.*earlier Kyber variant/)
    expect(item.proofRelevantInfo).toMatch(
      /nist namespace for FIPS 203 from d00 for Kyber v3\.02\/draft00/
    )
    expect(item.proofRelevantInfo).toMatch(/MLKem512, MLKem768 and MLKem1024/)
    expect(item.proofUrl).toBe('https://codeberg.org/ziglang/zig/raw/tag/0.17.1/lib/std/crypto.zig')
    expect(item.proofPublicationDate).toBeUndefined()
    expect(item.proofRelevantInfo).toMatch(
      /does not establish an independent implementation or module-validation certificate/
    )
  })
})
