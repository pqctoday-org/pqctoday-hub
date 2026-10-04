// SPDX-License-Identifier: GPL-3.0-only
/**
 * ValidationCaseManifest — the typed shape of src/data/validation/vector-manifest.json,
 * the sidecar provenance record for every expected-value vector file under
 * src/data/acvp/ (plan WS-B, B-1..B-6).
 *
 * The JSON Schema in validationCaseManifest.schema.json is the machine
 * contract; these interfaces mirror it for TypeScript consumers (UI badges,
 * the counts generator, the gate). The gate validates the manifest against the
 * schema with ajv on every run.
 *
 * Registering a NEW vector file (e.g. a dedicated ML-DSA sigVer file):
 *   1. Add the file under src/data/acvp/ — the gate fails until it is registered.
 *   2. Generate a skeleton entry with the maintainers' vector-manifest tool
 *      prints a skeleton entry with the file's SHA-256, case containers and
 *      one case record per test case.
 *   3. Paste it into `files[]` and fill every TODO: evidence class, source
 *      (for NIST ACVP-Server material: commit, upstream path, retrieval date,
 *      upstream SHA-256), per-case operation/parameters/expectation, and a
 *      lineage record for any subset / rename / operation change.
 *   4. Run the vector-manifest check and regenerate the validation counts.
 * Changing a vector byte later requires updating `sha256` in the same reviewed
 * commit — that is the point: the gate makes the change visible.
 */
import type { ManifestEvidenceClass } from './evidenceClasses'

export const VALIDATION_CASE_MANIFEST_SCHEMA_VERSION = '1.0.0'

export type EntryStatus = 'active' | 'quarantined'
export type Expectation = 'positive' | 'negative'

/** Where the expected values come from. */
export type SourceKind =
  'nist-acvp-server' | 'published-document' | 'oracle-generated' | 'self-pinned-snapshot'

/** Standing of a cited document — an Internet-Draft is not a standard. */
export type DocumentStatus =
  'nist-final-publication' | 'nist-example-set' | 'rfc' | 'internet-draft' | 'research-paper'

export type TransformationType =
  | 'subset'
  | 'renumber'
  | 'field-rename'
  | 'field-drop'
  | 'field-add'
  | 'value-normalize'
  | 'operation-change'
  | 'derived-within-file'
  | 'inputs-modified-expected-recomputed'
  | 'locally-generated'

export type PublishabilityGap =
  | 'oracle-version-not-recorded'
  | 'generator-script-not-in-repo'
  | 'source-document-hash-not-recorded'
  | 'retrieval-date-not-recorded'

export interface EvidenceDocument {
  title: string
  url: string
  sha256?: string
  retrieved?: string
  /** true when the URL is a third-party mirror, not the publisher. */
  mirror?: boolean
  /** Path of the reviewed copy, relative to pqctoday-priv/local-evidence-cache/. */
  localCopy?: string
}

export interface SourceVerification {
  date: string
  method: string
  result: 'match' | 'partial' | 'mismatch'
  evidence: EvidenceDocument[]
}

export interface NistUpstream {
  repository: string
  /** Immutable git commit (40 hex). */
  revision: string
  /** Path relative to the repository root at `revision`. */
  upstreamPath: string
  /** SHA-256 of the whole upstream file at `revision`. */
  upstreamSha256: string
  /** ISO date the file was retrieved. */
  retrieved: string
  url: string
}

export interface VectorSource {
  kind: SourceKind
  /** Human-readable citation: document + section/example. */
  citation: string
  documentStatus?: DocumentStatus
  url?: string | null
  /** Immutable revision identifier for a document source (RFC number, draft revision…). */
  revision?: string | null
  nist?: NistUpstream
  oracle?: { name: string; version: string | null }
  generator?: string
  verification?: SourceVerification
}

export interface LicenseNote {
  note: string
  reviewed: boolean
}

export interface TransformationStep {
  type: TransformationType
  detail: string
}

export interface LineageRecord {
  id: string
  /** caseIds this record applies to. */
  appliesTo: string[]
  upstreamOperation: string
  localOperation: string
  transformations: TransformationStep[]
}

export type CaseParameterValue = string | number | boolean | null

export interface CaseRecord {
  caseId: string
  /** RFC 6901 JSON pointer into the vector file. */
  pointer: string
  algorithm: { name: string; revision: string | null }
  /** The operation the hub actually executes with this case. */
  operation: string
  parameters: Record<string, CaseParameterValue>
  testType: string
  expectation: Expectation
  upstream?: { tgId?: number; tcId?: number; label?: string }
  /** Case-level override of the file's evidence class. */
  evidenceClass?: ManifestEvidenceClass
  /** Case-level override of the file's status. */
  status?: EntryStatus
  statusReason?: string
  lineage?: string[]
}

export interface CaseContainer {
  pointer: string
  /** array: each element is a case; map: each value is a case; self: the pointer is the case. */
  kind: 'array' | 'map' | 'self'
}

export interface CopyRecord {
  /** Repo-relative path of the copy. */
  path: string
  /**
   * byte-equal: the whole file is identical (shares this entry's identity);
   * embedded-values: the listed case fields are copied into another file;
   * shared-upstream-value: the same value reached that file independently
   * from the same published source (not derived from this vector file).
   */
  kind: 'byte-equal' | 'embedded-values' | 'shared-upstream-value'
  cases?: string[]
  fields?: string[]
  note?: string
}

export interface InFileProvenanceConflict {
  field: string
  inFileValue: string
  reason: string
}

export interface VectorFileEntry {
  id: string
  path: string
  sha256: string
  status: EntryStatus
  statusReason?: string
  evidenceClass: ManifestEvidenceClass
  source: VectorSource
  license: LicenseNote
  caseContainers: CaseContainer[]
  cases: CaseRecord[]
  lineage: LineageRecord[]
  copies: CopyRecord[]
  publishabilityGaps: PublishabilityGap[]
  inFileProvenanceConflict?: InFileProvenanceConflict
  notes?: string
}

export interface ValidationCaseManifest {
  $schema?: string
  $comment?: string
  schemaVersion: string
  vectorRoot: string
  files: VectorFileEntry[]
}

/** Effective class/status of a case after applying case-level overrides. */
export function effectiveCase(
  file: Pick<VectorFileEntry, 'evidenceClass' | 'status'>,
  c: Pick<CaseRecord, 'evidenceClass' | 'status'>
): { evidenceClass: ManifestEvidenceClass; status: EntryStatus } {
  const status: EntryStatus =
    file.status === 'quarantined' ? 'quarantined' : (c.status ?? file.status)
  return { evidenceClass: c.evidenceClass ?? file.evidenceClass, status }
}
