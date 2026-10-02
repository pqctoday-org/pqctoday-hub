// SPDX-License-Identifier: GPL-3.0-only
/**
 * Exact sizes are the standards' own numbers. This pins every size the module
 * shows to two independent copies: the hub's algorithm registry (generated
 * from the algorithm reference CSV) and the byte lengths of the NIST ACVP
 * vectors the KAT panels run. Stateful sizes are recomputed from the RFC
 * formulas. Benchmarks must name a known source.
 */
import { describe, it, expect } from 'vitest'
import mlkemVectors from '@/data/acvp/mlkem_test.json'
import mldsaVectors from '@/data/acvp/mldsa_test.json'
import { getAlgorithm } from '@/data/algorithmProperties'
import { BENCH_SOURCES, CONSTRAINED_ALGORITHMS, algorithmById } from './constants'
import { PQC_KEM_SPECS } from './data/fleetData'
import { HANDSHAKE_KEMS } from './utils/sizing'

const REGISTRY_NAME: Record<string, string> = {
  'ml-kem-512': 'ML-KEM-512',
  'ml-kem-768': 'ML-KEM-768',
  'ml-kem-1024': 'ML-KEM-1024',
  'ml-dsa-44': 'ML-DSA-44',
  'ml-dsa-65': 'ML-DSA-65',
  'ml-dsa-87': 'ML-DSA-87',
  'fn-dsa-512': 'FN-DSA-512',
  'frodokem-640': 'FrodoKEM-640',
  'ecdsa-p256': 'ECDSA P-256',
  'ecdh-p256': 'ECDH P-256',
}

describe('exact sizes', () => {
  it.each(Object.entries(REGISTRY_NAME))('%s matches the hub algorithm registry', (id, name) => {
    const a = algorithmById(id)
    const r = getAlgorithm(name)
    expect(a.publicKeyBytes).toBe(r.publicKeyBytes)
    if (a.type === 'Signature' || id !== 'ecdh-p256') {
      expect(a.outputBytes).toBe(r.signatureOrCiphertextBytes)
    }
  })

  it('ML-KEM sizes equal the byte lengths in the bundled NIST ACVP vectors', () => {
    for (const g of mlkemVectors.testGroups) {
      const id = g.parameterSet.toLowerCase()
      const a = algorithmById(id)
      const t = g.tests[0] as { pk: string; sk: string; ct: string }
      expect(a.publicKeyBytes, id).toBe(t.pk.length / 2)
      expect(a.secretKeyBytes, id).toBe(t.sk.length / 2)
      expect(a.outputBytes, id).toBe(t.ct.length / 2)
      const fleet = PQC_KEM_SPECS.find((k) => k.id === id)!
      expect(fleet.publicKeyBytes).toBe(a.publicKeyBytes)
      expect(fleet.ciphertextBytes).toBe(a.outputBytes)
    }
  })

  it('ML-DSA sizes equal the byte lengths in the bundled NIST ACVP vectors', () => {
    for (const g of mldsaVectors.testGroups) {
      const id = g.parameterSet.toLowerCase()
      const a = algorithmById(id)
      const t = g.tests[0] as { pk: string; sk: string; sig: string }
      expect(a.publicKeyBytes, id).toBe(t.pk.length / 2)
      expect(a.secretKeyBytes, id).toBe(t.sk.length / 2)
      expect(a.outputBytes, id).toBe(t.sig.length / 2)
    }
  })

  it('handshake KEM sizes are the same numbers', () => {
    for (const id of ['ml-kem-512', 'ml-kem-768'] as const) {
      expect(HANDSHAKE_KEMS[id].sizes.publicKeyBytes).toBe(algorithmById(id).publicKeyBytes)
      expect(HANDSHAKE_KEMS[id].sizes.ciphertextBytes).toBe(algorithmById(id).outputBytes)
    }
    expect(HANDSHAKE_KEMS.x25519.sizes.publicKeyBytes).toBe(getAlgorithm('X25519').publicKeyBytes)
  })

  it('LMS H10/W4 sizes follow RFC 8554 §4-6 (as HSS with L = 1)', () => {
    const n = 32
    const p = 67 // LMOTS_SHA256_N32_W4
    const h = 10
    const lmotsSig = 4 + n + p * n
    const lmsSig = 4 + lmotsSig + 4 + h * n
    expect(lmsSig).toBe(2508)
    const lms = algorithmById('lms-h10-w4')
    expect(lms.outputBytes).toBe(4 + lmsSig) // HSS: u32 Nspk + LMS signature
    expect(lms.publicKeyBytes).toBe(4 + 4 + 4 + 16 + n) // u32 L + LMS public key (56)
  })

  it('XMSS-SHA2_10_256 sizes follow RFC 8391 §4', () => {
    const n = 32
    const len = 67
    const h = 10
    const x = algorithmById('xmss-h10')
    expect(x.outputBytes).toBe(4 + n + len * n + h * n)
    expect(x.publicKeyBytes).toBe(4 + 2 * n)
  })

  it('FN-DSA-512 uses the Falcon v1.2 padded size and is labelled pre-standard', () => {
    const f = algorithmById('fn-dsa-512')
    expect(f.outputBytes).toBe(666)
    expect(f.status).toBe('pre-standard')
    expect(f.sizeSource).toMatch(/FIPS 206 is not yet published/)
  })
})

describe('benchmarks', () => {
  it('every benchmark figure names a known source', () => {
    for (const a of CONSTRAINED_ALGORITHMS) {
      for (const b of [a.builds.stack, a.builds.speed]) {
        if (!b) continue
        expect(BENCH_SOURCES[b.source], `${a.id}/${b.impl}`).toBeDefined()
        expect(Object.keys(b.ops).length, a.id).toBeGreaterThan(0)
        for (const op of Object.values(b.ops)) {
          expect(op!.stackBytes).toBeGreaterThan(0)
          expect(op!.cycles).toBeGreaterThan(0)
        }
      }
    }
    for (const s of Object.values(BENCH_SOURCES)) {
      expect(s.label).toMatch(/Cortex-M4/)
      expect(s.url).toMatch(/^https:\/\//)
    }
  })

  it('pqm4 figures quote the pinned commit', () => {
    expect(BENCH_SOURCES['pqm4-2025'].url).toContain('90bfb630e53603b4e273a131cd09a025e51540a5')
  })
})
