// SPDX-License-Identifier: GPL-3.0-only
/**
 * caseEvidence — the per-case evidence record every validation surface
 * renders (plan WS-I: "same case has the same label and source everywhere").
 *
 * The records are GENERATED from the reviewed vector manifest
 * (vector-manifest.json) joined with the static test registry
 * (testRegistry.ts) by the case-evidence generator, into two small
 * files so no UI ships the ~300 KB manifest:
 *   - case-evidence.acvp.generated.json  — workbench rows (useAcvpSuite), keyed
 *     by row-id template (`…-{engine}`)
 *   - case-evidence.kat.generated.json   — katRunner specs, keyed by KatKind
 * The case-evidence check fails when either file is stale.
 *
 * Nothing here infers provenance from a producer string, a button label or
 * an algorithm name: a row or spec that is not in the registry has NO record
 * and must render without an evidence badge.
 */
import type { EvidenceClassId } from './evidenceClasses'

export const CASE_EVIDENCE_SCHEMA = 'pqctoday.case-evidence/v1' as const

/** Public generated coverage matrix + open-gaps register (plan C-6, J-7). */
export const COVERAGE_MATRIX_HREF = '/algorithms?tab=validation&section=coverage'

export type CaseParamValue = string | number | boolean | null

export interface CaseEvidenceRecord {
  /** `${registryTestId}#${caseKey}` — the coverage matrix's case id. */
  id: string
  /** Registry test id (acvp.05d.sigver, kat.hmac-verify, …) and its title. */
  test: string
  title: string
  runner: 'useAcvpSuite' | 'katRunner'
  engines: string[]
  /** vector-manifest caseId, or `local:<test>/<n>` for inputs outside the manifest. */
  caseId: string
  evidenceClass: EvidenceClassId
  polarity: 'positive' | 'negative'
  /** Algorithm and revision as the manifest records them (manifest cases only). */
  algorithm?: string
  /** The operation the hub executes with this case (manifest `operation`). */
  operation?: string
  testType?: string
  parameters: Record<string, CaseParamValue>
  upstream?: { tgId?: number; tcId?: number; label?: string }
  /** Where the expected value comes from. Absent = generated at run time. */
  source?: { citation: string; url?: string; revision?: string }
  /** PKCS #11 capability cells the case drives, e.g. "CKM_ML_DSA verify ML-DSA-44". */
  exercises: string[]
  /** Transformations, publishability gaps and notes a reader must see. */
  limitations: string[]
}

export interface CaseEvidenceFile {
  schema: typeof CASE_EVIDENCE_SCHEMA
  /** Formatting-independent hashes of the inputs, for the --check gate. */
  inputs: { manifestSha256: string; registrySha256: string }
  records: Record<string, CaseEvidenceRecord>
  /** acvp file: row-id template → record ids. kat file: KatKind key → record ids. */
  index: Record<string, string[]>
  /** kat file only: vector file (`acvp/<name>.json`) → its manifest class, or
   *  'unverified' when the file is quarantined or its provenance is unknown. */
  files?: Record<string, EvidenceClassId | 'unverified'>
}

/** A KatKind as plain data (this module does not import the runner). */
export type KatKindLike = { type: string } & Record<string, unknown>

/** Default testIndex per kind (katRunner's own defaults). */
const DEFAULT_TEST_INDEX: Record<string, number> = { 'pbkdf2-derive': 1 }

/**
 * Canonical key of a KatKind: type + its defined fields in key order, with a
 * testIndex equal to the runner's default dropped (so `{ testIndex: 0 }` and
 * no testIndex are the same case).
 */
export function katKindKey(kind: KatKindLike): string {
  const def = DEFAULT_TEST_INDEX[kind.type] ?? 0
  const parts = Object.keys(kind)
    .filter((k) => k !== 'type')
    .filter((k) => kind[k] !== undefined) // eslint-disable-line security/detect-object-injection
    .filter((k) => !(k === 'testIndex' && kind[k] === def)) // eslint-disable-line security/detect-object-injection
    .sort()
    .map((k) => `${k}=${String(kind[k])}`) // eslint-disable-line security/detect-object-injection
  return [kind.type, ...parts].join(';')
}

/** Engine labels the workbench appends to row ids. */
const ENGINE_LABELS = ['C++', 'Rust'] as const

/** Concrete row id → the registry's `{engine}` template (or itself when engine-less). */
export function rowTemplateOf(rowId: string): string {
  for (const label of ENGINE_LABELS) {
    if (rowId.includes(label)) return rowId.split(label).join('{engine}')
  }
  return rowId
}

/** Short, human-readable parameter list ("parameterSet ML-DSA-44 · contextBytes 99"). */
export function formatParameters(p: Record<string, CaseParamValue>): string {
  return Object.entries(p)
    .filter(([, v]) => v !== null && v !== '' && v !== undefined)
    .map(([k, v]) => `${k} ${String(v)}`)
    .join(' · ')
}
