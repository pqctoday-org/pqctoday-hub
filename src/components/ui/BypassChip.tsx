// SPDX-License-Identifier: GPL-3.0-only
/**
 * BypassChip — T08 of the Trust Engine implementation plan.
 *
 * Surfaces visibility (NOT blame) when a revision bypassed the standard
 * collaborative PR-review pathway. Two cases today:
 *
 *  - `pr_number === 0`        → direct local commit (no PR)
 *  - reviewer_id === proxy_   → maintainer self-recorded their own approval
 *    github_handle             via the offline-attestation flow
 *
 * Per §16.3 #9 of trust-engine-explainability.md: "Surface in /revisions a
 * maintainer-as-reviewer flag (when the reviewer is a maintainer who could
 * in theory have skipped checks). Not a block, just visibility."
 */
import type { RevisionEntry } from '@/hooks/useRevisions'

export type BypassReason = 'no-pr' | 'self-recorded' | null

/** Detect the bypass reason for a revision entry, or null if no bypass. */
export function detectBypass(r: RevisionEntry): BypassReason {
  if (r.pr_number === 0) return 'no-pr'
  if (r.proxy_github_handle && r.reviewer_id && r.proxy_github_handle === r.reviewer_id) {
    return 'self-recorded'
  }
  return null
}

const LABELS: Record<NonNullable<BypassReason>, { short: string; tooltip: string }> = {
  'no-pr': {
    short: 'no-PR',
    tooltip:
      'Direct commit to main without a pull request — bypassed the standard collaborative review pathway. Visibility flag, not a block.',
  },
  'self-recorded': {
    short: 'self-recorded',
    tooltip:
      'Reviewer also recorded their own offline attestation. Bypassed the maintainer-as-proxy pattern. Visibility flag, not a block.',
  },
}

export function BypassChip({ revision }: { revision: RevisionEntry }) {
  const reason = detectBypass(revision)
  if (!reason) return null
  const { short, tooltip } = LABELS[reason]
  return (
    <span
      className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium uppercase tracking-wide text-muted-foreground bg-muted border border-border"
      title={tooltip}
      aria-label={tooltip}
    >
      {short}
    </span>
  )
}
