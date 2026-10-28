// SPDX-License-Identifier: AGPL-3.0-only
/**
 * The 2030 "deprecated" / 2035 "disallowed" dates shown for classical
 * algorithms come from NIST IR 8547, final since 27 October 2026 (it replaced
 * the November 2024 initial public draft), and written for systems that follow
 * NIST standards and guidelines. Only NIST rows that
 * carry exactly those labels are attributed to it; the same wording on a row
 * from another body is shown as an unrecorded source rather than borrowed
 * from NIST, and older NIST dates (SP 800-131A era) get no IR 8547 label.
 */
export const TRANSITION_GUIDANCE_NOTE =
  'These dates come from NIST IR 8547 (final, October 2026): quantum-vulnerable public-key algorithms at 112 bits of security or more are deprecated after 2030 and disallowed under NIST standards and guidelines after 2035. They apply to systems that follow NIST guidance; other jurisdictions set their own dates. Separately, Executive Order 14412 (June 2026) directs US federal agencies to move high-value assets and high-impact systems (not National Security Systems) to post-quantum key establishment by 31 December 2030 and post-quantum signatures by 31 December 2031.'

export const DATE_SOURCE_NOT_RECORDED_NOTE =
  'This row carries the same wording as the NIST IR 8547 dates, but its region is not NIST and the catalogue does not record which document sets this date for that body.'

export type TransitionDateSource = 'nist-ir-8547' | 'not-recorded'

const IR_8547_LABEL = /^(2030 \(Deprecated\)( \/ 2035 \(Disallowed\))?|2035 \(Disallowed\))$/

/**
 * Which source the UI may name for a transition date label, or null when the
 * label is not one of the IR 8547 forms (the label is then shown on its own).
 */
export function transitionDateSource(label: string, region: string): TransitionDateSource | null {
  if (!IR_8547_LABEL.test(label.trim())) return null
  return region === 'NIST' ? 'nist-ir-8547' : 'not-recorded'
}
