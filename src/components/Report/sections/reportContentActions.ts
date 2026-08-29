// SPDX-License-Identifier: GPL-3.0-only
// Share/export actions for /report, extracted from ReportContent.tsx so every
// section module can reuse them without reaching into the top-level
// component. Pure functions over their explicit params — no component state.
import toast from 'react-hot-toast'
import { usePersonaStore } from '../../../store/usePersonaStore'
import { encodeShareToken } from '@/utils/reportShareToken'
import type { AssessmentResult } from '../../../hooks/assessmentTypes'

export const printReport = () => {
  window.print()
}

/**
 * The real, token-minting share mechanism for /report (ACCURACY-0708-2):
 * mints a self-contained `?share=<v2 token>` URL that base64url-encodes the
 * sender's exact computed `AssessmentResult` (plus persona) directly in the
 * URL — no server/session lookup involved, so a fresh visitor with no local
 * assessment state can still decode and render it (see ReportView.tsx's
 * hydration effect, which reads `?share=` via `decodeShareToken`).
 *
 * For an already-shared/example view (`shared`), re-share the URL the
 * recipient opened rather than regenerating a token from the recipient's own
 * assessment input, which would not match the report they're looking at.
 *
 * This is the SINGLE source of truth for building a /report share URL — the
 * global top-bar ShareButton (registered via `usePageActionsStore` in
 * ReportView.tsx) calls this so it always produces a working, self-contained
 * link, never a bare-path fallback. Share lives ONLY in the top bar
 * (2026-08-27 remediation) — `shareReport` below is the native-share-sheet
 * mechanism that registration ultimately drives.
 */
export const buildReportShareUrl = (result: AssessmentResult, shared: boolean): string => {
  if (shared) return window.location.href
  const personaState = usePersonaStore.getState()
  const token = encodeShareToken({
    result,
    persona: personaState.selectedPersona,
  })
  return `${window.location.origin}${window.location.pathname}?share=${token}`
}

/**
 * ACCURACY-0708-2: share the sender's exact computed `result` as a snapshot
 * (v2 token) rather than the partial quick-track inputs the old v1 token
 * carried — decode then renders this directly, with no recompute, so the
 * recipient sees precisely what's on screen right now.
 */
export const shareReport = async (result: AssessmentResult, shared: boolean) => {
  const url = buildReportShareUrl(result, shared)

  if (navigator.share) {
    try {
      await navigator.share({
        title: 'PQC Risk Assessment Report',
        text: `Quantum Risk Score: ${result.riskScore}/100 — ${result.narrative}`,
        url,
      })
    } catch (err) {
      // Ignore the user cancelling the native share sheet; surface real failures.
      if (err instanceof Error && err.name !== 'AbortError') {
        toast.error('Could not share the report link.')
      }
    }
  } else {
    // Desktop browsers have no navigator.share — copy the link and CONFIRM it,
    // otherwise the click looks like it did nothing.
    try {
      await navigator.clipboard.writeText(url)
      toast.success('Report link copied to clipboard.')
    } catch {
      toast.error('Could not copy the report link.')
    }
  }
}

export const exportAlgorithmMigrationsCsv = (result: AssessmentResult) => {
  const hasEffort = result.migrationEffort && result.migrationEffort.length > 0
  const effortMap = new Map(result.migrationEffort?.map((e) => [e.algorithm, e]))

  const headers = hasEffort
    ? [
        'Algorithm',
        'Quantum Vulnerable',
        'PQC Replacement',
        'Urgency',
        'Migration Effort',
        'Estimated Scope',
        'Rationale',
        'Notes',
      ]
    : ['Algorithm', 'Quantum Vulnerable', 'PQC Replacement', 'Urgency', 'Notes']

  const rows = result.algorithmMigrations.map((algo) => {
    const effort = effortMap.get(algo.classical)
    const baseRow = [
      algo.classical,
      algo.quantumVulnerable ? 'Yes' : 'No',
      algo.replacement,
      algo.urgency,
    ]
    if (hasEffort) {
      baseRow.push(
        effort?.complexity ?? 'N/A',
        effort?.estimatedScope ?? 'N/A',
        `"${(effort?.rationale ?? '').replace(/"/g, '""')}"`
      )
    }
    baseRow.push(`"${algo.notes.replace(/"/g, '""')}"`)
    return baseRow
  })

  const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `pqc-risk-assessment-${new Date(result.generatedAt).toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}
