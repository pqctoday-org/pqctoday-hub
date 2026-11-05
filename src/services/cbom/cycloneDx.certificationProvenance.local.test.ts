// SPDX-License-Identifier: AGPL-3.0-only
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import Ajv from 'ajv'
import addFormats from 'ajv-formats'
import { describe, expect, it } from 'vitest'
import { buildCbomDocument, type CbomComponentInput } from './cycloneDx'
import { buildAssessmentCbom } from './assessmentCbom'
import {
  libraryToCbomInput,
  hsmToCbomInput,
} from '@/components/PKILearning/modules/CryptoMgmtModernization/workshop/cbomAdapters'
import { CRYPTO_LIBRARIES } from '@/components/PKILearning/modules/CryptoMgmtModernization/data/cryptoLibraries'
import { HSM_VENDORS } from '@/components/PKILearning/modules/CryptoMgmtModernization/data/hsmVendors'

const schema = (name: string) =>
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- fixed vendored schema filenames below
  JSON.parse(readFileSync(resolve('src/services/cbom/schema', name), 'utf8'))
const ajv = new Ajv({ strict: false, allErrors: true })
addFormats(ajv)
for (const name of ['spdx.schema.json', 'jsf-0.82.schema.json', 'cryptography-defs.schema.json'])
  ajv.addSchema(schema(name))
const validate = ajv.compile(schema('bom-1.7.schema.json'))
const parseValid = (json: string) => {
  const doc = JSON.parse(json)
  expect(validate(doc), ajv.errorsText(validate.errors)).toBe(true)
  return doc
}

describe('certificate association is not CPE identity evidence', () => {
  it.each([undefined, 'cpe:2.3:a:sample:family:*:*:*:*:*:*:*:*'])(
    'retains linkless/duplicate records with CPE %s without invented confidence',
    (cpe) => {
      const records = Object.freeze([
        Object.freeze({ certType: 'Sample "CMVP", 雪\nline', certId: 'same-id', certLink: '' }),
        Object.freeze({
          certType: 'Sample CAVP',
          certId: 'same-id',
          certLink: 'https://example.invalid/cert',
        }),
        Object.freeze({
          certType: 'Sample CAVP',
          certId: 'same-id',
          certLink: 'https://example.invalid/cert',
        }),
      ])
      const properties = Object.freeze([
        Object.freeze({ name: 'pqctoday:sample', value: '原文\n"quoted"' }),
      ])
      const input: CbomComponentInput = {
        type: 'library',
        name: 'Sample',
        bomRef: 'sample',
        cpe,
        properties: properties as unknown as CbomComponentInput['properties'],
        certifications: records as unknown as CbomComponentInput['certifications'],
      }
      const before = JSON.stringify(input)
      const parent = parseValid(buildCbomDocument([input]).json).components[0]
      expect(parent.evidence).toBeUndefined()
      expect(
        JSON.parse(
          parent.properties.find(
            (p: { name: string }) => p.name === 'pqctoday:certificateReferences'
          ).value
        )
      ).toEqual(records)
      expect(parent.externalReferences).toEqual([
        {
          type: 'certification-report',
          url: 'https://example.invalid/cert',
          comment: 'Sample CAVP',
        },
        {
          type: 'certification-report',
          url: 'https://example.invalid/cert',
          comment: 'Sample CAVP',
        },
      ])
      expect(JSON.stringify(input)).toBe(before)
      expect(parseValid(buildCbomDocument([input]).json).components[0].properties).toHaveLength(2)
    }
  )

  it('keeps unrelated library/HSM/assessment outputs structurally compatible without synthetic attestations', () => {
    const lib = CRYPTO_LIBRARIES.find((x) => x.cmvpCertNumber)!
    const hsm = HSM_VENDORS.find((x) => x.cmvpCertNumber)!
    const doc = parseValid(buildCbomDocument([libraryToCbomInput(lib), hsmToCbomInput(hsm)]).json)
    const parents = doc.components.filter((c: { type: string }) => c.type !== 'cryptographic-asset')
    expect(parents).toHaveLength(2)
    for (const parent of parents) {
      expect(parent.evidence).toBeUndefined()
      expect(
        parent.properties.some((p: { name: string }) => p.name === 'pqctoday:certificateReferences')
      ).toBe(true)
    }
    expect(parseValid(buildAssessmentCbom([]).json).components).toEqual([])
    const assessment = parseValid(
      buildAssessmentCbom([{ storedKey: 'RSA-2048', classical: 'RSA', keySize: '2048-bit' }]).json
    )
    expect(assessment.components.every((c: { evidence?: unknown }) => !c.evidence)).toBe(true)
  })
})
