// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vitest'
import Ajv from 'ajv'
import addFormats from 'ajv-formats'
import bomSchema from './schema/bom-1.7.schema.json'
import spdxSchema from './schema/spdx.schema.json'
import jsfSchema from './schema/jsf-0.82.schema.json'
import registrySchema from './schema/cryptography-defs.schema.json'
import {
  buildCbomDocument,
  extractAllAlgorithmsFromText,
  extractClassicalAlgorithmsFromText,
  type CbomComponentInput,
} from './cycloneDx'
import { summarizeCbom } from './reportSummary'

const ajv = new Ajv({ strict: false, allErrors: true })
addFormats(ajv)
for (const schema of [spdxSchema, jsfSchema, registrySchema]) ajv.addSchema(schema)
const validate = ajv.compile(bomSchema)
const cases: [string, string, string, number | undefined][] = [
  ['RSA-2048 OAEP encryption', 'RSAES-OAEP', 'pke', 2048],
  ['RSA-3072 PSS signature', 'RSASSA-PSS', 'signature', 3072],
  ['RSAES-OAEP', 'RSAES-OAEP', 'pke', undefined],
  ['RSASSA-PSS', 'RSASSA-PSS', 'signature', undefined],
  ['RSAES-PKCS1', 'RSAES-PKCS1', 'pke', undefined],
  ['RSASSA-PKCS1', 'RSASSA-PKCS1', 'signature', undefined],
  ['RSA-2048 PKCS#1 v1.5 encryption', 'RSAES-PKCS1', 'pke', 2048],
  ['RSA-4096 PKCS1 v1.5 signing', 'RSASSA-PKCS1', 'signature', 4096],
  ['RSA-2048 certificate', 'RSA', 'unknown', 2048],
  ['RSA2048', 'RSA', 'unknown', 2048],
  ['RSA', 'RSA', 'unknown', undefined],
  ['RSA-2048 key transport', 'RSA', 'pke', 2048],
  ['RSA-2048 signatures', 'RSA', 'signature', 2048],
  ['RSA-2048 PKCS1', 'RSA', 'unknown', 2048],
  ['RSA-2048 PKCS1 encryption', 'RSA', 'pke', 2048],
  ['RSA-2048 PSS and OAEP', 'RSA', 'unknown', 2048],
  ['RSA-2048 OAEP signing', 'RSA', 'unknown', 2048],
  ['RSA-2048 encryption and signatures', 'RSA', 'unknown', 2048],
  ['RSA-2048 OAEP; RSA-4096 PSS', 'RSA', 'unknown', undefined],
  ['RSA-2048 PSS; RSA-4096 PSS', 'RSA', 'unknown', undefined],
  ['RSA-2048 PSSLIKE OAEPISH', 'RSA', 'unknown', 2048],
  ['RSA-2048/4096 PSS', 'RSA', 'unknown', undefined],
  ['RSA-2048, 3072, 4096 encryption', 'RSA', 'unknown', undefined],
]

describe('RSA declarations retain only source-explicit scheme information', () => {
  it.each(cases)('%s', (text, canonical, primitive, keyLength) => {
    expect(extractClassicalAlgorithmsFromText(text)).toEqual([
      { canonical, primitive, classical: true, ...(keyLength ? { keyLength } : {}) },
    ])
  })

  it.each(cases)(
    'exports schema-valid declarations and matching report labels for %s',
    (text, canonical, primitive, keyLength) => {
      const input: CbomComponentInput = {
        type: 'application',
        name: 'Sample component',
        bomRef: 'sample:component',
        description: text,
        properties: [{ name: 'sample:source', value: text }],
        algorithms: extractAllAlgorithmsFromText(text),
      }
      const doc = JSON.parse(buildCbomDocument([input]).json)
      expect(validate(doc), ajv.errorsText(validate.errors)).toBe(true)
      expect(doc.components[0]).toMatchObject({
        'bom-ref': input.bomRef,
        description: text,
        properties: input.properties,
      })
      const asset = doc.components.find(
        (item: { type: string }) => item.type === 'cryptographic-asset'
      )
      expect(asset.name).toBe(canonical)
      expect(asset.cryptoProperties.algorithmProperties.primitive).toBe(primitive)
      expect(asset.cryptoProperties.algorithmProperties.parameterSetIdentifier).toBe(
        keyLength ? String(keyLength) : undefined
      )
      expect(asset.cryptoProperties.algorithmProperties.cryptoFunctions).toEqual(
        primitive === 'unknown'
          ? ['unknown']
          : primitive === 'pke'
            ? ['encrypt', 'decrypt']
            : ['sign', 'verify']
      )
      const summary = summarizeCbom([input], 'sample')
      expect(summary.algorithms[0].name).toBe(asset.name)
      if (canonical === 'RSA') {
        expect(asset.cryptoProperties.algorithmProperties).not.toHaveProperty('algorithmFamily')
        expect(summary.algorithms[0].standard).toBeUndefined()
        expect(asset.externalReferences).toBeUndefined()
      } else expect(asset.cryptoProperties.algorithmProperties.algorithmFamily).toBe(canonical)
    }
  )

  it('does not attribute another algorithm’s operation to bare RSA', () => {
    const rsa = extractClassicalAlgorithmsFromText('RSA-2048 certificate; ECDSA signatures')[0]
    expect(rsa).toEqual({
      canonical: 'RSA',
      primitive: 'unknown',
      classical: true,
      keyLength: 2048,
    })
  })

  it('does not detect RSA inside an unrelated token', () => {
    expect(extractClassicalAlgorithmsFromText('VERSATILE PSS')).toEqual([])
  })
  it('keeps non-RSA extraction and existing hybrid pairing behavior', () => {
    const text = 'ECDSA P-256; X25519; Ed25519; ML-KEM-768; ML-DSA-65'
    expect(
      extractAllAlgorithmsFromText('RSA-2048; ' + text).filter((a) => a.canonical !== 'RSA')
    ).toEqual(extractAllAlgorithmsFromText(text))
    const hybrid = extractAllAlgorithmsFromText('hybrid RSA-2048 PSS + ML-DSA-65')
    expect(hybrid).toHaveLength(2)
    expect(hybrid[0]).toMatchObject({
      canonical: 'RSASSA-PSS',
      hybridRole: 'classical',
      hybridGroup: 'hybrid-rsassa-pss-ml-dsa',
    })
    expect(hybrid[1]).toMatchObject({
      canonical: 'ML-DSA',
      hybridRole: 'post-quantum',
      hybridGroup: hybrid[0].hybridGroup,
    })
  })
})
