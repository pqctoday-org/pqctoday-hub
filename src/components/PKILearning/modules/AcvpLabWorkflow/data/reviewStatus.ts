// SPDX-License-Identifier: AGPL-3.0-only
import { MODULE_LAST_REVIEWED } from '@/data/moduleContentRegistry'
import { NOT_LAB_REVIEWED, longDate } from '@/components/PKILearning/common/moduleReviewStatus'

/**
 * Review status of the acvp-lab-workflow module.
 *
 * Owner decisions: 22 October 2026 the owner reviewed the module (the earlier rule that a
 * validation-lab practitioner must review it first was replaced by owner review); the sign-off
 * was reset after the 23 October corrections to the statements about the ACVP specification's
 * revision history; 24 October 2026 the owner renewed it (the review date is `lastReviewed` in
 * content.ts, recorded by record_module_review). The module is not presented as a lab training
 * resource, and the notice keeps the required validation disclaimers on every tab that teaches or
 * exercises. The sign-off and lab-review sentences are the ones the other four certification
 * modules show (common/moduleReviewStatus.ts).
 */
const reviewed = MODULE_LAST_REVIEWED['acvp-lab-workflow']

export const REVIEW_STATUS = {
  state: 'owner-signed-off',
  label: `Reviewed and signed off by the PQC Today owner on ${reviewed ? longDate(reviewed) : 'an unrecorded date'}`,
  detail: `${NOT_LAB_REVIEWED} It is not a laboratory training resource and not a substitute for an accredited testing laboratory. Every factual statement cites its primary source; where the Hub Library does not carry a source yet, the citation links the source directly.`,
} as const
