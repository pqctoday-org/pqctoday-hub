// SPDX-License-Identifier: AGPL-3.0-only
/**
 * One wording for the review status of the five certification modules the owner reviewed on
 * 22 October 2026 (Cryptographic Product Certification, FIPS 140-3, Common Criteria / EUCC /
 * eIDAS, PCI, ACVP Lab Workflow).
 *
 * The owner's sign-off and a laboratory or certification-body review are different things, and
 * the page says both plainly: the owner has reviewed the module, and no accredited laboratory or
 * certification body has. Which sign-off sentence shows follows the module's `lastReviewed`
 * (content.ts): a module with a review date reads "signed off on <date>"; a module whose facts
 * were corrected afterwards retains that historical date while qualifying later changes.
 * A module without a retained review date reads "corrected since the sign-off, awaiting
 * re-sign-off". Editing never creates a new owner or laboratory review.
 */

/** What a module says when facts were corrected after the owner's last sign-off. */
export const AWAITING_RESIGNOFF_NOTICE =
  "Corrected since the PQC Today owner's last sign-off; awaiting re-sign-off"

/** What no one has done yet; the same words on every one of the five modules. */
export const NOT_LAB_REVIEWED =
  'Not yet reviewed by an accredited laboratory or certification body.'

/** Heading of the "awaiting re-sign-off" state (also the ACVP notice heading). */
export const AWAITING_RESIGNOFF_LABEL = 'Corrected since the owner review, awaiting re-sign-off'

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

/** `2026-10-22` → `22 October 2026`; anything that is not an ISO date is returned unchanged. */
export function longDate(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso)
  if (!m) return iso
  const month = MONTHS[Number(m[2]) - 1]
  return month ? `${Number(m[3])} ${month} ${m[1]}` : iso
}

function isIsoDate(value: string | undefined): value is string {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const timestamp = Date.parse(`${value}T00:00:00Z`)
  return Number.isFinite(timestamp) && new Date(timestamp).toISOString().slice(0, 10) === value
}

/**
 * The review-status sentences for a module, given its `lastReviewed` (content.ts), or
 * undefined when no review date is retained. A later edit qualifies the historical review;
 * editing does not manufacture a new review or erase its record.
 */
export function ownerReviewStatusText(
  lastReviewed: string | undefined,
  lastEdited?: string
): string {
  if (isIsoDate(lastReviewed) && isIsoDate(lastEdited) && lastEdited > lastReviewed) {
    return `Owner review recorded on ${longDate(lastReviewed)}. Content updated ${longDate(lastEdited)} since that review; these changes are not covered by that recorded review. ${NOT_LAB_REVIEWED}`
  }
  const sentence = lastReviewed
    ? `Reviewed and signed off by the PQC Today owner on ${longDate(lastReviewed)}.`
    : `${AWAITING_RESIGNOFF_NOTICE}.`
  return `${sentence} ${NOT_LAB_REVIEWED}`
}
