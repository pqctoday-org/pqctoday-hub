// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vitest'
import {
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
