// SPDX-License-Identifier: AGPL-3.0-only
/**
 * The only door from My work and Updates to analytics (decision J5: no learner text goes to analytics).
 *
 * An event is one of a fixed list of action names, with an optional small whole number (a count). There
 * is no parameter that can carry text, and `myWorkPrivacy.test.ts` checks that nothing else in My work
 * imports the analytics module.
 */
import { logEvent } from '@/utils/analytics'

export type MyWorkAction =
  | 'comment_added'
  | 'comment_edited'
  | 'comment_deleted'
  | 'comment_failed'
  | 'answer_saved'
  | 'answer_removed'
  | 'reference_saved'
  | 'output_filed'
  | 'export_markdown'
  | 'updates_opened'
  | 'update_reviewed'
  | 'update_marked_seen'
  | 'updates_digest_opened'

/** Counts only: how many items, never what they say. */
export function trackMyWork(action: MyWorkAction, count?: number): void {
  const label =
    typeof count === 'number' && Number.isFinite(count) ? String(Math.trunc(count)) : undefined
  logEvent('My Work', action, label)
}
