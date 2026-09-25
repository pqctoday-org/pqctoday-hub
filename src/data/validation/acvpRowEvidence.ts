// SPDX-License-Identifier: GPL-3.0-only
/**
 * Evidence records for Playground workbench rows (useAcvpSuite), read from
 * the generated case-evidence.acvp.generated.json — see caseEvidence.ts.
 * A row id that is not a registered row template (skip rows, `-err-` rows,
 * unregistered sections) returns [] and must render without a badge.
 */
import data from './case-evidence.acvp.generated.json'
import { rowTemplateOf, type CaseEvidenceFile, type CaseEvidenceRecord } from './caseEvidence'

const file = data as unknown as CaseEvidenceFile

export function evidenceForRowId(rowId: string): CaseEvidenceRecord[] {
  const ids = file.index[rowTemplateOf(rowId)] ?? []
  return ids.map((id) => file.records[id]).filter((r): r is CaseEvidenceRecord => Boolean(r)) // eslint-disable-line security/detect-object-injection
}
