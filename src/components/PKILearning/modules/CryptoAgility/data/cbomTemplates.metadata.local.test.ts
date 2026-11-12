// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vitest'
import Ajv from 'ajv'
import addFormats from 'ajv-formats'
import bomSchema from '@/services/cbom/schema/bom-1.7.schema.json'
import spdxSchema from '@/services/cbom/schema/spdx.schema.json'
import jsfSchema from '@/services/cbom/schema/jsf-0.82.schema.json'
import registrySchema from '@/services/cbom/schema/cryptography-defs.schema.json'
import { CBOM_CYCLONEDX_SAMPLE, SAMPLE_CBOM } from './cbomTemplates'

const ajv = new Ajv({ strict: false, allErrors: true })
addFormats(ajv)
for (const schema of [spdxSchema, jsfSchema, registrySchema]) ajv.addSchema(schema)
const validate = ajv.compile(bomSchema)
const asset = (name: string) => {
  const found = CBOM_CYCLONEDX_SAMPLE.components.find((entry) => entry.name === name)
  expect(found, `Sample asset ${name} must remain available`).toBeDefined()
  return found!.cryptoProperties
}

describe('CBOM sample registered identities and security references', () => {
  it('provides the complete fictional inventory as schema-valid CycloneDX 1.7', () => {
    expect(CBOM_CYCLONEDX_SAMPLE.specVersion).toBe('1.7')
    expect(CBOM_CYCLONEDX_SAMPLE.components).toHaveLength(SAMPLE_CBOM.length)
    expect(validate(CBOM_CYCLONEDX_SAMPLE), ajv.errorsText(validate.errors)).toBe(true)
  })

  it('identifies AES-256-XTS rather than the separately registered ECB mode', () => {
    // OpenSSL 3.5 objects.txt: IEEE SISWG 0.1.2; NIST CSOR aes.41 is ECB.
    const xts = asset('AES-256-XTS Full-Disk Encryption')
    expect(xts.oid).toBe('1.3.111.2.1619.0.1.2')
    expect(xts.oid).not.toBe('2.16.840.1.101.3.4.1.41')
    // XTS has no dedicated value in the unchanged CycloneDX 1.7 mode enum.
    expect(xts.algorithmProperties.mode).toBe('other')
    expect(asset('AES-256-GCM Session Cipher').oid).toBe('2.16.840.1.101.3.4.1.46')
    expect(asset('AES-256-CBC Database TDE').oid).toBe('2.16.840.1.101.3.4.1.42')
  })

  it('identifies ECDH and retains P-384 as separate curve metadata', () => {
    // RFC 5480 sections 2.1.1.1 and 2.1.2: named curve and id-ecDH differ.
    const ecdh = asset('ECDH P-384 IPsec Key Exchange')
    expect(ecdh.oid).toBe('1.3.132.1.12')
    expect(ecdh.oid).not.toBe('1.3.132.0.34')
    expect(ecdh.algorithmProperties).toMatchObject({
      primitive: 'key-agree',
      parameterSetIdentifier: 'P-384',
      ellipticCurve: 'nist/P-384',
    })
  })

  it('uses the AES-256 key-search reference category for every AES-256 sample', () => {
    // NIST PQC evaluation criteria section 4.A.5, reference category 5.
    const aes = CBOM_CYCLONEDX_SAMPLE.components.filter((c) => c.name.startsWith('AES-256-'))
    expect(aes).toHaveLength(4)
    for (const entry of aes) {
      expect(entry.cryptoProperties.algorithmProperties).toMatchObject({
        parameterSetIdentifier: '256',
        classicalSecurityLevel: 256,
        nistQuantumSecurityLevel: 5,
      })
    }
  })

  it('uses the SHA-256 collision reference rather than halving its digest length', () => {
    // NIST PQC evaluation criteria section 4.A.5, reference category 2.
    expect(asset('SHA-256 File Integrity').algorithmProperties).toMatchObject({
      primitive: 'hash',
      parameterSetIdentifier: '256',
      classicalSecurityLevel: 128,
      nistQuantumSecurityLevel: 2,
    })
  })
  it('keeps the reference interpretation with copied JSON and separates the curve OID', () => {
    const copy = JSON.parse(JSON.stringify(CBOM_CYCLONEDX_SAMPLE))
    for (const entry of copy.components) {
      if (entry.name.startsWith('AES-256-')) {
        expect(entry.properties).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              name: 'pqc-today:security-reference',
              value: expect.stringContaining('AES-256 key-search reference'),
            }),
          ])
        )
      }
    }
    expect(
      copy.components.find((entry: { name: string }) => entry.name === 'SHA-256 File Integrity')
        .properties
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          value: expect.stringContaining('SHA-256 collision-search reference'),
        }),
      ])
    )
    expect(
      copy.components.find(
        (entry: { name: string }) => entry.name === 'ECDH P-384 IPsec Key Exchange'
      ).properties
    ).toContainEqual({ name: 'pqc-today:curve-oid', value: '1.3.132.0.34' })
  })
})
