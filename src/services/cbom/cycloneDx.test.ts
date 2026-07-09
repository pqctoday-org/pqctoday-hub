// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import {
  buildCbomDocument,
  extractPqcAlgorithmsFromText,
  extractClassicalAlgorithmsFromText,
  extractAllAlgorithmsFromText,
  pairHybridAlgorithms,
  standardsFor,
  cbomBomRef,
  type CbomComponentInput,
} from './cycloneDx'

describe('extractPqcAlgorithmsFromText', () => {
  it('lifts distinct canonical PQC algorithms from free text', () => {
    const algos = extractPqcAlgorithmsFromText('ML-KEM-768 key exchange + ML-DSA-65 signatures')
    expect(algos.map((a) => a.canonical)).toEqual(expect.arrayContaining(['ML-KEM', 'ML-DSA']))
    // primitives are classified
    expect(algos.find((a) => a.canonical === 'ML-KEM')?.primitive).toBe('kem')
    expect(algos.find((a) => a.canonical === 'ML-DSA')?.primitive).toBe('signature')
  })

  it('returns an empty list for classical-only text', () => {
    expect(extractPqcAlgorithmsFromText('RSA-2048, ECDSA P-256')).toEqual([])
    expect(extractPqcAlgorithmsFromText('')).toEqual([])
  })

  // 07092026: legacy NIST round-3 code names are reported under their
  // published standard name, not the code name — verified against the vendored
  // Cryptography Registry. Falcon/BIKE/HQC/FrodoKEM keep their own name: none
  // has a published standard yet.
  it('remaps legacy pre-standardization code names to their published standard name', () => {
    expect(extractPqcAlgorithmsFromText('Kyber-768')[0].canonical).toBe('ML-KEM')
    expect(extractPqcAlgorithmsFromText('Dilithium-3')[0].canonical).toBe('ML-DSA')
    expect(extractPqcAlgorithmsFromText('SPHINCS+-128s')[0].canonical).toBe('SLH-DSA')
  })

  it('does NOT remap algorithms with no published standard yet', () => {
    expect(extractPqcAlgorithmsFromText('Falcon-512')[0].canonical).toBe('Falcon')
    expect(extractPqcAlgorithmsFromText('BIKE-L1')[0].canonical).toBe('BIKE')
    expect(extractPqcAlgorithmsFromText('HQC-128')[0].canonical).toBe('HQC')
    expect(extractPqcAlgorithmsFromText('FrodoKEM-640')[0].canonical).toBe('FrodoKEM')
  })

  it('XMSS is already its own standard name — no remap, no duplicate detection', () => {
    const algos = extractPqcAlgorithmsFromText('XMSS-SHA2_10_256')
    expect(algos).toHaveLength(1)
    expect(algos[0].canonical).toBe('XMSS')
  })
})

describe('standardsFor (Cryptography Registry lookup)', () => {
  it('returns a real FIPS citation for a standardized PQC family', () => {
    const std = standardsFor('ML-KEM')
    expect(std.length).toBeGreaterThan(0)
    expect(std.some((s) => s.name === 'FIPS203')).toBe(true)
    expect(std[0].url).toMatch(/^https:\/\//)
  })

  it('returns no citation for a family with no published standard (never fabricates one)', () => {
    expect(standardsFor('Falcon')).toEqual([])
    expect(standardsFor('BIKE')).toEqual([])
    expect(standardsFor('HQC')).toEqual([])
    expect(standardsFor('FrodoKEM')).toEqual([])
  })

  it('returns real citations for classical families too', () => {
    expect(standardsFor('ECDSA').some((s) => s.name === 'FIPS186-4')).toBe(true)
    expect(standardsFor('EdDSA').some((s) => s.name === 'RFC8032')).toBe(true)
  })
})

describe('extractClassicalAlgorithmsFromText', () => {
  it('detects RSA with key length, defaulting to signing unless encryption is named', () => {
    const signing = extractClassicalAlgorithmsFromText('RSA-2048 certificate')
    expect(signing[0]).toMatchObject({
      canonical: 'RSASSA-PKCS1',
      primitive: 'signature',
      keyLength: 2048,
      classical: true,
    })

    const enc = extractClassicalAlgorithmsFromText('RSA-2048 key exchange')
    expect(enc[0]).toMatchObject({ canonical: 'RSAES-PKCS1', primitive: 'pke' })
  })

  it('detects ECDSA with a namespaced curve identifier', () => {
    const algos = extractClassicalAlgorithmsFromText('ECDSA P-256 signatures')
    expect(algos[0]).toMatchObject({
      canonical: 'ECDSA',
      primitive: 'signature',
      ellipticCurve: 'nist/P-256',
    })
  })

  it('detects ECDH and folds X25519/X448 into the same family per the registry', () => {
    expect(extractClassicalAlgorithmsFromText('ECDH P-384')[0]).toMatchObject({
      canonical: 'ECDH',
      primitive: 'key-agree',
      ellipticCurve: 'nist/P-384',
    })
    expect(extractClassicalAlgorithmsFromText('X25519 key exchange')[0]).toMatchObject({
      canonical: 'ECDH',
      ellipticCurve: 'other/Curve25519',
    })
  })

  it('detects EdDSA (Ed25519/Ed448)', () => {
    expect(extractClassicalAlgorithmsFromText('Ed25519 signatures')[0]).toMatchObject({
      canonical: 'EdDSA',
      ellipticCurve: 'other/Ed25519',
    })
  })

  it('returns an empty list for PQC-only or empty text', () => {
    expect(extractClassicalAlgorithmsFromText('ML-KEM-768')).toEqual([])
    expect(extractClassicalAlgorithmsFromText('')).toEqual([])
  })
})

describe('pairHybridAlgorithms / extractAllAlgorithmsFromText', () => {
  it('links a classical + PQC pair when the text uses a "+" join', () => {
    const algos = extractAllAlgorithmsFromText('TLS 1.3 hybrid X25519+ML-KEM-768')
    const classical = algos.find((a) => a.canonical === 'ECDH')
    const pqc = algos.find((a) => a.canonical === 'ML-KEM')
    expect(classical?.hybridGroup).toBeTruthy()
    expect(classical?.hybridGroup).toBe(pqc?.hybridGroup)
    expect(classical?.hybridRole).toBe('classical')
    expect(pqc?.hybridRole).toBe('post-quantum')
  })

  it('does not link when only one of classical/PQC is present', () => {
    const algos = extractAllAlgorithmsFromText('ML-KEM-768 only')
    expect(algos.every((a) => !a.hybridGroup)).toBe(true)
  })

  it('does not link classical+PQC mentioned separately with no pairing signal', () => {
    const result = pairHybridAlgorithms(
      'supports both RSA-2048 and ML-KEM-768 independently, unrelated features',
      extractClassicalAlgorithmsFromText('RSA-2048'),
      extractPqcAlgorithmsFromText('ML-KEM-768')
    )
    expect(result.classical[0].hybridGroup).toBeUndefined()
    expect(result.pqc[0].hybridGroup).toBeUndefined()
  })
})

describe('buildCbomDocument', () => {
  const libWithAlgos: CbomComponentInput = {
    type: 'library',
    name: 'OpenSSL',
    bomRef: cbomBomRef('OpenSSL', 'openssl-3.5'),
    version: '3.5.0',
    properties: [{ name: 'pqctoday:posture', value: 'green' }],
    certifications: [{ certType: 'FIPS 140-3 CMVP', certId: '#4985', certLink: 'https://x' }],
    algorithms: [
      { canonical: 'ML-KEM', primitive: 'kem' },
      { canonical: 'ML-DSA', primitive: 'signature' },
    ],
  }

  it('emits a schema-valid CycloneDX 1.7 envelope', () => {
    const { json, componentCount, cryptoAssetCount } = buildCbomDocument([libWithAlgos])
    const doc = JSON.parse(json)

    expect(doc.bomFormat).toBe('CycloneDX')
    expect(doc.specVersion).toBe('1.7')
    expect(doc.serialNumber).toMatch(/^urn:uuid:/)
    expect(componentCount).toBe(1)
    expect(cryptoAssetCount).toBe(2)
  })

  it('emits cryptographic-asset children that carry cryptoProperties (the previously-missing part)', () => {
    const doc = JSON.parse(buildCbomDocument([libWithAlgos]).json)
    const cryptoAssets = doc.components.filter(
      (c: { type: string }) => c.type === 'cryptographic-asset'
    )
    expect(cryptoAssets).toHaveLength(2)
    for (const a of cryptoAssets) {
      // every cryptographic-asset MUST have cryptoProperties.assetType per the schema
      expect(a.cryptoProperties).toBeDefined()
      expect(a.cryptoProperties.assetType).toBe('algorithm')
      expect(a.cryptoProperties.algorithmProperties.primitive).toMatch(/kem|signature/)
      // algorithmFamily (new in 1.7) matches the algorithm's canonical name
      expect(a.cryptoProperties.algorithmProperties.algorithmFamily).toBe(a.name)
    }
    // KEM functions vs signature functions are classified correctly
    const kem = cryptoAssets.find((a: { name: string }) => a.name === 'ML-KEM')
    expect(kem.cryptoProperties.algorithmProperties.cryptoFunctions).toEqual([
      'encapsulate',
      'decapsulate',
    ])
  })

  it('cites the real standard for a PQC algorithm and fabricates none for an unpublished one', () => {
    const doc = JSON.parse(
      buildCbomDocument([
        {
          type: 'library',
          name: 'Test',
          bomRef: 'pkg:test',
          algorithms: [
            { canonical: 'ML-KEM', primitive: 'kem' },
            { canonical: 'Falcon', primitive: 'signature' },
          ],
        },
      ]).json
    )
    const mlkem = doc.components.find((c: { name: string }) => c.name === 'ML-KEM')
    const falcon = doc.components.find((c: { name: string }) => c.name === 'Falcon')
    expect(mlkem.externalReferences.some((r: { comment: string }) => r.comment === 'FIPS203')).toBe(
      true
    )
    expect(falcon.externalReferences).toBeUndefined()
  })

  it('tags classical algorithms as quantum-vulnerable and PQC algorithms as not', () => {
    const doc = JSON.parse(
      buildCbomDocument([
        {
          type: 'library',
          name: 'Test',
          bomRef: 'pkg:test',
          algorithms: [
            { canonical: 'RSASSA-PKCS1', primitive: 'signature', classical: true },
            { canonical: 'ML-KEM', primitive: 'kem' },
          ],
        },
      ]).json
    )
    const rsa = doc.components.find((c: { name: string }) => c.name === 'RSASSA-PKCS1')
    const mlkem = doc.components.find((c: { name: string }) => c.name === 'ML-KEM')
    expect(rsa.properties).toContainEqual({ name: 'pqctoday:quantumVulnerable', value: 'true' })
    expect(
      mlkem.properties.some((p: { name: string }) => p.name === 'pqctoday:quantumVulnerable')
    ).toBe(false)
  })

  it('emits linked hybridGroup/hybridRole properties for a paired hybrid algorithm', () => {
    const groupId = 'hybrid-ecdh-ml-kem'
    const doc = JSON.parse(
      buildCbomDocument([
        {
          type: 'library',
          name: 'Test',
          bomRef: 'pkg:test',
          algorithms: [
            {
              canonical: 'ECDH',
              primitive: 'key-agree',
              classical: true,
              hybridGroup: groupId,
              hybridRole: 'classical',
            },
            {
              canonical: 'ML-KEM',
              primitive: 'kem',
              hybridGroup: groupId,
              hybridRole: 'post-quantum',
            },
          ],
        },
      ]).json
    )
    for (const c of doc.components.filter(
      (c: { type: string }) => c.type === 'cryptographic-asset'
    )) {
      expect(c.properties).toContainEqual({ name: 'pqctoday:hybridGroup', value: groupId })
    }
  })

  it('surfaces certifications as component evidence + external references', () => {
    const doc = JSON.parse(buildCbomDocument([libWithAlgos]).json)
    const lib = doc.components.find((c: { type: string }) => c.type === 'library')
    expect(lib.evidence.identity[0].methods[0].technique).toBe('attestation')
    expect(lib.externalReferences[0].type).toBe('certification-report')
  })

  it('passes through tool name + metadata properties', () => {
    const doc = JSON.parse(
      buildCbomDocument([libWithAlgos], {
        toolName: 'Unit Test CBOM',
        properties: [{ name: 'k', value: 'v' }],
      }).json
    )
    expect(doc.metadata.tools[0].name).toBe('Unit Test CBOM')
    expect(doc.metadata.properties).toContainEqual({ name: 'k', value: 'v' })
  })

  it('emits an empty components array for no inputs', () => {
    const { json, componentCount } = buildCbomDocument([])
    expect(JSON.parse(json).components).toEqual([])
    expect(componentCount).toBe(0)
  })
})
