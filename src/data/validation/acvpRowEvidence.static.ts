// SPDX-License-Identifier: GPL-3.0-only
/**
 * Synchronous access to the workbench evidence records, for tests and
 * scripts ONLY. The app must use acvpRowEvidence.ts (loaded on demand);
 * importing this module from app code puts the 10.8 MB file back into the
 * static module graph.
 */
import data from './case-evidence.acvp.generated.json'
import { type CaseEvidenceFile, type CaseEvidenceRecord } from './caseEvidence'
import { evidenceIn } from './acvpRowEvidence'

const file = data as unknown as CaseEvidenceFile

export function evidenceForRowId(rowId: string): CaseEvidenceRecord[] {
  return evidenceIn(file, rowId)
}
