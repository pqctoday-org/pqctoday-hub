// SPDX-License-Identifier: GPL-3.0-only
/**
 * Evidence records for Playground workbench rows (useAcvpSuite), read from
 * the generated case-evidence.acvp.generated.json — see caseEvidence.ts.
 * A row id that is not a registered row template (skip rows, `-err-` rows,
 * unregistered sections) returns [] and must render without a badge.
 *
 * The file is 10.8 MB, so it is LOADED ON DEMAND (27 Sep 2026): a static
 * import put it in the app's static module graph, and with it the production
 * build outgrew its heap ceiling and every visitor's entry graph carried it.
 * Only the workbench and its Python bridge need it; they call
 * loadAcvpRowEvidence() first. Until it resolves, evidenceForRowId returns []
 * (no badge), never a guess. Tests and scripts read the file synchronously
 * through acvpRowEvidence.static.ts, which the app never imports.
 */
import { rowTemplateOf, type CaseEvidenceFile, type CaseEvidenceRecord } from './caseEvidence'

let file: CaseEvidenceFile | null = null
let pending: Promise<void> | null = null

export function loadAcvpRowEvidence(): Promise<void> {
  pending ??= import('./case-evidence.acvp.generated.json').then((m) => {
    file = m.default as unknown as CaseEvidenceFile
  })
  return pending
}

export function isAcvpRowEvidenceLoaded(): boolean {
  return file !== null
}

export function evidenceIn(f: CaseEvidenceFile, rowId: string): CaseEvidenceRecord[] {
  const ids = f.index[rowTemplateOf(rowId)] ?? []
  return ids.map((id) => f.records[id]).filter((r): r is CaseEvidenceRecord => Boolean(r)) // eslint-disable-line security/detect-object-injection
}

export function evidenceForRowId(rowId: string): CaseEvidenceRecord[] {
  return file ? evidenceIn(file, rowId) : []
}
