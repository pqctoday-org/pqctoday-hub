// SPDX-License-Identifier: AGPL-3.0-only
/**
 * A component that carries a related resource (a test suite, SDK, source
 * repository, documentation or issue tracker) as an external reference, and a
 * certificate that records what it covers, still validates against the official
 * CycloneDX 1.7 JSON Schema (vendored under ./schema).
 */
import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import Ajv from 'ajv'
import addFormats from 'ajv-formats'
import { buildCbomDocument } from './cycloneDx'
import {
  RELATED_RESOURCE_KINDS,
  buildRelatedResource,
  relatedResourceCbomReference,
} from '@/data/relatedResources'

function loadSchema(name: string): Record<string, unknown> {
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- fixed vendored schema set
  return JSON.parse(readFileSync(resolve(process.cwd(), 'src/services/cbom/schema', name), 'utf8'))
}

const ajv = new Ajv({ strict: false, allErrors: true })
addFormats(ajv)
ajv.addSchema(loadSchema('spdx.schema.json'))
ajv.addSchema(loadSchema('jsf-0.82.schema.json'))
ajv.addSchema(loadSchema('cryptography-defs.schema.json'))
const validateBom = ajv.compile(loadSchema('bom-1.7.schema.json'))

describe('CBOM schema validity of related resources', () => {
  it.each(RELATED_RESOURCE_KINDS)('a %s reference is a valid external reference', (kind) => {
    const resource = buildRelatedResource('https://example.com/project', kind)!
    const { json } = buildCbomDocument(
      [
        {
          type: 'library',
          name: 'Fixture',
          bomRef: 'fixture',
          externalReferences: [relatedResourceCbomReference(resource)],
          certifications: [
            {
              certType: 'FIPS 140-3',
              certId: '5266',
              certLink: 'https://example.com/5266',
              covers: 'MX series, Junos OS 22.3R1',
              relationship: 'earlier_release',
            },
          ],
        },
      ],
      { toolName: 'Schema Test' }
    )
    const valid = validateBom(JSON.parse(json)) as boolean
    expect(valid ? '' : ajv.errorsText(validateBom.errors, { separator: '\n' })).toBe('')
    expect(valid).toBe(true)
  })
})
