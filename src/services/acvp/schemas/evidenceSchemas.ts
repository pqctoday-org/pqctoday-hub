// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Every evidence.json schema version ever produced, pinned. A document is
 * validated against the schema of ITS OWN `evidenceVersion` — never against
 * whatever the current producer emits — so frozen evidence runs replay
 * forever. Changing the evidence shape means: copy the current schema to a new
 * `evidence.v<N+1>.schema.json`, bump EVIDENCE_VERSION in ../evidence.ts, add the
 * entry here. Existing files are never edited (evidenceSchemas.test.ts pins
 * their SHA-256).
 */
import v1 from './evidence.v1.schema.json'
import v2 from './evidence.v2.schema.json'
import v3 from './evidence.v3.schema.json'
import { validateAgainstSchema, type SchemaDiagnostic } from '../schemaValidator'

export const EVIDENCE_SCHEMAS: Readonly<Record<string, Record<string, unknown>>> = {
  'pqctoday.acvp-evidence/1': v1 as Record<string, unknown>,
  'pqctoday.acvp-evidence/2': v2 as Record<string, unknown>,
  'pqctoday.acvp-evidence/3': v3 as Record<string, unknown>,
}

/** Evidence of the bounded plan profile (plan version 1): what the cross-platform runner and the Python runner produce. */
export const CURRENT_EVIDENCE_VERSION = 'pqctoday.acvp-evidence/2'

/** Evidence of the extended plan profile (plan version 2): adds the per-case inputKind. */
export const EXTENDED_EVIDENCE_VERSION = 'pqctoday.acvp-evidence/3'

/** The schema the current producer (buildEvidence, the Python runner) must satisfy. */
export const currentEvidenceSchema = (): Record<string, unknown> =>
  EVIDENCE_SCHEMAS[CURRENT_EVIDENCE_VERSION]

/** The schema buildEvidence must satisfy for a given plan version. */
export const evidenceSchemaForPlan = (planVersion: string): Record<string, unknown> =>
  EVIDENCE_SCHEMAS[
    planVersion === 'pqctoday.acvp-plan/2' ? EXTENDED_EVIDENCE_VERSION : CURRENT_EVIDENCE_VERSION
  ]

/** Validate an evidence document against the schema of its own declared version. */
export const validateEvidenceDocument = (doc: unknown): SchemaDiagnostic[] => {
  const version =
    doc !== null && typeof doc === 'object' && !Array.isArray(doc)
      ? (doc as Record<string, unknown>).evidenceVersion
      : undefined
  const schema = typeof version === 'string' ? EVIDENCE_SCHEMAS[version] : undefined
  if (!schema) {
    return [
      {
        path: '$.evidenceVersion',
        keyword: 'version',
        reason: `unknown evidenceVersion ${JSON.stringify(version)} (known: ${Object.keys(EVIDENCE_SCHEMAS).join(', ')})`,
      },
    ]
  }
  return validateAgainstSchema(schema, doc)
}
