// SPDX-License-Identifier: GPL-3.0-only
/**
 * Review status of the acvp-lab-workflow module.
 *
 * The ACVP validation remediation plan (2026-09-24, WS-I) requires this module
 * to be reviewed by at least one validation-lab practitioner before it may be
 * described as a lab training resource. Until that review is recorded, the
 * module ships as a draft: `workInProgress: true` in manifest.ts (catalogue
 * "WIP" chip + header "Work in progress" chip), no `lastReviewed` in
 * content.ts, and this notice on every tab that teaches or exercises.
 *
 * When the review happens: record it with record_module_review.py (which sets
 * content.ts lastReviewed), flip `state` to 'practitioner-reviewed', name the
 * reviewer role in `detail`, and drop `workInProgress` from the manifest.
 */
export const REVIEW_STATUS = {
  state: 'draft-awaiting-practitioner-review',
  label: 'Draft — awaiting review by a validation-lab practitioner',
  detail:
    'This module is a draft. It has not yet been reviewed by an accredited testing-laboratory practitioner and is not a lab training resource. Every factual statement cites its primary source; where the Hub Library does not carry a source yet, the citation links the source directly.',
} as const
