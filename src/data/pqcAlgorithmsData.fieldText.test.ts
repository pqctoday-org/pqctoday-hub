// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vitest'
import {
  algorithmSizeBytes,
  exportAlgorithmSize,
  exportStackRam,
  formatAesEquivalent,
  formatAlgorithmSize,
  formatLinkQuality,
  formatSecurityLevel,
  formatSnapshotDate,
  formatStackRam,
  getCatalogueFreshness,
  loadPQCAlgorithmsData,
  statusTierLabel,
  type AlgorithmDetail,
} from './pqcAlgorithmsData'

async function byName(name: string): Promise<AlgorithmDetail> {
  const data = await loadPQCAlgorithmsData()
  const algo = data.find((a) => a.name === name)
  if (!algo) throw new Error(`missing ${name}`)
  return algo
}

describe('one text per field across surfaces', () => {
  it('judges each size on its own state (a missing private key does not hide the public key)', async () => {
    const hpke = await byName('HPKE-PQ')
    expect(formatAlgorithmSize(hpke, 'publicKey')).toBe('1,184 B')
    expect(exportAlgorithmSize(hpke, 'publicKey')).toBe(1184)
    expect(formatAlgorithmSize(hpke, 'signatureOrCiphertext')).toBe('1,088 B')
    expect(exportAlgorithmSize(hpke, 'privateKey')).toBe('Research needed')
    expect(formatSecurityLevel(hpke)).toBe('Research needed')
    expect(formatLinkQuality(hpke)).toBe('Not assessed')
  })

  it('treats classical key agreement ciphertext as not applicable', async () => {
    for (const name of [
      'ECDH P-256',
      'ECDH P-384',
      'ECDH P-521',
      'X25519',
      'X448',
      'DH (Diffie-Hellman)',
    ]) {
      const algo = await byName(name)
      expect(algo.evidenceStates?.signatureOrCiphertext, name).toBe('not-applicable')
      expect(formatAlgorithmSize(algo, 'signatureOrCiphertext'), name).toBe('Not applicable')
      expect(algo.sizesUnknown, name).toBe(false)
    }
    const rsa = await byName('RSA-2048')
    expect(formatAlgorithmSize(rsa, 'signatureOrCiphertext')).toBe('256 B')
  })

  it('keeps the approximate marker on stack RAM in display and export', async () => {
    const mlkem = await byName('ML-KEM-768')
    expect(formatStackRam(mlkem)).toBe('~6,000 B')
    expect(exportStackRam(mlkem)).toBe('~6000')
    const uov = await byName('UOV')
    expect(formatStackRam(uov)).toBe('Research needed')
  })

  it('labels a blank stack RAM as not measured, not as a research gap', () => {
    const algo = {
      stackRAM: 0,
      evidenceStates: { stackRam: 'not-measured' },
    } as unknown as AlgorithmDetail
    expect(formatStackRam(algo)).toBe('Not measured')
    expect(exportStackRam(algo)).toBe('Not measured')
  })

  it('never writes a blank security level or AES equivalent', async () => {
    const data = await loadPQCAlgorithmsData()
    for (const algo of data) {
      expect(formatSecurityLevel(algo), algo.name).not.toBe('')
      expect(formatAesEquivalent(algo), algo.name).not.toBe('')
    }
    expect(formatSecurityLevel(await byName('ML-KEM-768'))).toBe('Level 3')
    expect(formatSecurityLevel(await byName('RSA-2048'))).toBe('Not applicable')
  })

  it('names maturity tiers in reader words, never internal ids', () => {
    expect(statusTierLabel('final')).toBe('Published standard')
    expect(statusTierLabel('round2-candidate')).toBe('Candidate')
    expect(statusTierLabel('regional')).toBe('Regional recommendation or selection')
  })
})

describe('snapshot dates and freshness', () => {
  it('formats a local-midnight date without shifting it to UTC', () => {
    expect(formatSnapshotDate(new Date(2026, 9, 17))).toBe('2026-10-17')
    expect(formatSnapshotDate(null)).toBeNull()
    expect(formatSnapshotDate(new Date('nope'))).toBeNull()
  })

  it('says "1 day old", not "1 days old"', () => {
    const now = new Date(2026, 9, 17, 12)
    expect(getCatalogueFreshness(new Date(2026, 9, 16, 12), now).label).toBe(
      'Snapshot is 1 day old'
    )
    expect(getCatalogueFreshness(new Date(2026, 9, 15, 12), now).label).toBe(
      'Snapshot is 2 days old'
    )
  })
})

describe('published raw PQC sizes', () => {
  it('matches FIPS 203 Table 3 and FIPS 204 Table 2', async () => {
    const rows = [
      ['ML-KEM-512', 800, 1632, 768, 32],
      ['ML-KEM-768', 1184, 2400, 1088, 32],
      ['ML-KEM-1024', 1568, 3168, 1568, 32],
      ['ML-DSA-44', 1312, 2560, 2420, null],
      ['ML-DSA-65', 1952, 4032, 3309, null],
      ['ML-DSA-87', 2592, 4896, 4627, null],
    ] as const
    for (const [name, publicKey, privateKey, output, sharedSecret] of rows) {
      const record = await byName(name)
      expect(algorithmSizeBytes(record, 'publicKey'), name).toBe(publicKey)
      expect(algorithmSizeBytes(record, 'privateKey'), name).toBe(privateKey)
      expect(algorithmSizeBytes(record, 'signatureOrCiphertext'), name).toBe(output)
      expect(algorithmSizeBytes(record, 'sharedSecret'), name).toBe(sharedSecret)
    }
  })

  it('matches FIPS 205 Table 2 and the four n-byte private-key fields in Algorithm 18', async () => {
    const rows = [
      ['128s', 16, 7856],
      ['128f', 16, 17088],
      ['192s', 24, 16224],
      ['192f', 24, 35664],
      ['256s', 32, 29792],
      ['256f', 32, 49856],
    ] as const
    for (const family of ['SHA2', 'SHAKE']) {
      for (const [variant, n, signature] of rows) {
        const name = `SLH-DSA-${family}-${variant}`
        const record = await byName(name)
        expect(algorithmSizeBytes(record, 'publicKey'), name).toBe(2 * n)
        expect(algorithmSizeBytes(record, 'privateKey'), name).toBe(4 * n)
        expect(algorithmSizeBytes(record, 'signatureOrCiphertext'), name).toBe(signature)
        expect(algorithmSizeBytes(record, 'sharedSecret'), name).toBeNull()
      }
    }
  })
})
