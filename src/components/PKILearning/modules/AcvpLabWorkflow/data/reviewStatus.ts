// SPDX-License-Identifier: AGPL-3.0-only
import {
  AWAITING_RESIGNOFF_LABEL,
  NOT_LAB_REVIEWED,
  OWNER_SIGNOFF_DATE_LABEL,
} from '@/components/PKILearning/common/moduleReviewStatus'

/**
 * Review status of the acvp-lab-workflow module.
 *
 * Owner decision, 22 October 2026: the module is reviewed by the owner, who
 * signed it off after a fact-by-fact review; the earlier rule that a
 * validation-lab practitioner must review it first was replaced by owner
 * review. The module is not presented as a lab training resource, and the
 * notice keeps the required validation disclaimers on every tab that teaches
 * or exercises. content.ts carries no lastReviewed while the sign-off is being
 * renewed after the 23 October 2026 corrections. The sign-off and lab-review sentences are the
 * ones the other four certification modules show (common/moduleReviewStatus.ts).
 */
export const REVIEW_STATUS = {
  state: 'corrected-awaiting-owner-review',
  label: AWAITING_RESIGNOFF_LABEL,
  detail: `This module was reviewed and signed off by the PQC Today owner on ${OWNER_SIGNOFF_DATE_LABEL}. Statements about the revision history of the ACVP specification were corrected afterwards, so the sign-off is being renewed. ${NOT_LAB_REVIEWED} It is not a laboratory training resource and not a substitute for an accredited testing laboratory. Every factual statement cites its primary source; where the Hub Library does not carry a source yet, the citation links the source directly.`,
} as const
