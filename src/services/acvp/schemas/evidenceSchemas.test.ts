// SPDX-License-Identifier: AGPL-3.0-only
// Versioned evidence schemas: a frozen v1 bundle keeps validating after v2
// landed (and would NOT validate against v2 — which is exactly the failure
// this registry exists to prevent), pinned schema files never change, and an
// unknown version is refused rather than validated against "whatever is current".
import { describe, expect, it } from 'vitest'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import Ajv2020 from 'ajv/dist/2020'
import { validateAgainstSchema } from '../schemaValidator'
import {
  CURRENT_EVIDENCE_VERSION,
  EVIDENCE_SCHEMAS,
  EXTENDED_EVIDENCE_VERSION,
  currentEvidenceSchema,
  evidenceSchemaForPlan,
  validateEvidenceDocument,
} from './evidenceSchemas'
import { EVIDENCE_VERSION } from '../evidence'

const repo = process.cwd()
const sha = (rel: string) =>
  createHash('sha256')
    .update(readFileSync(path.join(repo, rel)))
    .digest('hex')

/** A v1 evidence.json frozen in the 2026-09-24 cross-target run (produced before v2 existed). */
const FROZEN_V1 =
  'evidence/acvp-xplat/2026-09-24/targets/wasm-cpp/ML-DSA-sigVer-FIPS204/evidence.json'
const FROZEN_V1_NATIVE =
  'evidence/acvp-xplat/2026-09-24/targets/linux-arm64-rust/ML-KEM-encapDecap-FIPS203/evidence.json'

describe('evidence schema versions', () => {
  it('pins the bytes of every released schema version', () => {
    expect(sha('src/services/acvp/schemas/evidence.v1.schema.json')).toBe(
      '15f498c58133cdb386635b60186020dcff2ed381fb97eaec768ddd93e30c6b08'
    )
    expect(sha('src/services/acvp/schemas/evidence.v2.schema.json')).toBe(
      '238d90d7b8ff75c80a683427fa131a7a1dc9231ba2b2fdedfc9892734bdaea83'
    )
    expect(sha('src/services/acvp/schemas/evidence.v3.schema.json')).toBe(
      '8c92e593f323b6bf726e6996ad86d14dda76358bdbe32b98cf527007702b39d8'
    )
  })

  it('every registered schema declares its own version as the evidenceVersion const', () => {
    for (const [version, schema] of Object.entries(EVIDENCE_SCHEMAS)) {
      const props = schema.properties as Record<string, { const?: string }>
      expect(props.evidenceVersion.const).toBe(version)
      expect(() =>
        new Ajv2020({ strict: true, allowUnionTypes: true }).compile(schema)
      ).not.toThrow()
    }
    expect(CURRENT_EVIDENCE_VERSION).toBe(EVIDENCE_VERSION)
  })

  it('a frozen v1 bundle still validates after v2 landed — and only under its own version', () => {
    for (const rel of [FROZEN_V1, FROZEN_V1_NATIVE]) {
      const doc = JSON.parse(readFileSync(path.join(repo, rel), 'utf8')) as Record<string, unknown>
      expect(doc.evidenceVersion).toBe('pqctoday.acvp-evidence/1')
      expect(validateEvidenceDocument(doc)).toEqual([])
      // Against the current (v2) schema it is rejected — the pre-fix comparator bug.
      expect(validateAgainstSchema(currentEvidenceSchema(), doc).length).toBeGreaterThan(0)
    }
  })

  it('an unknown or missing evidenceVersion is refused, never validated against the current schema', () => {
    expect(
      validateEvidenceDocument({ evidenceVersion: 'pqctoday.acvp-evidence/99' })[0]
    ).toMatchObject({
      keyword: 'version',
    })
    expect(validateEvidenceDocument(null)[0].keyword).toBe('version')
  })

  it('relabelling a v1 document as v2 does not make it valid', () => {
    const doc = JSON.parse(readFileSync(path.join(repo, FROZEN_V1), 'utf8')) as Record<
      string,
      unknown
    >
    doc.evidenceVersion = 'pqctoday.acvp-evidence/2'
    expect(validateEvidenceDocument(doc).map((d) => d.path)).toContain('$.vendorDefinedMechanisms')
  })
  it('version 3 belongs to the extended plan; version 2 stays the bounded profile’s evidence', () => {
    expect(EXTENDED_EVIDENCE_VERSION).toBe('pqctoday.acvp-evidence/3')
    expect(CURRENT_EVIDENCE_VERSION).toBe('pqctoday.acvp-evidence/2')
    expect(evidenceSchemaForPlan('pqctoday.acvp-plan/1')).toBe(
      EVIDENCE_SCHEMAS[CURRENT_EVIDENCE_VERSION]
    )
    expect(evidenceSchemaForPlan('pqctoday.acvp-plan/2')).toBe(
      EVIDENCE_SCHEMAS[EXTENDED_EVIDENCE_VERSION]
    )
  })

  it('a version 3 document needs summary.byInputKind and rejects an unknown inputKind', () => {
    const base = JSON.parse(readFileSync(path.join(repo, FROZEN_V1), 'utf8')) as Record<
      string,
      unknown
    >
    // A minimal v3 document derived from a frozen v2-shaped one is built in pipeline.extended.test.ts;
    // here only the two rules that distinguish v3 are checked on the schema itself.
    const v3 = EVIDENCE_SCHEMAS[EXTENDED_EVIDENCE_VERSION] as {
      properties: {
        summary: { required: string[] }
        cases: { items: { properties: { inputKind: { enum: string[] } } } }
      }
    }
    expect(v3.properties.summary.required).toContain('byInputKind')
    expect(v3.properties.cases.items.properties.inputKind.enum).toEqual([
      'test-input-m',
      'computed-mu',
      'computed-ph',
      'key-import-result',
    ])
    expect(base.evidenceVersion).toBe('pqctoday.acvp-evidence/1')
  })
})
