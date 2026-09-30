// SPDX-License-Identifier: GPL-3.0-only
// Validates the committed complete SBOM (public/data/pqctoday-sbom.cdx.json) against the official
// CycloneDX 1.7 JSON Schema vendored for the CBOM (src/services/cbom/schema), and the license
// mapping that produces it. A structurally invalid SBOM is worse than none for anyone who
// feeds it to a scanner.
import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import Ajv from 'ajv'
import addFormats from 'ajv-formats'
import { cdxLicense, npmPurl, integrityHash } from './cyclonedx'

const load = (rel: string): Record<string, unknown> =>
  JSON.parse(readFileSync(resolve(process.cwd(), rel), 'utf8'))

const ajv = new Ajv({ strict: false, allErrors: true })
addFormats(ajv)
for (const s of ['spdx.schema.json', 'jsf-0.82.schema.json', 'cryptography-defs.schema.json'])
  ajv.addSchema(load(`src/services/cbom/schema/${s}`))
const validate = ajv.compile(load('src/services/cbom/schema/bom-1.7.schema.json'))

describe('complete SBOM file', () => {
  it('is valid CycloneDX 1.7 and describes the application', () => {
    const doc = load('public/data/pqctoday-sbom.cdx.json') as {
      components: { name: string; type: string }[]
      metadata: { component: { name: string } }
    }
    const ok = validate(doc) as boolean
    expect(ajv.errorsText(validate.errors, { separator: '\n' }), 'schema errors').toBe('No errors')
    expect(ok).toBe(true)
    expect(doc.metadata.component.name).toBe('pqctoday-hub')
    expect(doc.components.length).toBeGreaterThan(300)
    expect(new Set(doc.components.map((c) => c.type))).toEqual(
      new Set(['library', 'application', 'data', 'machine-learning-model'])
    )
  })
})

describe('license mapping', () => {
  it('maps SPDX ids, dual licenses and free text to valid CycloneDX license choices', () => {
    expect(cdxLicense('MIT')).toEqual([{ license: { id: 'MIT' } }])
    expect(cdxLicense('Apache-2.0 / MIT')).toEqual([{ expression: 'Apache-2.0 OR MIT' }])
    expect(cdxLicense('(MIT OR GPL-3.0-or-later)')).toEqual([
      { expression: '(MIT OR GPL-3.0-or-later)' },
    ])
    expect(cdxLicense('BSD-style (OpenSSH LICENCE)')).toEqual([
      { license: { name: 'BSD-style (OpenSSH LICENCE)' } },
    ])
    expect(cdxLicense('not recorded')).toEqual([{ license: { name: 'not recorded' } }])
    // A package's own non-SPDX text must not be passed off as an SPDX expression.
    expect(cdxLicense('MIT OR SEE LICENSE IN FEEL-FREE.md')).toEqual([
      { license: { name: 'MIT OR SEE LICENSE IN FEEL-FREE.md' } },
    ])
  })

  it('builds purls and integrity hashes', () => {
    expect(npmPurl('@scope/pkg', '1.2.3')).toBe('pkg:npm/%40scope/pkg@1.2.3')
    expect(npmPurl('left-pad', '1.0.0')).toBe('pkg:npm/left-pad@1.0.0')
    expect(integrityHash('sha512-AAAA')).toEqual({ alg: 'SHA-512', content: '000000' })
    expect(integrityHash(undefined)).toBeUndefined()
    expect(integrityHash('sha1-xyz')).toBeUndefined()
  })
})
