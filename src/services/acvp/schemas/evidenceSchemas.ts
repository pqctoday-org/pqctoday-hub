// SPDX-License-Identifier: GPL-3.0-only
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
import { validateAgainstSchema, type SchemaDiagnostic } from '../schemaValidator'

export const EVIDENCE_SCHEMAS: Readonly<Record<string, Record<string, unknown>>> = {
  'pqctoday.acvp-evidence/1': v1 as Record<string, unknown>,
  'pqctoday.acvp-evidence/2': v2 as Record<string, unknown>,
}

export const CURRENT_EVIDENCE_VERSION = 'pqctoday.acvp-evidence/2'

/** The schema the current producer (buildEvidence, the Python runner) must satisfy. */
export const currentEvidenceSchema = (): Record<string, unknown> =>
  EVIDENCE_SCHEMAS[CURRENT_EVIDENCE_VERSION]

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
