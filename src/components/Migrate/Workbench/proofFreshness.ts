// SPDX-License-Identifier: GPL-3.0-only
/**
 * Proof freshness — B+ remediation 3.7 (2026-08-10).
 *
 * The catalog states that a product supports post-quantum crypto. The proof URL
 * behind that claim is stored, and shown inside the expanded detail, but the row
 * itself said nothing about whether the proof is from last month or from three
 * years ago — and a product row is where an operator actually works. The
 * repository already tracks which products have missing or stale proof
 * (`reports/products-no-proofurl*.json`); that tracking was invisible to the
 * reader, which is the accuracy half of this finding as much as the usability
 * half.
 *
 * This module turns the stored date into one honest label. It deliberately does
 * NOT invent a proof date where none is recorded: "vendor claim, no proof on
 * file" is the true statement in that case, and saying it plainly is the point.
 */
import type { SoftwareItem } from '@/types/MigrateTypes'

export type ProofTone = 'success' | 'warning' | 'muted'

export interface ProofFreshness {
  /** Short pill label — what a scanner reads. */
  label: string
  /** One sentence: what the proof demonstrates, and how old it is. */
  detail: string
  tone: ProofTone
  /** Age in whole months, or null when no usable date is recorded. */
  ageMonths: number | null
  /** True when the claim rests on the vendor's word rather than a document. */
  vendorClaimOnly: boolean
}

/** Months a proof stays "current" before it is worth re-checking. Chosen to
 *  match the catalog's own re-verification cadence rather than picked freely —
 *  products are swept roughly twice a year. */
const STALE_AFTER_MONTHS = 18

function monthsSince(iso: string): number | null {
  // Parse date-only ISO strings as LOCAL calendar dates. `new Date('2026-06-01')`
  // is UTC midnight, which getFullYear()/getMonth() read back as May 31 in any
  // negative-offset timezone — off by one month whenever the date falls on the
  // 1st (found when the test suite failed on Sep 1 with an off-by-one age).
  const dateOnly = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso)
  const then = dateOnly
    ? new Date(Number(dateOnly[1]), Number(dateOnly[2]) - 1, Number(dateOnly[3]))
    : new Date(iso)
  if (Number.isNaN(then.getTime())) return null
  const now = new Date()
  const months = (now.getFullYear() - then.getFullYear()) * 12 + (now.getMonth() - then.getMonth())
  return months < 0 ? 0 : months
}

function ageWords(months: number): string {
  if (months < 1) return 'this month'
  if (months === 1) return '1 month ago'
  if (months < 24) return `${months} months ago`
  const years = Math.floor(months / 12)
  return `${years} years ago`
}

/**
 * The freshness verdict for one catalog product.
 *
 * Three honest outcomes, in decreasing order of what we can stand behind:
 *  - a dated proof document        → success / warning depending on age
 *  - a proof document with no date → muted, and we say the date is missing
 *  - no proof at all               → muted, labelled "vendor claim"
 */
export function proofFreshness(product: SoftwareItem): ProofFreshness {
  const summary = product.proofRelevantInfo?.trim()

  if (!product.proofUrl) {
    return {
      label: 'Vendor claim',
      detail:
        'This product’s post-quantum support is the vendor’s own statement — we hold no proof document for it yet.',
      tone: 'warning',
      ageMonths: null,
      vendorClaimOnly: true,
    }
  }

  const months = product.proofPublicationDate ? monthsSince(product.proofPublicationDate) : null

  if (months === null) {
    return {
      label: 'Proof on file',
      detail: summary
        ? `${summary} We hold the document but not its publication date, so we cannot say how current it is.`
        : 'We hold a proof document for this claim, but not its publication date, so we cannot say how current it is.',
      tone: 'muted',
      ageMonths: null,
      vendorClaimOnly: false,
    }
  }

  const stale = months > STALE_AFTER_MONTHS
  const prefix = summary ? `${summary} ` : ''
  return {
    label: stale ? `Proof ${ageWords(months)}` : `Proof ${ageWords(months)}`,
    detail: stale
      ? `${prefix}Published ${ageWords(months)} — old enough that the product may have moved on since. Worth re-checking against the vendor before you rely on it.`
      : `${prefix}Published ${ageWords(months)}.`,
    tone: stale ? 'warning' : 'success',
    ageMonths: months,
    vendorClaimOnly: false,
  }
}
