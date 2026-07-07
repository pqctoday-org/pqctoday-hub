// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import { ALGO_FACTS } from '@/components/Playground/kmip/kmip3/algoFacts'
import {
  computeKeyStorage,
  CAPACITY_OPTIONS,
  SEED_OVERHEAD_BYTES,
  CERT_TEMPLATE_BYTES,
  SPKI_WRAPPER_BYTES,
  type KeyStorageParams,
} from './hsmKeyStorageDefaults'

const base: Omit<KeyStorageParams, 'mode'> = {
  capacityBytes: CAPACITY_OPTIONS[1].bytes, // 64 MB
  rsaAlg: 'RSA-2048',
  pqcFamily: 'ML-DSA',
  pqcVariant: 'ML-DSA-65',
  overheadPct: 5,
}

describe('computeKeyStorage', () => {
  it('classical mode sizes only the RSA key, self-signed', () => {
    const r = computeKeyStorage({ ...base, mode: 'classical' })
    expect(r.privBytes).toBe(ALGO_FACTS['RSA-2048'].priv)
    expect(r.certPubBytes).toBe(ALGO_FACTS['RSA-2048'].pub)
    expect(r.certSigBytes).toBe(ALGO_FACTS['RSA-2048'].sig)
    expect(r.certBytes).toBe(
      CERT_TEMPLATE_BYTES + SPKI_WRAPPER_BYTES + r.certPubBytes + r.certSigBytes
    )
  })

  it('pure-pqc mode sizes only the PQC key, self-signed (ML-DSA/SLH-DSA)', () => {
    const r = computeKeyStorage({ ...base, mode: 'pure-pqc' })
    expect(r.certPubBytes).toBe(ALGO_FACTS['ML-DSA-65'].pub)
    expect(r.certSigBytes).toBe(ALGO_FACTS['ML-DSA-65'].sig)
  })

  it('ML-KEM cannot self-sign — pure-pqc cert signature uses the matching ML-DSA level', () => {
    const r = computeKeyStorage({
      ...base,
      mode: 'pure-pqc',
      pqcFamily: 'ML-KEM',
      pqcVariant: 'ML-KEM-768',
    })
    expect(r.certSigBytes).toBe(ALGO_FACTS['ML-DSA-65'].sig)
    expect(r.certPubBytes).toBe(ALGO_FACTS['ML-KEM-768'].pub)
  })

  it('hybrid mode sums classical and PQC private-key, public-key, and signature bytes', () => {
    const classical = computeKeyStorage({ ...base, mode: 'classical' })
    const purePqc = computeKeyStorage({ ...base, mode: 'pure-pqc' })
    const hybrid = computeKeyStorage({ ...base, mode: 'hybrid' })

    expect(hybrid.privBytes).toBe(classical.privBytes + purePqc.privBytes)
    expect(hybrid.certPubBytes).toBe(classical.certPubBytes + purePqc.certPubBytes)
    expect(hybrid.certSigBytes).toBe(classical.certSigBytes + purePqc.certSigBytes)
  })

  it('seed-overhead toggle adds SEED_OVERHEAD_BYTES for ML-DSA/ML-KEM but not SLH-DSA', () => {
    const withSeed = computeKeyStorage({ ...base, mode: 'pure-pqc', includeSeedOverhead: true })
    const withoutSeed = computeKeyStorage({
      ...base,
      mode: 'pure-pqc',
      includeSeedOverhead: false,
    })
    expect(withSeed.privBytes - withoutSeed.privBytes).toBe(SEED_OVERHEAD_BYTES['ML-DSA'])

    const slh = computeKeyStorage({
      ...base,
      mode: 'pure-pqc',
      pqcFamily: 'SLH-DSA',
      pqcVariant: 'SLH-DSA-SHA2-192s',
      includeSeedOverhead: true,
    })
    const slhNoSeed = computeKeyStorage({
      ...base,
      mode: 'pure-pqc',
      pqcFamily: 'SLH-DSA',
      pqcVariant: 'SLH-DSA-SHA2-192s',
      includeSeedOverhead: false,
    })
    expect(slh.privBytes).toBe(slhNoSeed.privBytes)
  })

  it('editable cert-template and SPKI-wrapper overrides feed straight into certBytes', () => {
    const r = computeKeyStorage({
      ...base,
      mode: 'classical',
      certTemplateBytes: 1000,
      spkiWrapperBytes: 50,
    })
    expect(r.certBytes).toBe(1000 + 50 + r.certPubBytes + r.certSigBytes)
  })

  it('raising blob overhead % never increases the number of keys that fit', () => {
    const low = computeKeyStorage({ ...base, mode: 'hybrid', overheadPct: 0 })
    const high = computeKeyStorage({ ...base, mode: 'hybrid', overheadPct: 25 })
    expect(high.numKeys).toBeLessThanOrEqual(low.numKeys)
  })

  it('usedBytes + remainderBytes always reconstructs capacityBytes', () => {
    for (const opt of CAPACITY_OPTIONS) {
      const r = computeKeyStorage({ ...base, mode: 'hybrid', capacityBytes: opt.bytes })
      expect(r.usedBytes + r.remainderBytes).toBeCloseTo(opt.bytes, 6)
    }
  })

  it('capacity smaller than one key yields zero keys and the full capacity as remainder', () => {
    const r = computeKeyStorage({ ...base, mode: 'hybrid', capacityBytes: 100 })
    expect(r.numKeys).toBe(0)
    expect(r.remainderBytes).toBe(100)
  })
})
