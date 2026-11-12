// SPDX-License-Identifier: AGPL-3.0-only
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import Ajv from 'ajv'
import addFormats from 'ajv-formats'
import bomSchema from '@/services/cbom/schema/bom-1.7.schema.json'
import spdxSchema from '@/services/cbom/schema/spdx.schema.json'
import jsfSchema from '@/services/cbom/schema/jsf-0.82.schema.json'
import registrySchema from '@/services/cbom/schema/cryptography-defs.schema.json'
import { SAMPLE_INVENTORY } from '@/data/cryptoEstate'
import { FormatChooser } from './FormatChooser'

const ajv = new Ajv({ strict: false, allErrors: true })
addFormats(ajv)
// Draft-7 format assertions are optional; these two unsupported formats remain annotations.
// This test checks structural constraints and supported formats, not IRI/IDN syntax.
ajv.addFormat('iri-reference', true)
ajv.addFormat('idn-email', true)
for (const schema of [spdxSchema, jsfSchema, registrySchema]) ajv.addSchema(schema)
const validate = ajv.compile(bomSchema)

function displayedBom() {
  const text = screen.getByText(
    (text) => text.startsWith('{') && (text.includes('"bomFormat"') || text.includes('"bom-ref"'))
  )
  return JSON.parse(text.textContent!)
}

describe('CycloneDX 1.7 sample asset identity and schema', () => {
  it('renders each selected asset as a complete schema-valid BOM with separately linked key and algorithm facts', () => {
    render(<FormatChooser />)
    const samples = SAMPLE_INVENTORY.filter((asset) => asset.spki).slice(0, 4)
    for (const asset of samples) {
      fireEvent.click(screen.getByRole('button', { name: asset.name.split(' ')[0] }))
      const bom = displayedBom()
      expect(validate(bom), JSON.stringify(validate.errors)).toBe(true)
      expect(bom).toMatchObject({ bomFormat: 'CycloneDX', specVersion: '1.7', version: 1 })
      const source = bom.components.find(
        (component: { 'bom-ref': string }) => component['bom-ref'] === asset.id
      )
      const key = bom.components.find(
        (component: { cryptoProperties?: { assetType: string } }) =>
          component.cryptoProperties?.assetType === 'related-crypto-material'
      )
      const algorithm = bom.components.find(
        (component: { cryptoProperties?: { assetType: string } }) =>
          component.cryptoProperties?.assetType === 'algorithm'
      )
      expect(source.name).toBe(asset.name)
      expect(source.properties).toContainEqual({
        name: 'observedAlgorithmLabel',
        value: asset.currentAlgorithm,
      })
      expect(key.cryptoProperties.relatedCryptoMaterialProperties.type).toBe('public-key')
      expect(key.properties).toContainEqual({ name: 'spkiFingerprint', value: asset.spki })
      expect(key.cryptoProperties.algorithmProperties).toBeUndefined()
      expect(
        key.cryptoProperties.relatedCryptoMaterialProperties.relatedCryptographicAssets
      ).toContainEqual({ type: 'algorithm', ref: algorithm['bom-ref'] })
      if (asset.class === 'certificates') {
        expect(source.cryptoProperties.assetType).toBe('certificate')
        expect(source.cryptoProperties.algorithmProperties).toBeUndefined()
        expect(
          source.cryptoProperties.certificateProperties.relatedCryptographicAssets
        ).toContainEqual({ type: 'publicKey', ref: key['bom-ref'] })
        expect(source.cryptoProperties.certificateProperties.subjectName).toBeUndefined()
      } else {
        expect(source.type).toBe('application')
        expect(bom.dependencies).toContainEqual({ ref: asset.id, dependsOn: [key['bom-ref']] })
      }
      if (asset.registryKey?.startsWith('RSA-')) {
        expect(algorithm.cryptoProperties.algorithmProperties).toEqual({
          primitive: 'unknown',
          nistQuantumSecurityLevel: 0,
          parameterSetIdentifier: asset.registryKey.slice(4),
        })
        expect(key.cryptoProperties.relatedCryptoMaterialProperties.size).toBe(
          Number(asset.registryKey.slice(4))
        )
        expect(JSON.stringify(bom)).not.toContain('ECDSA')
      } else {
        expect(algorithm.cryptoProperties.algorithmProperties).toMatchObject({
          algorithmFamily: 'ECDSA',
          primitive: 'signature',
          ellipticCurve: 'nist/P-256',
        })
        expect(key.cryptoProperties.relatedCryptoMaterialProperties.size).toBeUndefined()
      }
      expect(JSON.stringify(bom)).not.toMatch(/1\.2\.840\.10045\.4\.3\.2|RSASSA/)
      expect(algorithm.cryptoProperties.algorithmProperties.nistQuantumSecurityLevel).toBe(0)
      expect(algorithm.cryptoProperties.oid).toBeUndefined()
    }
  })
  it('independently rejects malformed type and additional properties using the advertised schema', () => {
    render(<FormatChooser />)
    const bom = displayedBom()
    expect(validate(bom)).toBe(true)
    bom.components[0].cryptoProperties.assetType = 'invented-certificate'
    expect(validate(bom)).toBe(false)
    bom.components[0].cryptoProperties.assetType = 'certificate'
    bom.components[0].cryptoProperties.invented = true
    expect(validate(bom)).toBe(false)
    delete bom.components[0].cryptoProperties.invented
    bom.specVersion = 17
    expect(validate(bom)).toBe(false)
  })
})
