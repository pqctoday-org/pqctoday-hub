// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Revision metadata flags. The legacy component/API name is retained, but
 * absent PR data or matching recorded identities do not establish a review bypass.
 */
import type { RevisionEntry } from '@/hooks/useRevisions'

export type BypassReason = 'no-pr' | 'pr-unknown' | 'self-recorded' | null

/** Describe recorded metadata only; null does not establish a reviewed change. */
export function detectBypass(r: RevisionEntry): BypassReason {
  if (r.pr_number === 0) return 'no-pr'
  if (!Number.isInteger(r.pr_number) || r.pr_number < 0) return 'pr-unknown'
  if (r.proxy_github_handle && r.reviewer_id && r.proxy_github_handle === r.reviewer_id) {
    return 'self-recorded'
  }
  return null
}

const LABELS: Record<NonNullable<BypassReason>, { short: string; tooltip: string }> = {
  'no-pr': {
    short: 'No PR recorded',
    tooltip:
      'This revision records no pull request number. This does not establish how the change was merged or reviewed.',
  },
  'pr-unknown': {
    short: 'PR metadata missing',
    tooltip:
      'Pull request metadata is missing or unusable. The merge and review pathway cannot be inferred.',
  },
  'self-recorded': {
    short: 'Matching recorded identities',
    tooltip:
      'The recorded reviewer and proxy identities match. This alone does not establish who performed the review or whether a review pathway was bypassed.',
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
