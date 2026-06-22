// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import {
  buildCbomDocument,
  extractPqcAlgorithmsFromText,
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

  it('emits a schema-valid CycloneDX 1.6 envelope', () => {
    const { json, componentCount, cryptoAssetCount } = buildCbomDocument([libWithAlgos])
    const doc = JSON.parse(json)

    expect(doc.bomFormat).toBe('CycloneDX')
    expect(doc.specVersion).toBe('1.6')
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
      // every cryptographic-asset MUST have cryptoProperties.assetType per the 1.6 schema
      expect(a.cryptoProperties).toBeDefined()
      expect(a.cryptoProperties.assetType).toBe('algorithm')
      expect(a.cryptoProperties.algorithmProperties.primitive).toMatch(/kem|signature/)
    }
    // KEM functions vs signature functions are classified correctly
    const kem = cryptoAssets.find((a: { name: string }) => a.name === 'ML-KEM')
    expect(kem.cryptoProperties.algorithmProperties.cryptoFunctions).toEqual([
      'encapsulate',
      'decapsulate',
    ])
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
