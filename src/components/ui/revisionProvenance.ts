// SPDX-License-Identifier: AGPL-3.0-only
import type { RevisionEntry } from '@/hooks/useRevisions'

/** A recorded author flag is not a review or approval outcome. */
export function revisionAuthorshipLabel(authoredByLlm: unknown): string {
  if (authoredByLlm === true) return 'LLM authorship recorded'
  if (authoredByLlm === false) return 'Non-LLM authorship recorded'
  return 'Authorship not recorded'
}

/** Describe the existing metadata without claiming an independent human review. */
export function revisionReviewLabel(revision: RevisionEntry): string {
  const reviewer = revision.reviewer_display?.trim() || revision.reviewer_id?.trim()
  const method = revision.approval_method?.trim()
  if (!reviewer && !method) return 'Review metadata not recorded'
  return `${reviewer ? `Recorded reviewer: ${reviewer}` : 'Reviewer not recorded'} · ${
    method ? `recorded method: ${method}` : 'approval method not recorded'
  }`
}

/** Syntax check only: recorded abbreviated/full Git hashes, not proof the commit exists. */
export function hasCommitReference(reference: unknown): reference is string {
  return typeof reference === 'string' && /^[0-9a-f]{7,40}$/i.test(reference)
}

export function nonCommitReferenceLabel(reference: string | undefined): string {
  if (reference === 'baseline') return 'Initial import'
  if (reference === 'pending') return 'Commit reference pending'
  return reference ? `Recorded reference: ${reference}` : 'Commit reference not recorded'
}
