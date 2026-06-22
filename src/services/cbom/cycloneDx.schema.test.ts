// SPDX-License-Identifier: GPL-3.0-only
/**
 * Validates the emitter's output against the OFFICIAL CycloneDX 1.6 JSON Schema
 * (vendored under ./schema). This is the airtight check behind the structural
 * tests in cycloneDx.test.ts — it catches any real schema violation (missing
 * required fields, bad enums, malformed evidence) the hand-written assertions
 * might miss.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import Ajv from 'ajv'
import addFormats from 'ajv-formats'
import { buildCbomDocument, type CbomComponentInput } from './cycloneDx'
import { CRYPTO_LIBRARIES } from '@/components/PKILearning/modules/CryptoMgmtModernization/data/cryptoLibraries'
import { HSM_VENDORS } from '@/components/PKILearning/modules/CryptoMgmtModernization/data/hsmVendors'
import { FILE_ARTIFACTS } from '@/components/PKILearning/modules/CryptoMgmtModernization/data/fileArtifacts'
import {
  libraryToCbomInput,
  hsmToCbomInput,
  fileArtifactToCbomInput,
} from '@/components/PKILearning/modules/CryptoMgmtModernization/workshop/cbomAdapters'

function loadSchema(name: string): Record<string, unknown> {
  // vitest runs from the project root; load the vendored schemas relative to it.
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- fixed vendored schema set
  return JSON.parse(readFileSync(resolve(process.cwd(), 'src/services/cbom/schema', name), 'utf8'))
}

// draft-07 schema set; strict:false so CycloneDX's own meta-keywords don't trip
// ajv's strict mode. spdx + jsf are referenced by the bom schema via relative $ref.
const ajv = new Ajv({ strict: false, allErrors: true })
addFormats(ajv)
ajv.addSchema(loadSchema('spdx.schema.json'))
ajv.addSchema(loadSchema('jsf-0.82.schema.json'))
const validateBom = ajv.compile(loadSchema('bom-1.6.schema.json'))

function validateCbom(json: string): { valid: boolean; errors: string } {
  const valid = validateBom(JSON.parse(json)) as boolean
  return { valid, errors: valid ? '' : ajv.errorsText(validateBom.errors, { separator: '\n' }) }
}

describe('CycloneDX 1.6 — official JSON Schema validation', () => {
  it('validates a CBOM built from every real catalog row (libraries + HSMs + files)', () => {
    const inputs = [
      ...CRYPTO_LIBRARIES.map(libraryToCbomInput),
      ...HSM_VENDORS.map(hsmToCbomInput),
      ...FILE_ARTIFACTS.map(fileArtifactToCbomInput),
    ]
    const { valid, errors } = validateCbom(
      buildCbomDocument(inputs, { toolName: 'Schema Test' }).json
    )
    expect(errors).toBe('') // surfaces the exact schema path on failure
    expect(valid).toBe(true)
  })

  it('validates a component exercising certifications (evidence + externalReferences) and crypto-assets', () => {
    const input: CbomComponentInput = {
      type: 'library',
      name: 'OpenSSL',
      bomRef: 'pkg:openssl-3.5',
      version: '3.5.0',
      cpe: 'cpe:2.3:a:openssl:openssl:3.5.0:*:*:*:*:*:*:*',
      purl: 'pkg:generic/openssl@3.5.0',
      properties: [{ name: 'pqctoday:posture', value: 'green' }],
      certifications: [
        { certType: 'FIPS 140-3', certId: '#4985', certLink: 'https://csrc.nist.gov/x' },
      ],
      algorithms: [
        { canonical: 'ML-KEM', primitive: 'kem' },
        { canonical: 'ML-DSA', primitive: 'signature' },
      ],
    }
    const { valid, errors } = validateCbom(buildCbomDocument([input]).json)
    expect(errors).toBe('')
    expect(valid).toBe(true)
  })

  it('validates a device + file component (HSM / file-artifact shapes)', () => {
    const { valid, errors } = validateCbom(
      buildCbomDocument([
        ...HSM_VENDORS.slice(0, 1).map(hsmToCbomInput),
        ...FILE_ARTIFACTS.slice(0, 1).map(fileArtifactToCbomInput),
      ]).json
    )
    expect(errors).toBe('')
    expect(valid).toBe(true)
  })

  it('validates the empty-inventory CBOM', () => {
    const { valid, errors } = validateCbom(buildCbomDocument([]).json)
    expect(errors).toBe('')
    expect(valid).toBe(true)
  })
})
