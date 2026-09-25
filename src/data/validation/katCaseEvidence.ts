// SPDX-License-Identifier: GPL-3.0-only
/**
 * Evidence records for katRunner specs (Algorithms KAT view, Learn KAT
 * panels), read from the generated case-evidence.kat.generated.json — see
 * caseEvidence.ts. A KatKind with no registered case returns [] and must
 * render without a badge.
 */
import data from './case-evidence.kat.generated.json'
import {
  katKindKey,
  type CaseEvidenceFile,
  type CaseEvidenceRecord,
  type KatKindLike,
} from './caseEvidence'
import type { EvidenceClassId } from './evidenceClasses'

const file = data as unknown as CaseEvidenceFile

export function evidenceForKatKind(kind: KatKindLike): CaseEvidenceRecord[] {
  const ids = file.index[katKindKey(kind)] ?? []
  return ids.map((id) => file.records[id]).filter((r): r is CaseEvidenceRecord => Boolean(r)) // eslint-disable-line security/detect-object-injection
}

/** A vector file's manifest class, e.g. katVectorFileClass('acvp/hmac_test.json'). */
export function katVectorFileClass(path: string): EvidenceClassId | 'unverified' | undefined {
  return (file.files ?? {})[path] // eslint-disable-line security/detect-object-injection
}
