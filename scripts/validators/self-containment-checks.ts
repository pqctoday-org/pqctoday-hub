// SPDX-License-Identifier: GPL-3.0-only
/**
 * self-containment-checks.ts — DS03 + DS19 + DS20 (STUB, not implemented)
 *
 * validate-data-integrity.ts has imported runSelfContainmentChecks,
 * runStatusColumnChecks, runVocabTagChecks, and runOrphanCheck from this
 * module since commit 8b8b80d8 (2026-05-10, "feat(phase2.1): missing-
 * reference candidate suggestions via embeddings"). This file itself was
 * never committed — `git log --all --follow` finds zero history for it at
 * any point, on any branch. It is not part of the 2026-04-25 "strip private
 * tooling" removal (that commit predates the first reference to it); it
 * looks like the intended module was written locally and never pushed, or
 * the import was added in anticipation of a file that was never finished.
 *
 * Discovered 2026-07-07 while restoring the OTHER 10 validator modules that
 * genuinely were stripped by the 04-25 commit (all recovered cleanly from
 * git history — see scripts/validators/{content-accuracy,cross-ref,
 * enrichment-accuracy,enrichment-crosscheck,freshness,graph-consistency,
 * local-resource,report-builder,source-document-quality,url-coverage}-checks.ts).
 * This one has no history to recover from.
 *
 * This stub exists ONLY so validate-data-integrity.ts can import successfully
 * and run its other ~19 check families. It deliberately does NOT invent DS03/
 * DS19/DS20 logic — the original rule definitions may differ from any guess
 * made here, and a fabricated check that reports PASS would be worse than an
 * honest SKIP (silent false confidence vs. a visible gap). Real
 * self-containment/status-column/vocab-tag/orphan-row rules need someone who
 * knows the intended DS03/DS19/DS20 spec to write this for real.
 *
 * See: pqctoday-hub-migrate-data-remediation-plan-07072026.md,
 * project_validate_data_integrity_broken.md (memory).
 */

import type { CheckResult } from './types.js'

function stub(id: string, description: string): CheckResult {
  return {
    id,
    category: 'structure',
    description,
    sourceA: 'scripts/validators/self-containment-checks.ts',
    sourceB: null,
    severity: 'WARNING',
    status: 'SKIP',
    findings: [
      {
        csv: '',
        row: null,
        field: '',
        value: '',
        message:
          'Not implemented — this module was never committed (no git history found). ' +
          'Needs real design/implementation, not a guessed stand-in. See file header.',
      },
    ],
  }
}

export function runSelfContainmentChecks(): CheckResult[] {
  return [stub('DS03', 'Data self-containment check (rows do not depend on external un-committed state)')]
}

export function runStatusColumnChecks(): CheckResult[] {
  return [stub('DS19', 'Status column vocabulary/consistency check')]
}

export function runVocabTagChecks(): CheckResult[] {
  return [stub('DS19-VOCAB', 'Controlled-vocabulary tag check')]
}

export function runOrphanCheck(): CheckResult[] {
  return [stub('DS20', 'Trust-path orphan check on restored/deprecated rows')]
}
